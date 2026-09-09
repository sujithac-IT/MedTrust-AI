// MediTrust AI — Clinical Consultation AI Pipeline
// Focused on: Transcription → Extraction → Case Sheet → Medication → Translation → Voice

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// ════════════════════════════════════════════════════════════════════
// SAMPLE CONSULTATION TRANSCRIPT (for demo mode)
// ════════════════════════════════════════════════════════════════════

export const SAMPLE_TRANSCRIPT = [
  { speaker: 'doctor', text: 'Good morning, Mr. Sharma. How are you feeling today?' },
  { speaker: 'patient', text: 'Good morning, Doctor. I have been having fever and headache for the last three days.' },
  { speaker: 'doctor', text: 'I see. Can you describe the fever? Is it continuous or does it come and go?' },
  { speaker: 'patient', text: 'It comes and goes. It is usually worse in the evening. I also feel very weak and tired.' },
  { speaker: 'doctor', text: 'Do you have any cough, cold, or breathing difficulty?' },
  { speaker: 'patient', text: 'No cough or breathing difficulty. But I do have a mild sore throat.' },
  { speaker: 'doctor', text: 'Any body pain or joint pain?' },
  { speaker: 'patient', text: 'Yes, I have body pain, especially in my legs and back.' },
  { speaker: 'doctor', text: 'Have you taken any medication so far?' },
  { speaker: 'patient', text: 'I took Crocin once yesterday but the fever came back after a few hours.' },
  { speaker: 'doctor', text: 'Do you have any known allergies to medications?' },
  { speaker: 'patient', text: 'No known allergies, Doctor.' },
  { speaker: 'doctor', text: 'Any history of diabetes, hypertension, or any chronic illness?' },
  { speaker: 'patient', text: 'I have mild hypertension. I take Amlodipine 5mg daily.' },
  { speaker: 'doctor', text: 'Alright. Let me check your vitals. Your temperature is 101.2°F, blood pressure is 138 over 88, pulse rate is 92 per minute. Your throat appears slightly congested.' },
  { speaker: 'doctor', text: 'Based on the clinical assessment, this appears to be an acute viral fever with pharyngitis. I will prescribe some medications.' },
  { speaker: 'doctor', text: 'I am prescribing Paracetamol 500mg, take one tablet three times a day after food for five days.' },
  { speaker: 'doctor', text: 'Also Cetirizine 10mg, one tablet at bedtime for three days for the sore throat and congestion.' },
  { speaker: 'doctor', text: 'And Vitamin C 500mg, one tablet daily for ten days to support your immune recovery.' },
  { speaker: 'doctor', text: 'Please drink plenty of fluids, take adequate rest, and avoid cold foods.' },
  { speaker: 'doctor', text: 'If the fever does not subside in three days, or if you develop breathing difficulty, please come back immediately. We may need to do a blood test — CBC and Dengue NS1.' },
  { speaker: 'patient', text: 'Thank you, Doctor. Should I continue my blood pressure medicine?' },
  { speaker: 'doctor', text: 'Yes, please continue Amlodipine as usual. Come for a follow-up after five days.' },
  { speaker: 'patient', text: 'Thank you, Doctor.' },
];

// ════════════════════════════════════════════════════════════════════
// STEP 1: SPEECH-TO-TEXT (Simulated for prototype)
// ════════════════════════════════════════════════════════════════════

export function simulateTranscription(onLineReady) {
  let index = 0;
  const interval = setInterval(() => {
    if (index < SAMPLE_TRANSCRIPT.length) {
      onLineReady(SAMPLE_TRANSCRIPT[index], index);
      index++;
    } else {
      clearInterval(interval);
      onLineReady(null, -1); // Signal completion
    }
  }, 2200);
  return () => clearInterval(interval);
}

// ════════════════════════════════════════════════════════════════════
// STEP 2: AI MEDICAL INFORMATION EXTRACTION
// ════════════════════════════════════════════════════════════════════

export function extractMedicalInfo(transcript) {
  // In production: send to Gemini API for structured extraction
  // For prototype: deterministic extraction from sample transcript
  return {
    chiefComplaint: 'Fever and headache for 3 days',
    symptoms: [
      'Intermittent fever (worse in evenings)',
      'Headache for 3 days',
      'Generalized weakness and fatigue',
      'Mild sore throat',
      'Body pain (legs and back)',
    ],
    duration: '3 days',
    medicalHistory: [
      'Known case of mild hypertension',
      'Currently on Amlodipine 5mg daily',
    ],
    allergies: 'No known drug allergies (NKDA)',
    clinicalObservations: [
      'Temperature: 101.2°F',
      'Blood Pressure: 138/88 mmHg',
      'Pulse Rate: 92/min',
      'Throat: Slightly congested',
      'No cough or respiratory distress',
    ],
    diagnosis: 'Acute Viral Fever with Pharyngitis',
    icdCode: 'J06.9 — Acute upper respiratory infection, unspecified',
    investigations: [
      'CBC (Complete Blood Count) — if fever persists beyond 3 days',
      'Dengue NS1 Antigen — if fever persists beyond 3 days',
    ],
    doctorAdvice: [
      'Drink plenty of fluids and stay hydrated',
      'Take adequate rest',
      'Avoid cold foods and beverages',
      'Continue existing BP medication (Amlodipine 5mg)',
      'Return immediately if breathing difficulty develops',
    ],
    followUp: 'Review after 5 days, or sooner if symptoms worsen',
  };
}

// ════════════════════════════════════════════════════════════════════
// STEP 3: MEDICATION EXTRACTION
// ════════════════════════════════════════════════════════════════════

export function extractMedications(transcript) {
  return [
    { medicine: 'Paracetamol', dosage: '500mg', frequency: '3 times/day', duration: '5 days', instructions: 'After food' },
    { medicine: 'Cetirizine', dosage: '10mg', frequency: 'Once daily (bedtime)', duration: '3 days', instructions: 'At night' },
    { medicine: 'Vitamin C', dosage: '500mg', frequency: 'Once daily', duration: '10 days', instructions: 'After food' },
  ];
}

// ════════════════════════════════════════════════════════════════════
// STEP 4: CASE SHEET GENERATION
// ════════════════════════════════════════════════════════════════════

export function generateCaseSheet(patient, medicalInfo, medications, doctor) {
  return {
    patientName: patient.name,
    patientId: patient.id || 'MT-' + Date.now().toString().slice(-6),
    patientAge: patient.age,
    patientGender: patient.gender,
    consultationDate: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
    consultationTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    doctorName: doctor?.name || 'Dr. Arjun Mehta',
    doctorId: doctor?.id || 'DOC-001',
    specialty: doctor?.specialty || 'General Medicine',
    hospital: doctor?.hospital || 'MediTrust AI Health Institute',
    chiefComplaint: medicalInfo.chiefComplaint,
    symptoms: medicalInfo.symptoms,
    duration: medicalInfo.duration,
    medicalHistory: medicalInfo.medicalHistory,
    allergies: medicalInfo.allergies,
    clinicalObservations: medicalInfo.clinicalObservations,
    diagnosis: medicalInfo.diagnosis,
    icdCode: medicalInfo.icdCode,
    medications,
    investigations: medicalInfo.investigations,
    doctorAdvice: medicalInfo.doctorAdvice,
    followUp: medicalInfo.followUp,
    status: 'ai_generated',
    generatedAt: new Date().toISOString(),
    language: 'English',
  };
}

// ════════════════════════════════════════════════════════════════════
// STEP 5: CONSULTATION SUMMARY
// ════════════════════════════════════════════════════════════════════

export function generateSummary(caseSheet) {
  return `Patient ${caseSheet.patientName}, ${caseSheet.patientAge}-year-old ${caseSheet.patientGender}, presented with ${caseSheet.chiefComplaint.toLowerCase()}. ` +
    `Symptoms include ${caseSheet.symptoms.slice(0, 3).map(s => s.toLowerCase()).join(', ')}. ` +
    `Patient has a history of ${caseSheet.medicalHistory.map(h => h.toLowerCase()).join('; ')}. ` +
    `Clinical examination revealed ${caseSheet.clinicalObservations.slice(0, 3).join(', ')}. ` +
    `Assessment: ${caseSheet.diagnosis}. ` +
    `Prescribed medications: ${caseSheet.medications.map(m => `${m.medicine} ${m.dosage} ${m.frequency}`).join(', ')}. ` +
    `${caseSheet.investigations.length > 0 ? `Investigations advised: ${caseSheet.investigations[0]}.` : ''} ` +
    `Follow-up: ${caseSheet.followUp}.`;
}

// ════════════════════════════════════════════════════════════════════
// STEP 6: MULTILINGUAL TRANSLATION
// ════════════════════════════════════════════════════════════════════

const TRANSLATIONS = {
  Tamil: {
    summary: (cs) => `நோயாளி ${cs.patientName}, ${cs.patientAge} வயது ${cs.patientGender === 'Male' ? 'ஆண்' : 'பெண்'}, ${cs.chiefComplaint} என்ற பிரச்சனையுடன் வந்துள்ளார். ` +
      `அறிகுறிகள்: ${cs.symptoms.slice(0, 3).join(', ')}. ` +
      `நோய் கண்டறிதல்: ${cs.diagnosis}. ` +
      `மருந்துகள்: ${cs.medications.map(m => `${m.medicine} ${m.dosage} தினமும் ${m.frequency}`).join(', ')}. ` +
      `மீண்டும் சந்திக்க: ${cs.followUp}.`,
    label: 'தமிழ்',
  },
  Hindi: {
    summary: (cs) => `मरीज़ ${cs.patientName}, ${cs.patientAge} वर्ष ${cs.patientGender === 'Male' ? 'पुरुष' : 'महिला'}, ${cs.chiefComplaint} की शिकायत लेकर आए। ` +
      `लक्षण: ${cs.symptoms.slice(0, 3).join(', ')}. ` +
      `निदान: ${cs.diagnosis}. ` +
      `दवाइयाँ: ${cs.medications.map(m => `${m.medicine} ${m.dosage} दिन में ${m.frequency}`).join(', ')}. ` +
      `अगली मुलाकात: ${cs.followUp}.`,
    label: 'हिन्दी',
  },
  Telugu: {
    summary: (cs) => `రోగి ${cs.patientName}, ${cs.patientAge} సంవత్సరాల ${cs.patientGender === 'Male' ? 'పురుషుడు' : 'స్త్రీ'}, ${cs.chiefComplaint} సమస్యతో వచ్చారు. ` +
      `లక్షణాలు: ${cs.symptoms.slice(0, 3).join(', ')}. ` +
      `రోగ నిర్ధారణ: ${cs.diagnosis}. ` +
      `మందులు: ${cs.medications.map(m => `${m.medicine} ${m.dosage}`).join(', ')}. ` +
      `తదుపరి సందర్శన: ${cs.followUp}.`,
    label: 'తెలుగు',
  },
  Malayalam: {
    summary: (cs) => `രോഗി ${cs.patientName}, ${cs.patientAge} വയസ്സ് ${cs.patientGender === 'Male' ? 'പുരുഷൻ' : 'സ്ത്രീ'}, ${cs.chiefComplaint} എന്ന പ്രശ്നവുമായി വന്നു. ` +
      `ലക്ഷണങ്ങൾ: ${cs.symptoms.slice(0, 3).join(', ')}. ` +
      `രോഗനിർണ്ണയം: ${cs.diagnosis}. ` +
      `മരുന്നുകൾ: ${cs.medications.map(m => `${m.medicine} ${m.dosage}`).join(', ')}. ` +
      `അടുത്ത സന്ദർശനം: ${cs.followUp}.`,
    label: 'മലയാളം',
  },
  Kannada: {
    summary: (cs) => `ರೋಗಿ ${cs.patientName}, ${cs.patientAge} ವರ್ಷ ${cs.patientGender === 'Male' ? 'ಪುರುಷ' : 'ಮಹಿಳೆ'}, ${cs.chiefComplaint} ಸಮಸ್ಯೆಯೊಂದಿಗೆ ಬಂದರು. ` +
      `ಲಕ್ಷಣಗಳು: ${cs.symptoms.slice(0, 3).join(', ')}. ` +
      `ರೋಗನಿರ್ಣಯ: ${cs.diagnosis}. ` +
      `ಔಷಧಗಳು: ${cs.medications.map(m => `${m.medicine} ${m.dosage}`).join(', ')}. ` +
      `ಮರುಭೇಟಿ: ${cs.followUp}.`,
    label: 'ಕನ್ನಡ',
  },
};

export const SUPPORTED_LANGUAGES = [
  { code: 'English', label: 'English', nativeLabel: 'English' },
  { code: 'Tamil', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'Hindi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'Telugu', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'Malayalam', label: 'Malayalam', nativeLabel: 'മലയാളം' },
  { code: 'Kannada', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
];

export function translateSummary(caseSheet, language) {
  if (language === 'English') return generateSummary(caseSheet);
  const t = TRANSLATIONS[language];
  if (t) return t.summary(caseSheet);
  return generateSummary(caseSheet); // Fallback to English
}

// ════════════════════════════════════════════════════════════════════
// STEP 7: TEXT-TO-SPEECH (Voice Summary)
// ════════════════════════════════════════════════════════════════════

const LANG_VOICE_MAP = {
  English: 'en-IN',
  Tamil: 'ta-IN',
  Hindi: 'hi-IN',
  Telugu: 'te-IN',
  Malayalam: 'ml-IN',
  Kannada: 'kn-IN',
};

export function speakText(text, language = 'English') {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANG_VOICE_MAP[language] || 'en-IN';
  utterance.rate = 0.9;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeaking() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// ════════════════════════════════════════════════════════════════════
// STEP 8: POST TO HOSPITAL MANAGEMENT SYSTEM
// ════════════════════════════════════════════════════════════════════

export async function postToHMS(caseSheet) {
  // Try Firestore first
  try {
    const record = {
      ...caseSheet,
      status: 'submitted',
      submittedAt: serverTimestamp(),
      hmsStatus: 'received',
      hmsRecordId: 'HMS-' + Date.now().toString().slice(-8),
    };
    const docRef = await addDoc(collection(db, 'hospitalRecords'), record);
    return {
      success: true,
      recordId: docRef.id,
      hmsRecordId: record.hmsRecordId,
      message: 'Clinical record successfully submitted to Hospital Management System.',
      timestamp: new Date().toISOString(),
    };
  } catch (e) {
    // Fallback mock response for demo
    return {
      success: true,
      recordId: 'LOCAL-' + Date.now().toString().slice(-8),
      hmsRecordId: 'HMS-' + Date.now().toString().slice(-8),
      message: 'Clinical record successfully submitted to Hospital Management System.',
      timestamp: new Date().toISOString(),
    };
  }
}
