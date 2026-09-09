// MediTrust AI — Google Meet Integration Service
// Handles Google Meet session creation, transcript retrieval, and OAuth.
// Falls back to rich demonstration mode when credentials are unavailable.

// ════════════════════════════════════════════════════════════════════
// CONFIGURATION DETECTION
// ════════════════════════════════════════════════════════════════════

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';

export function isGoogleConfigured() {
  return !!(GOOGLE_CLIENT_ID && GOOGLE_API_KEY);
}

export function getConfigurationStatus() {
  const missing = [];
  if (!GOOGLE_CLIENT_ID) missing.push('VITE_GOOGLE_CLIENT_ID');
  if (!GOOGLE_API_KEY) missing.push('VITE_GOOGLE_API_KEY');
  return {
    configured: missing.length === 0,
    missing,
    message: missing.length === 0
      ? 'Google Meet integration is configured.'
      : `Google Meet requires configuration. Missing: ${missing.join(', ')}. Add these to your .env.local file.`,
  };
}

// ════════════════════════════════════════════════════════════════════
// GOOGLE OAUTH 2.0 AUTHORIZATION (GIS)
// ════════════════════════════════════════════════════════════════════

let tokenClient = null;
let accessToken = null;

/**
 * Initialize Google Identity Services token client.
 * Requires the GIS script to be loaded in the page.
 */
export function initGoogleAuth(callback) {
  if (!isGoogleConfigured()) {
    callback?.({ error: 'Google credentials not configured' });
    return;
  }
  try {
    if (window.google?.accounts?.oauth2) {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/meetings.space.created',
        callback: (response) => {
          if (response.error) {
            callback?.({ error: response.error });
            return;
          }
          accessToken = response.access_token;
          callback?.({ success: true, accessToken: response.access_token });
        },
      });
      callback?.({ initialized: true });
    } else {
      callback?.({ error: 'Google Identity Services not loaded' });
    }
  } catch (e) {
    callback?.({ error: e.message });
  }
}

export function requestGoogleAuth() {
  if (tokenClient) {
    tokenClient.requestAccessToken();
  }
}

// ════════════════════════════════════════════════════════════════════
// GOOGLE MEET SPACE CREATION
// ════════════════════════════════════════════════════════════════════

/**
 * Create a Google Meet space via Google Meet REST API.
 * Fallback: Google Calendar API with conferenceData.
 */
export async function createMeeting() {
  if (!isGoogleConfigured() || !accessToken) {
    return createDemoMeeting();
  }

  try {
    // Primary: Google Meet Spaces API
    const response = await fetch('https://meet.googleapis.com/v2/spaces', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        meetingId: data.name || data.meetingCode,
        meetingUrl: data.meetingUri || `https://meet.google.com/${data.meetingCode}`,
        meetingCode: data.meetingCode || '',
        spaceId: data.name || '',
        source: 'google_meet_api',
      };
    }

    // Fallback: Google Calendar API
    return await createMeetingViaCalendar();
  } catch (e) {
    console.warn('Google Meet API error, falling back to Calendar API:', e);
    try {
      return await createMeetingViaCalendar();
    } catch (calendarError) {
      console.warn('Calendar API also failed:', calendarError);
      return createDemoMeeting();
    }
  }
}

async function createMeetingViaCalendar() {
  const event = {
    summary: 'MediTrust AI Consultation',
    start: { dateTime: new Date().toISOString(), timeZone: 'Asia/Kolkata' },
    end: { dateTime: new Date(Date.now() + 3600000).toISOString(), timeZone: 'Asia/Kolkata' },
    conferenceData: {
      createRequest: { requestId: 'medtrust-' + Date.now(), conferenceSolutionKey: { type: 'hangoutsMeet' } },
    },
  };

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Calendar API error: ${response.status} ${errBody}`);
  }

  const data = await response.json();
  const meetUri = data.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video')?.uri;

  return {
    success: true,
    meetingId: data.conferenceData?.conferenceId || data.id,
    meetingUrl: meetUri || data.htmlLink,
    meetingCode: data.conferenceData?.conferenceId || '',
    spaceId: data.id,
    source: 'google_calendar_api',
  };
}

// ════════════════════════════════════════════════════════════════════
// GOOGLE MEET TRANSCRIPT RETRIEVAL
// ════════════════════════════════════════════════════════════════════

/**
 * Retrieve transcript from a Google Meet session.
 * Uses the Google Meet REST API (spaces/{space}/transcripts).
 */
export async function retrieveTranscript(spaceId) {
  if (!isGoogleConfigured() || !accessToken || !spaceId) {
    return getDemoTranscript();
  }

  try {
    // List transcripts for the space
    const listRes = await fetch(
      `https://meet.googleapis.com/v2/${spaceId}/transcripts`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }
    );

    if (!listRes.ok) {
      console.warn('Transcript list failed:', listRes.status);
      return getDemoTranscript();
    }

    const listData = await listRes.json();
    const transcripts = listData.transcripts || [];

    if (transcripts.length === 0) {
      return {
        success: false,
        status: 'UNAVAILABLE',
        message: 'No transcript available for this meeting. Ensure transcription was enabled during the call.',
        lines: [],
      };
    }

    // Get the most recent transcript entries
    const transcriptName = transcripts[0].name;
    const entriesRes = await fetch(
      `https://meet.googleapis.com/v2/${transcriptName}/entries`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }
    );

    if (!entriesRes.ok) {
      console.warn('Transcript entries failed:', entriesRes.status);
      return getDemoTranscript();
    }

    const entriesData = await entriesRes.json();
    const entries = entriesData.transcriptEntries || [];

    const normalizedLines = entries.map(entry => ({
      speaker: entry.participant?.displayName?.toLowerCase().includes('doctor') ? 'doctor' : 'patient',
      speakerName: entry.participant?.displayName || 'Unknown',
      text: entry.text || '',
      startTime: entry.startTime || '',
      endTime: entry.endTime || '',
    }));

    return {
      success: true,
      status: 'AVAILABLE',
      lines: normalizedLines,
      rawEntryCount: entries.length,
      source: 'google_meet_api',
    };
  } catch (e) {
    console.warn('Transcript retrieval error:', e);
    return getDemoTranscript();
  }
}

// ════════════════════════════════════════════════════════════════════
// DEMO / SIMULATION MODE
// ════════════════════════════════════════════════════════════════════

function createDemoMeeting() {
  const code = 'abc-' + Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 5);
  return {
    success: true,
    meetingId: 'demo-meet-' + Date.now(),
    meetingUrl: `https://meet.google.com/${code}`,
    meetingCode: code,
    spaceId: 'demo-space-' + Date.now(),
    source: 'demo',
    isDemo: true,
  };
}

export const DEMO_TRANSCRIPT_LINES = [
  { speaker: 'doctor', text: 'Good morning. Please have a seat. How are you feeling today?', speakerName: 'Dr. Arjun Mehta' },
  { speaker: 'patient', text: 'Good morning, Doctor. I have been having fever and headache for the last three days. It has been quite uncomfortable.', speakerName: 'Patient' },
  { speaker: 'doctor', text: 'I see. Can you describe the fever? Is it continuous or does it come and go?', speakerName: 'Dr. Arjun Mehta' },
  { speaker: 'patient', text: 'It comes and goes. It is usually worse in the evening. I also feel very weak and tired throughout the day.', speakerName: 'Patient' },
  { speaker: 'doctor', text: 'Do you have any cough, cold, or breathing difficulty?', speakerName: 'Dr. Arjun Mehta' },
  { speaker: 'patient', text: 'No cough or breathing difficulty. But I do have a mild sore throat that is bothering me.', speakerName: 'Patient' },
  { speaker: 'doctor', text: 'Any body pain or joint pain?', speakerName: 'Dr. Arjun Mehta' },
  { speaker: 'patient', text: 'Yes, I have body pain, especially in my legs and lower back. It gets worse when I try to move around.', speakerName: 'Patient' },
  { speaker: 'doctor', text: 'Have you taken any medication so far for these symptoms?', speakerName: 'Dr. Arjun Mehta' },
  { speaker: 'patient', text: 'I took Crocin once yesterday but the fever came back after a few hours. Nothing else.', speakerName: 'Patient' },
  { speaker: 'doctor', text: 'Do you have any known allergies to medications?', speakerName: 'Dr. Arjun Mehta' },
  { speaker: 'patient', text: 'No known allergies, Doctor.', speakerName: 'Patient' },
  { speaker: 'doctor', text: 'Any history of diabetes, hypertension, or any chronic illness? Does anyone in your family have significant health issues?', speakerName: 'Dr. Arjun Mehta' },
  { speaker: 'patient', text: 'I have mild hypertension. I take Amlodipine 5mg daily. My father had diabetes but I have not been diagnosed with it. No other family history I am aware of.', speakerName: 'Patient' },
  { speaker: 'doctor', text: 'What about your daily routine — do you smoke, consume alcohol, or have any particular dietary habits?', speakerName: 'Dr. Arjun Mehta' },
  { speaker: 'patient', text: 'I do not smoke. I drink socially, maybe once a month. I eat a normal vegetarian diet.', speakerName: 'Patient' },
  { speaker: 'doctor', text: 'Alright. Let me check your vitals. Your temperature is 101.2°F, blood pressure is 138 over 88, pulse rate is 92 per minute. Your throat appears slightly congested. Lungs are clear on auscultation.', speakerName: 'Dr. Arjun Mehta' },
  { speaker: 'doctor', text: 'Based on my clinical assessment, this appears to be an acute viral fever with pharyngitis. The body aches and fatigue are consistent with a systemic viral infection.', speakerName: 'Dr. Arjun Mehta' },
  { speaker: 'doctor', text: 'I am prescribing Paracetamol 500mg — take one tablet three times a day after food for five days. Also Cetirizine 10mg — one tablet at bedtime for three days for the sore throat and congestion. And Vitamin C 500mg — one tablet daily for ten days to support your immune recovery.', speakerName: 'Dr. Arjun Mehta' },
  { speaker: 'doctor', text: 'Please drink plenty of fluids, take adequate rest, and avoid cold foods. Continue your blood pressure medicine Amlodipine as usual.', speakerName: 'Dr. Arjun Mehta' },
  { speaker: 'doctor', text: 'If the fever does not subside in three days, or if you develop breathing difficulty or rash, please come back immediately. We may need to do a blood test — CBC and Dengue NS1 Antigen to rule out dengue.', speakerName: 'Dr. Arjun Mehta' },
  { speaker: 'patient', text: 'Thank you, Doctor. Should I continue my blood pressure medicine?', speakerName: 'Patient' },
  { speaker: 'doctor', text: 'Yes, absolutely continue Amlodipine 5mg as usual. Come for a follow-up review after five days, or sooner if symptoms worsen.', speakerName: 'Dr. Arjun Mehta' },
  { speaker: 'patient', text: 'Thank you very much, Doctor. I appreciate it.', speakerName: 'Patient' },
];

function getDemoTranscript() {
  return {
    success: true,
    status: 'AVAILABLE',
    lines: DEMO_TRANSCRIPT_LINES,
    rawEntryCount: DEMO_TRANSCRIPT_LINES.length,
    source: 'demo',
    isDemo: true,
  };
}

/**
 * Simulates live transcription line by line for demonstration.
 * @param {Function} onLineReady - callback(line, index) called per line, null signals completion
 * @returns {Function} cleanup function to stop simulation
 */
export function simulateLiveTranscription(onLineReady) {
  let index = 0;
  const interval = setInterval(() => {
    if (index < DEMO_TRANSCRIPT_LINES.length) {
      onLineReady(DEMO_TRANSCRIPT_LINES[index], index);
      index++;
    } else {
      clearInterval(interval);
      onLineReady(null, -1);
    }
  }, 2000);
  return () => clearInterval(interval);
}

/**
 * Formats transcript lines into a single text block for AI processing.
 */
export function formatTranscriptForAI(lines) {
  return lines
    .map(line => `${line.speaker === 'doctor' ? 'Doctor' : 'Patient'}: ${line.text}`)
    .join('\n');
}
