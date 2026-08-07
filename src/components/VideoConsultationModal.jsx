import { useState, useEffect, useRef } from 'react';
import { parseMedicalScribeTranscript } from '../utils/gemini';

export default function VideoConsultationModal({ doctorName = 'Dr. Arjun Mehta', patientName = 'Rahul Sharma', onClose, onGenerateRx }) {
  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [scribeActive, setScribeActive] = useState(true);
  const [transcriptLines, setTranscriptLines] = useState([
    { speaker: 'Dr. Arjun', text: "Good morning Rahul. I see you logged chest tightness over the last 3 days." },
    { speaker: 'Patient', text: "Yes doctor, especially when walking upstairs." }
  ]);
  const videoRef = useRef(null);

  // Initialize webcam if active
  useEffect(() => {
    let stream = null;
    if (camActive && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(s => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(err => {
          console.warn("Webcam unavailable, showing camera placeholder preview:", err);
        });
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [camActive]);

  // Live scribe simulated speech feed
  useEffect(() => {
    if (!scribeActive) return;
    const additionalLines = [
      { speaker: 'Dr. Arjun', text: "Your resting BP is 138/88. Heart rate 94 bpm." },
      { speaker: 'Patient', text: "Should I continue taking the morning Amlodipine 5mg?" },
      { speaker: 'Dr. Arjun', text: "Yes, continue Amlodipine 5mg morning, and I am adding Atorvastatin 20mg at night for cholesterol." },
      { speaker: 'Dr. Arjun', text: "Also schedule an ECG review in 2 weeks. I've updated your recovery companion plan." }
    ];

    let idx = 0;
    const timer = setInterval(() => {
      if (idx < additionalLines.length) {
        setTranscriptLines(prev => [...prev, additionalLines[idx]]);
        idx++;
      } else {
        clearInterval(timer);
      }
    }, 4500);

    return () => clearInterval(timer);
  }, [scribeActive]);

  const handleFinishConsult = async () => {
    const fullTranscript = transcriptLines.map(l => `${l.speaker}: ${l.text}`).join(' ');
    const parsedRx = await parseMedicalScribeTranscript(fullTranscript);
    if (onGenerateRx) {
      onGenerateRx(parsedRx);
    }
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content video-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 960, width: '95vw', padding: 0, overflow: 'hidden', background: '#0f172a', color: '#fff', borderRadius: 16 }}>
        
        {/* Top Bar */}
        <div style={{ padding: '16px 24px', background: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 10px #10b981' }}></span>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>HD Telehealth Video Consult</div>
            <span style={{ background: 'rgba(255,255,255,.1)', fontSize: '.72rem', padding: '3px 8px', borderRadius: 6, color: '#94a3b8' }}>Encrypted WebRTC</span>
          </div>
          <div style={{ fontSize: '.84rem', color: '#94a3b8' }}>
            Consulting with: <strong style={{ color: '#fff' }}>{doctorName}</strong>
          </div>
        </div>

        {/* Video Grid & AI Scribe Sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', height: 480 }}>
          
          {/* Main Video Screen */}
          <div style={{ position: 'relative', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            
            {/* Peer Feed (Doctor/Patient) */}
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
              <div className="avatar" style={{ width: 90, height: 90, borderRadius: '50%', background: 'var(--primary)', fontSize: '2rem', marginBottom: 14, boxShadow: '0 0 30px rgba(26,115,232,.5)' }}>
                👨‍⚕️
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{doctorName}</div>
              <div style={{ fontSize: '.82rem', color: '#94a3b8', marginTop: 4 }}>Senior Consultant · Cardiology</div>
            </div>

            {/* Local Self View Overlay */}
            <div style={{ position: 'absolute', bottom: 16, right: 16, width: 160, height: 110, background: '#1e293b', borderRadius: 12, overflow: 'hidden', border: '2px solid #334155', boxShadow: '0 8px 24px rgba(0,0,0,.5)' }}>
              {camActive ? (
                <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#334155', color: '#cbd5e1', fontSize: '.8rem' }}>
                  Camera Off
                </div>
              )}
              <div style={{ position: 'absolute', bottom: 4, left: 6, fontSize: '.68rem', background: 'rgba(0,0,0,.6)', padding: '2px 6px', borderRadius: 4 }}>
                {patientName} (You)
              </div>
            </div>

            {/* Live AI Scribe Badge */}
            <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', padding: '8px 14px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,255,255,.1)' }}>
              <span className="pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }}></span>
              <span style={{ fontSize: '.78rem', fontWeight: 600 }}>AI Medical Scribe Listening</span>
            </div>

          </div>

          {/* AI Scribe Live Transcript Sidebar */}
          <div style={{ background: '#0f172a', borderLeft: '1px solid #1e293b', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 16px', background: '#182238', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '.84rem', fontWeight: 700, color: '#38bdf8' }}>
                <i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: 6 }}></i> Real-time AI Scribe
              </div>
              <button onClick={() => setScribeActive(!scribeActive)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '.75rem' }}>
                {scribeActive ? 'Pause' : 'Resume'}
              </button>
            </div>

            <div style={{ flex: 1, padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, fontSize: '.8rem' }}>
              {transcriptLines.map((line, i) => (
                <div key={i} style={{ background: '#1e293b', padding: '10px 12px', borderRadius: 8, borderLeft: line.speaker.includes('Dr') ? '3px solid #38bdf8' : '3px solid #34d399' }}>
                  <div style={{ fontSize: '.7rem', fontWeight: 700, color: line.speaker.includes('Dr') ? '#38bdf8' : '#34d399', marginBottom: 2 }}>{line.speaker}</div>
                  <div style={{ color: '#e2e8f0', lineHeight: 1.4 }}>{line.text}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: 12, background: '#182238', borderTop: '1px solid #1e293b' }}>
              <button className="btn btn-primary" onClick={handleFinishConsult} style={{ width: '100%', fontSize: '.84rem', justifyContent: 'center' }}>
                <i className="fa-solid fa-file-prescription"></i> End & Generate Rx
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Call Controls */}
        <div style={{ padding: '16px 24px', background: '#1e293b', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, borderTop: '1px solid #334155' }}>
          <button onClick={() => setMicActive(!micActive)} className={`btn ${micActive ? 'btn-outline' : 'btn-danger'}`} style={{ borderRadius: '50%', width: 48, height: 48, padding: 0, justifyContent: 'center', color: micActive ? '#fff' : '#fff' }}>
            <i className={`fa-solid ${micActive ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
          </button>
          
          <button onClick={() => setCamActive(!camActive)} className={`btn ${camActive ? 'btn-outline' : 'btn-danger'}`} style={{ borderRadius: '50%', width: 48, height: 48, padding: 0, justifyContent: 'center' }}>
            <i className={`fa-solid ${camActive ? 'fa-video' : 'fa-video-slash'}`}></i>
          </button>

          <button onClick={() => setScreenSharing(!screenSharing)} className={`btn ${screenSharing ? 'btn-primary' : 'btn-outline'}`} style={{ borderRadius: '50%', width: 48, height: 48, padding: 0, justifyContent: 'center' }}>
            <i className="fa-solid fa-desktop"></i>
          </button>

          <button onClick={handleFinishConsult} className="btn btn-danger" style={{ padding: '0 24px', borderRadius: 24, height: 48, background: '#ef4444', border: 'none', color: '#fff', fontWeight: 700 }}>
            <i className="fa-solid fa-phone-slash" style={{ marginRight: 8 }}></i> End Call
          </button>
        </div>

      </div>
    </div>
  );
}
