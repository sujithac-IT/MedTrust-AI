import { useState, useEffect, useRef } from 'react';
import { generateCaseSheet, parseMedicalScribeTranscript } from '../utils/gemini';
import CaseSheetModal from './CaseSheetModal';

const CALL_PHASES = { idle: 'idle', live: 'live', processing: 'processing', done: 'done' };

// Simulated demo transcript lines for the video call AI scribe
const DEMO_LINES = [
  { speaker: 'Dr. Arjun', text: "Good morning Rahul. I can see you've logged chest tightness over the last 3 days. How are you feeling right now?" },
  { speaker: 'Patient',   text: "Doctor, the tightness is worse when I climb stairs. I also had some palpitations yesterday evening." },
  { speaker: 'Dr. Arjun', text: "I see. Any associated sweating, left arm pain or jaw pain?" },
  { speaker: 'Patient',   text: "No arm pain. But I do feel a bit short of breath when walking fast." },
  { speaker: 'Dr. Arjun', text: "Your resting BP today is 138 over 88. Heart rate is 94 beats per minute. Slightly elevated but manageable." },
  { speaker: 'Patient',   text: "Is that dangerous, doctor? Should I be worried?" },
  { speaker: 'Dr. Arjun', text: "Not immediately dangerous, but we do need to act. Your lipid profile from last month showed total cholesterol at 210 milligrams per deciliter, which is borderline high." },
  { speaker: 'Dr. Arjun', text: "I'm diagnosing you with hypertensive heart disease, ICD code I11.9, with sinus tachycardia." },
  { speaker: 'Patient',   text: "What medications will I need?" },
  { speaker: 'Dr. Arjun', text: "I'm prescribing Amlodipine 5mg every morning after breakfast, and Atorvastatin 20mg at night after dinner. Both for 30 days." },
  { speaker: 'Dr. Arjun', text: "Also please reduce salt intake to less than 2 grams per day, do a 30-minute walk daily, and avoid smoking." },
  { speaker: 'Dr. Arjun', text: "Come back in 14 days for a BP review and ECG. I'll have the AI auto-schedule that for you." },
  { speaker: 'Patient',   text: "Thank you doctor. I'll follow all the advice carefully." },
];

export default function VideoConsultationModal({ doctorName = 'Dr. Arjun Mehta', patientName = 'Rahul Sharma', patient = {}, onClose, onGenerateRx, onCaseSheetReady }) {
  const [micActive,     setMicActive]     = useState(true);
  const [camActive,     setCamActive]     = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [scribeActive,  setScribeActive]  = useState(true);
  const [callPhase,     setCallPhase]     = useState(CALL_PHASES.live);
  const [elapsed,       setElapsed]       = useState(0);
  const [caseSheet,     setCaseSheet]     = useState(null);
  const [videoSummary,  setVideoSummary]  = useState(null);
  const [transcriptLines, setTranscriptLines] = useState([
    { speaker: 'Dr. Arjun', text: "Good morning Rahul. I can see you've logged chest tightness over the last 3 days. How are you feeling right now?" },
    { speaker: 'Patient',   text: "Doctor, the tightness is worse when I climb stairs. I also had some palpitations yesterday evening." },
  ]);

  const videoRef      = useRef(null);
  const elapsedRef    = useRef(null);
  const transcriptEnd = useRef(null);

  /* ── Webcam ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    let stream = null;
    if (camActive && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(s => { stream = s; if (videoRef.current) videoRef.current.srcObject = s; })
        .catch(() => {});
    }
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
  }, [camActive]);

  /* ── Elapsed timer ──────────────────────────────────────────────────────── */
  useEffect(() => {
    if (callPhase === CALL_PHASES.live) {
      elapsedRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(elapsedRef.current);
    }
    return () => clearInterval(elapsedRef.current);
  }, [callPhase]);

  /* ── Live scribe demo feed ──────────────────────────────────────────────── */
  useEffect(() => {
    if (!scribeActive || callPhase !== CALL_PHASES.live) return;
    const remaining = DEMO_LINES.slice(transcriptLines.length);
    let idx = 0;
    const timer = setInterval(() => {
      if (idx < remaining.length) {
        setTranscriptLines(prev => [...prev, remaining[idx]]);
        idx++;
      } else {
        clearInterval(timer);
      }
    }, 4800);
    return () => clearInterval(timer);
  }, [scribeActive, callPhase]);

  /* ── Auto-scroll transcript ─────────────────────────────────────────────── */
  useEffect(() => {
    transcriptEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptLines]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  /* ── End call → generate case sheet ────────────────────────────────────── */
  const handleEndCall = async () => {
    setCallPhase(CALL_PHASES.processing);

    const fullTranscript = transcriptLines.map(l => `${l.speaker}: ${l.text}`).join('\n');

    // Generate full case sheet from video transcript
    const [cs, rxData] = await Promise.all([
      generateCaseSheet(fullTranscript, {
        name:   patientName,
        age:    patient.age || 42,
        gender: patient.gender || 'Male',
        id:     patient.id || 'MT001',
      }, 'en-IN'),
      parseMedicalScribeTranscript(fullTranscript),
    ]);

    // Build video-specific summary metadata
    const vSummary = {
      duration:     formatTime(elapsed),
      participants: '2',
      confidence:   `${Math.floor(88 + Math.random() * 8)}%`,
      language:     'English',
      keyPoints:    cs.chiefComplaint || 'Chest tightness, palpitations, mild dyspnoea on exertion for 3 days.',
      observations: cs.clinicalFindings || 'BP 138/88 mmHg, HR 94 bpm, SpO2 98%. Cardiac auscultation: regular rhythm.',
      decisions:    `Diagnosis: ${cs.diagnosis}. Prescribed ${cs.medications?.length || 2} medication(s). ECG ordered.`,
      nextSteps:    cs.followUpPlan || 'Return in 14 days for BP review and ECG. AI auto-reminder set.',
    };

    setCaseSheet(cs);
    setVideoSummary(vSummary);
    setCallPhase(CALL_PHASES.done);

    // Also fire legacy onGenerateRx for backward compatibility
    if (onGenerateRx && rxData) onGenerateRx(rxData);
    if (onCaseSheetReady) onCaseSheetReady(cs, vSummary);
  };

  /* ═══════════════════════════════════════════════════════════════════════ */
  /* POST-CALL: Show Case Sheet inline                                       */
  /* ═══════════════════════════════════════════════════════════════════════ */
  if (callPhase === CALL_PHASES.done && caseSheet) {
    return (
      <CaseSheetModal
        caseSheet={caseSheet}
        patient={{ name: patientName, age: patient.age || 42, gender: patient.gender || 'Male', id: patient.id || 'MT001' }}
        doctor={{ name: doctorName }}
        transcriptLines={transcriptLines}
        videoSummary={videoSummary}
        onClose={onClose}
      />
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /* PROCESSING OVERLAY                                                      */
  /* ═══════════════════════════════════════════════════════════════════════ */
  if (callPhase === CALL_PHASES.processing) {
    return (
      <div className="modal-backdrop">
        <div style={{ background: '#0f172a', borderRadius: 20, padding: '60px 40px', textAlign: 'center', color: '#fff', maxWidth: 480, width: '90vw', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#1a73e8,#7c3aed)', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', animation: 'pulse 1.5s infinite', boxShadow: '0 0 40px rgba(26,115,232,0.4)' }}>
            🤖
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: 10, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            AI Generating Case Sheet...
          </div>
          <div style={{ color: '#94a3b8', fontSize: '.88rem', marginBottom: 32 }}>
            Analysing {transcriptLines.length} transcript lines from your video consultation
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320, margin: '0 auto' }}>
            {['Parsing consultation transcript', 'Extracting diagnosis & medications', 'Building SOAP case sheet', 'Preparing video summary report'].map((task, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 14px', fontSize: '.8rem', textAlign: 'left', animation: `fadeIn 0.4s ease ${i * 0.3}s both` }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ color: '#38bdf8', fontSize: '.72rem' }}></i>
                {task}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /* LIVE CALL UI                                                            */
  /* ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content video-modal" onClick={e => e.stopPropagation()}
        style={{ maxWidth: 1020, width: '97vw', padding: 0, overflow: 'hidden', background: '#0f172a', color: '#fff', borderRadius: 18, border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* ── Top bar ── */}
        <div style={{ padding: '14px 22px', background: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 10px #10b981', animation: 'pulse 2s infinite' }}></span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '.95rem' }}>HD Telehealth Video Consultation</div>
              <div style={{ fontSize: '.72rem', color: '#64748b', marginTop: 1 }}>End-to-End Encrypted · WebRTC</div>
            </div>
            <span style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', fontSize: '.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 12 }}>
              LIVE {formatTime(elapsed)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: '.82rem', color: '#94a3b8' }}>
              <span style={{ color: '#cbd5e1' }}>{patientName}</span> &nbsp;↔&nbsp; <span style={{ color: '#cbd5e1' }}>{doctorName}</span>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#64748b', cursor: 'pointer', width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        </div>

        {/* ── Video area + scribe sidebar ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', height: 490 }}>

          {/* Main video feed */}
          <div style={{ position: 'relative', background: 'linear-gradient(160deg, #0d1b2e 0%, #0f172a 100%)' }}>

            {/* Doctor avatar */}
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg, #1a73e8, #0f4c8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.4rem', boxShadow: '0 0 40px rgba(26,115,232,0.35)', border: '3px solid rgba(26,115,232,0.4)' }}>
                👨‍⚕️
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{doctorName}</div>
                <div style={{ fontSize: '.78rem', color: '#94a3b8', marginTop: 3 }}>Senior Consultant · Cardiology</div>
                <div style={{ marginTop: 8, display: 'flex', gap: 6, justifyContent: 'center' }}>
                  <span style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', fontSize: '.65rem', padding: '3px 8px', borderRadius: 8, fontWeight: 600 }}>HD</span>
                  <span style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa', fontSize: '.65rem', padding: '3px 8px', borderRadius: 8, fontWeight: 600 }}>Audio ✓</span>
                </div>
              </div>
            </div>

            {/* Self-view pip */}
            <div style={{ position: 'absolute', bottom: 16, right: 16, width: 168, height: 116, background: '#1e293b', borderRadius: 12, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>
              {camActive
                ? <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#334155', flexDirection: 'column', gap: 6 }}>
                    <i className="fa-solid fa-video-slash" style={{ color: '#64748b', fontSize: '1.2rem' }}></i>
                    <span style={{ color: '#64748b', fontSize: '.7rem' }}>Camera Off</span>
                  </div>
              }
              <div style={{ position: 'absolute', bottom: 5, left: 8, fontSize: '.65rem', background: 'rgba(0,0,0,0.7)', padding: '2px 7px', borderRadius: 4, color: '#cbd5e1' }}>
                {patientName} (You)
              </div>
            </div>

            {/* AI Scribe live badge */}
            <div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(15,23,42,0.88)', backdropFilter: 'blur(10px)', padding: '8px 14px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1s infinite' }}></span>
              <span style={{ fontSize: '.75rem', fontWeight: 600 }}>AI Medical Scribe Active</span>
            </div>

            {/* Screen share badge */}
            {screenSharing && (
              <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(26,115,232,0.9)', padding: '6px 12px', borderRadius: 12, fontSize: '.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="fa-solid fa-desktop"></i> Screen Sharing
              </div>
            )}
          </div>

          {/* ── AI Scribe sidebar ── */}
          <div style={{ background: '#0c1526', borderLeft: '1px solid #1e293b', display: 'flex', flexDirection: 'column' }}>
            {/* Sidebar header */}
            <div style={{ padding: '14px 16px', background: '#162032', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#38bdf8', fontSize: '.85rem' }}></i>
                <span style={{ fontSize: '.84rem', fontWeight: 700, color: '#38bdf8' }}>Real-time AI Scribe</span>
              </div>
              <button onClick={() => setScribeActive(s => !s)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', borderRadius: 6, padding: '3px 10px', fontSize: '.72rem', fontWeight: 600 }}>
                {scribeActive ? '⏸ Pause' : '▶ Resume'}
              </button>
            </div>

            {/* Transcript lines */}
            <div style={{ flex: 1, padding: '12px 14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {transcriptLines.map((line, i) => (
                <div key={i} style={{ background: line.speaker.includes('Dr') ? 'rgba(56,189,248,0.07)' : 'rgba(52,211,153,0.06)', border: `1px solid ${line.speaker.includes('Dr') ? 'rgba(56,189,248,0.14)' : 'rgba(52,211,153,0.12)'}`, borderRadius: 8, padding: '9px 11px', borderLeft: `3px solid ${line.speaker.includes('Dr') ? '#38bdf8' : '#34d399'}` }}>
                  <div style={{ fontSize: '.68rem', fontWeight: 700, color: line.speaker.includes('Dr') ? '#38bdf8' : '#34d399', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {line.speaker.includes('Dr') ? '👨‍⚕️' : '👤'} {line.speaker}
                  </div>
                  <div style={{ color: '#e2e8f0', lineHeight: 1.5, fontSize: '.78rem' }}>{line.text}</div>
                </div>
              ))}
              <div ref={transcriptEnd} />
            </div>

            {/* End call CTA in scribe pane */}
            <div style={{ padding: '12px 14px', background: '#162032', borderTop: '1px solid #1e293b' }}>
              <div style={{ fontSize: '.7rem', color: '#64748b', marginBottom: 8, textAlign: 'center' }}>
                {transcriptLines.length} lines captured · AI case sheet auto-generates on end
              </div>
              <button
                onClick={handleEndCall}
                style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: '.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <i className="fa-solid fa-file-waveform"></i> End Call &amp; Generate Case Sheet
              </button>
            </div>
          </div>
        </div>

        {/* ── Bottom controls ── */}
        <div style={{ padding: '14px 24px', background: '#1e293b', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, borderTop: '1px solid #334155', flexWrap: 'wrap' }}>
          {/* Mic */}
          <button onClick={() => setMicActive(m => !m)}
            style={{ width: 48, height: 48, borderRadius: '50%', border: `2px solid ${micActive ? 'rgba(255,255,255,0.15)' : '#ef4444'}`, background: micActive ? 'rgba(255,255,255,0.06)' : 'rgba(239,68,68,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', transition: 'all 0.2s' }}
            title={micActive ? 'Mute' : 'Unmute'}
          >
            <i className={`fa-solid ${micActive ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
          </button>

          {/* Camera */}
          <button onClick={() => setCamActive(c => !c)}
            style={{ width: 48, height: 48, borderRadius: '50%', border: `2px solid ${camActive ? 'rgba(255,255,255,0.15)' : '#ef4444'}`, background: camActive ? 'rgba(255,255,255,0.06)' : 'rgba(239,68,68,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', transition: 'all 0.2s' }}
            title={camActive ? 'Turn off camera' : 'Turn on camera'}
          >
            <i className={`fa-solid ${camActive ? 'fa-video' : 'fa-video-slash'}`}></i>
          </button>

          {/* Screen share */}
          <button onClick={() => setScreenSharing(s => !s)}
            style={{ width: 48, height: 48, borderRadius: '50%', border: `2px solid ${screenSharing ? '#38bdf8' : 'rgba(255,255,255,0.15)'}`, background: screenSharing ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.06)', color: screenSharing ? '#38bdf8' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', transition: 'all 0.2s' }}
            title="Share screen"
          >
            <i className="fa-solid fa-desktop"></i>
          </button>

          {/* Scribe toggle */}
          <button onClick={() => setScribeActive(s => !s)}
            style={{ height: 40, padding: '0 16px', borderRadius: 12, border: `1px solid ${scribeActive ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.12)'}`, background: scribeActive ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.04)', color: scribeActive ? '#38bdf8' : '#64748b', cursor: 'pointer', fontSize: '.76rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.2s' }}
          >
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            AI Scribe {scribeActive ? 'ON' : 'OFF'}
          </button>

          <div style={{ flex: 1 }}></div>

          {/* End call big red button */}
          <button onClick={handleEndCall}
            style={{ height: 48, padding: '0 28px', borderRadius: 24, background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', color: '#fff', fontWeight: 700, fontSize: '.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 20px rgba(239,68,68,0.35)' }}
          >
            <i className="fa-solid fa-phone-slash"></i> End Call
          </button>
        </div>

      </div>
    </div>
  );
}
