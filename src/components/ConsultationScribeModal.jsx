import { useState, useEffect, useRef, useCallback } from 'react';
import { generateCaseSheet, SUPPORTED_LANGUAGES, speakText } from '../utils/gemini';

// ─── Simulated consultation lines for fallback/demo ──────────────────────────
const DEMO_LINES = [
  { speaker: 'Doctor', text: "Good morning! Please have a seat. What brings you in today?" },
  { speaker: 'Patient', text: "Doctor, I've been having chest tightness and shortness of breath for the past 3 days, especially when climbing stairs." },
  { speaker: 'Doctor', text: "I see. Any associated sweating, palpitations or left arm pain?" },
  { speaker: 'Patient', text: "Yes, some mild palpitations in the evening. No arm pain though." },
  { speaker: 'Doctor', text: "Let me check your blood pressure. It reads 138 over 88 — mildly elevated. Heart rate is 94 bpm." },
  { speaker: 'Doctor', text: "Your ECG shows sinus tachycardia. Given your lipid profile from last month showing total cholesterol at 210, I'm diagnosing you with hypertensive heart disease." },
  { speaker: 'Patient', text: "That sounds serious. What medications do I need?" },
  { speaker: 'Doctor', text: "I'm prescribing Amlodipine 5mg every morning after breakfast, and Atorvastatin 20mg at night after dinner. Both for 30 days." },
  { speaker: 'Doctor', text: "Also please reduce salt intake below 2 grams per day, and do a 30-minute walk daily. Come back in 14 days for review." },
  { speaker: 'Patient', text: "Understood, doctor. Thank you." },
];

export default function ConsultationScribeModal({ patient = {}, doctorName = 'Dr. Arjun Mehta', onClose, onCaseSheetReady }) {
  const [language, setLanguage] = useState('en-IN');
  const [recording, setRecording] = useState(false);
  const [transcriptLines, setTranscriptLines] = useState([]);
  const [waveformBars] = useState(() => Array.from({ length: 28 }, (_, i) => i));
  const [waveAnimValues, setWaveAnimValues] = useState(Array(28).fill(4));
  const [generating, setGenerating] = useState(false);
  const [speakerMode, setSpeakerMode] = useState('Doctor'); // toggle Doctor / Patient
  const [elapsedTime, setElapsedTime] = useState(0);
  const [demoIdx, setDemoIdx] = useState(0);
  const [manualInput, setManualInput] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);

  const recognitionRef = useRef(null);
  const waveTimerRef = useRef(null);
  const elapsedTimerRef = useRef(null);
  const demoTimerRef = useRef(null);
  const transcriptEndRef = useRef(null);

  // Check speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
  }, []);

  // Scroll transcript to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptLines]);

  // Waveform animation while recording
  useEffect(() => {
    if (recording) {
      waveTimerRef.current = setInterval(() => {
        setWaveAnimValues(prev => prev.map(() => Math.random() * 32 + 4));
      }, 120);
    } else {
      clearInterval(waveTimerRef.current);
      setWaveAnimValues(Array(28).fill(4));
    }
    return () => clearInterval(waveTimerRef.current);
  }, [recording]);

  // Elapsed timer
  useEffect(() => {
    if (recording) {
      elapsedTimerRef.current = setInterval(() => setElapsedTime(t => t + 1), 1000);
    } else {
      clearInterval(elapsedTimerRef.current);
    }
    return () => clearInterval(elapsedTimerRef.current);
  }, [recording]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const startRecording = useCallback(() => {
    setRecording(true);
    setElapsedTime(0);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      // Real speech recognition
      const rec = new SpeechRecognition();
      rec.lang = language;
      rec.continuous = true;
      rec.interimResults = false;
      rec.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const text = event.results[i][0].transcript.trim();
            if (text) {
              setTranscriptLines(prev => [...prev, { speaker: speakerMode, text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
            }
          }
        }
      };
      rec.onerror = () => {
        // Fallback to demo mode on error
        startDemoFeed();
      };
      rec.start();
      recognitionRef.current = rec;
    } else {
      // Demo mode: simulate feed
      startDemoFeed();
    }
  }, [language, speakerMode]);

  const startDemoFeed = useCallback(() => {
    let idx = demoIdx;
    demoTimerRef.current = setInterval(() => {
      if (idx < DEMO_LINES.length) {
        const line = DEMO_LINES[idx];
        setTranscriptLines(prev => [...prev, { ...line, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        idx++;
        setDemoIdx(idx);
      } else {
        clearInterval(demoTimerRef.current);
        setRecording(false);
      }
    }, 2800);
  }, [demoIdx]);

  const stopRecording = useCallback(() => {
    setRecording(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
    clearInterval(demoTimerRef.current);
  }, []);

  const addManualLine = () => {
    if (!manualInput.trim()) return;
    setTranscriptLines(prev => [...prev, { speaker: speakerMode, text: manualInput.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setManualInput('');
  };

  const handleGenerateCaseSheet = async () => {
    if (transcriptLines.length === 0) return;
    setGenerating(true);
    stopRecording();
    const fullTranscript = transcriptLines.map(l => `${l.speaker}: ${l.text}`).join('\n');
    const caseSheet = await generateCaseSheet(fullTranscript, {
      name: patient.name || 'Rahul Sharma',
      age: patient.age || 42,
      gender: patient.gender || 'Male',
      id: patient.id || 'MT001',
    }, language);
    setGenerating(false);
    if (onCaseSheetReady) onCaseSheetReady(caseSheet, transcriptLines);
    onClose();
  };

  const handleReadTranscript = () => {
    const text = transcriptLines.map(l => `${l.speaker} said: ${l.text}`).join('. ');
    speakText(text, language);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 820, width: '95vw', padding: 0, overflow: 'hidden', background: '#0d1117', color: '#e2e8f0', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Header */}
        <div style={{ padding: '18px 24px', background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: recording ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#1a73e8,#0f4c8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: recording ? '0 0 20px rgba(239,68,68,0.5)' : '0 0 20px rgba(26,115,232,0.4)' }}>
              🎙️
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                AI Consultation Scribe
              </div>
              <div style={{ fontSize: '.75rem', color: '#94a3b8' }}>
                {doctorName} × {patient.name || 'Patient'} · Voice-to-Case Sheet Engine
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {recording && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', padding: '5px 12px', borderRadius: 20 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }}></span>
                <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#ef4444' }}>REC {formatTime(elapsedTime)}</span>
              </div>
            )}
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#94a3b8', cursor: 'pointer', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>✕</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', height: 520 }}>

          {/* Left: Transcript */}
          <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

            {/* Controls bar */}
            <div style={{ padding: '12px 18px', background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Language picker */}
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                disabled={recording}
                style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '6px 10px', borderRadius: 8, fontSize: '.78rem', cursor: 'pointer' }}
              >
                {SUPPORTED_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                ))}
              </select>

              {/* Speaker toggle */}
              <div style={{ display: 'flex', background: '#1e293b', borderRadius: 8, padding: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
                {['Doctor', 'Patient'].map(s => (
                  <button
                    key={s}
                    onClick={() => setSpeakerMode(s)}
                    style={{ background: speakerMode === s ? (s === 'Doctor' ? '#1a73e8' : '#10b981') : 'transparent', border: 'none', color: speakerMode === s ? '#fff' : '#94a3b8', padding: '5px 12px', borderRadius: 6, fontSize: '.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    {s === 'Doctor' ? '👨‍⚕️' : '👤'} {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Live transcript */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {transcriptLines.length === 0 && !recording && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, opacity: 0.5 }}>
                  <div style={{ fontSize: '2.5rem' }}>🎙️</div>
                  <div style={{ fontSize: '.85rem', color: '#94a3b8', textAlign: 'center' }}>
                    Press <strong>Start Recording</strong> to begin capturing the consultation.<br />
                    AI will transcribe and generate the case sheet automatically.
                  </div>
                </div>
              )}
              {transcriptLines.map((line, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: line.speaker === 'Doctor' ? 'rgba(26,115,232,0.2)' : 'rgba(16,185,129,0.15)', border: `1px solid ${line.speaker === 'Doctor' ? 'rgba(26,115,232,0.3)' : 'rgba(16,185,129,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.8rem', flexShrink: 0, marginTop: 2 }}>
                    {line.speaker === 'Doctor' ? '👨‍⚕️' : '👤'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                      <span style={{ fontSize: '.72rem', fontWeight: 700, color: line.speaker === 'Doctor' ? '#38bdf8' : '#34d399' }}>{line.speaker}</span>
                      <span style={{ fontSize: '.65rem', color: '#475569' }}>{line.time}</span>
                    </div>
                    <div style={{ background: line.speaker === 'Doctor' ? 'rgba(26,115,232,0.1)' : 'rgba(16,185,129,0.08)', border: `1px solid ${line.speaker === 'Doctor' ? 'rgba(26,115,232,0.15)' : 'rgba(16,185,129,0.12)'}`, borderRadius: '4px 12px 12px 12px', padding: '8px 12px', fontSize: '.83rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                      {line.text}
                    </div>
                  </div>
                </div>
              ))}
              {recording && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', opacity: 0.6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem' }}>⏺</div>
                  <div style={{ fontSize: '.78rem', color: '#ef4444', fontStyle: 'italic' }}>Listening... speak clearly near the microphone</div>
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>

            {/* Manual input bar */}
            <div style={{ padding: '10px 14px', background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8 }}>
              <input
                value={manualInput}
                onChange={e => setManualInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addManualLine()}
                placeholder={`Type ${speakerMode} speech manually...`}
                style={{ flex: 1, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#e2e8f0', fontSize: '.82rem', outline: 'none' }}
              />
              <button onClick={addManualLine} style={{ background: '#1a73e8', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: '.82rem', fontWeight: 600 }}>+ Add</button>
            </div>
          </div>

          {/* Right: Controls panel */}
          <div style={{ background: '#0f172a', display: 'flex', flexDirection: 'column', padding: '20px 16px', gap: 16 }}>

            {/* Waveform visualizer */}
            <div style={{ background: '#1e293b', borderRadius: 14, padding: '16px 14px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: '.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '.5px' }}>AUDIO WAVEFORM</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 44 }}>
                {waveformBars.map(i => (
                  <div
                    key={i}
                    style={{
                      width: 4,
                      height: recording ? waveAnimValues[i] : 4,
                      borderRadius: 3,
                      background: recording
                        ? `hsl(${200 + i * 3}, 80%, 65%)`
                        : 'rgba(255,255,255,0.15)',
                      transition: 'height 0.1s ease',
                    }}
                  />
                ))}
              </div>
              {recording ? (
                <button
                  onClick={stopRecording}
                  style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', color: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  ⏹ Stop Recording
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'linear-gradient(135deg,#1a73e8,#0f4c8a)', border: 'none', color: '#fff', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  🎙️ {transcriptLines.length > 0 ? 'Resume' : 'Start'} Recording
                </button>
              )}
              {!speechSupported && (
                <div style={{ fontSize: '.68rem', color: '#f59e0b', textAlign: 'center', lineHeight: 1.4 }}>
                  ⚠️ Microphone API unavailable.<br />Demo simulation mode active.
                </div>
              )}
            </div>

            {/* Session info */}
            <div style={{ background: '#1e293b', borderRadius: 12, padding: '14px', border: '1px solid rgba(255,255,255,0.06)', fontSize: '.78rem' }}>
              <div style={{ fontWeight: 700, color: '#94a3b8', marginBottom: 10, letterSpacing: '.5px' }}>SESSION INFO</div>
              {[
                { label: 'Patient', val: patient.name || 'Rahul Sharma' },
                { label: 'Patient ID', val: `#${patient.id || 'MT001'}` },
                { label: 'Doctor', val: doctorName },
                { label: 'Language', val: SUPPORTED_LANGUAGES.find(l => l.code === language)?.name || 'English' },
                { label: 'Lines captured', val: transcriptLines.length },
                { label: 'Duration', val: formatTime(elapsedTime) },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: '#64748b' }}>{row.label}</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{row.val}</span>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
              {transcriptLines.length > 0 && (
                <button
                  onClick={handleReadTranscript}
                  style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa', borderRadius: 10, padding: '9px', cursor: 'pointer', fontSize: '.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  🔊 Read Transcript Aloud
                </button>
              )}
              <button
                onClick={handleGenerateCaseSheet}
                disabled={transcriptLines.length === 0 || generating}
                style={{ background: transcriptLines.length === 0 ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#10b981,#059669)', border: 'none', color: transcriptLines.length === 0 ? '#475569' : '#fff', borderRadius: 10, padding: '11px', cursor: transcriptLines.length === 0 ? 'not-allowed' : 'pointer', fontSize: '.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {generating ? (
                  <><i className="fa-solid fa-spinner fa-spin"></i> Generating AI Case Sheet...</>
                ) : (
                  <>📋 Generate Case Sheet</>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
