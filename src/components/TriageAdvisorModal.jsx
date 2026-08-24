import { useState, useRef, useEffect } from 'react';
import { suggestDepartmentFromSymptoms, SUPPORTED_LANGUAGES, speakText, stopSpeaking } from '../utils/gemini';
import { showToast } from './Toast';

const URGENCY_META = {
  Low:       { color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', icon: '🟢' },
  Moderate:  { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', icon: '🟡' },
  High:      { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', icon: '🔴' },
  Emergency: { color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', icon: '🚨' },
};

export default function TriageAdvisorModal({ onClose, onBookAppointment }) {
  const [step, setStep] = useState('input'); // 'input' | 'analyzing' | 'results'
  const [language, setLanguage] = useState('en-IN');
  const [symptoms, setSymptoms] = useState('');
  const [result, setResult] = useState(null);
  const [listening, setListening] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const recognitionRef = useRef(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SR);
    if (textareaRef.current) textareaRef.current.focus();
  }, []);

  const startVoiceInput = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      showToast('Voice input not available in this browser. Please type symptoms.', 'info');
      return;
    }
    const rec = new SR();
    rec.lang = language;
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setSymptoms(prev => prev ? `${prev} ${text}` : text);
    };
    rec.onerror = () => {
      setListening(false);
      showToast('Could not capture voice. Please type your symptoms.', 'info');
    };
    rec.start();
    recognitionRef.current = rec;
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
    setListening(false);
  };

  const QUICK_SYMPTOMS = [
    'Chest pain and shortness of breath',
    'Severe headache and dizziness',
    'Stomach pain and nausea',
    'Joint pain and swelling',
    'High fever and chills',
    'Skin rash and itching',
    'Blurred vision',
    'Frequent urination and thirst',
    'Anxiety and sleep difficulty',
    'Ear pain and hearing loss',
  ];

  const handleAnalyze = async () => {
    if (!symptoms.trim()) return;
    setStep('analyzing');
    const data = await suggestDepartmentFromSymptoms(symptoms, language);
    setResult(data);
    setStep('results');
  };

  const handleSpeak = (text, idx) => {
    if (speakingIdx === idx) {
      stopSpeaking();
      setSpeakingIdx(null);
      return;
    }
    stopSpeaking();
    setSpeakingIdx(idx);
    speakText(text, language);
    setTimeout(() => setSpeakingIdx(null), text.length * 60 + 500);
  };

  const urgencyMeta = URGENCY_META[result?.urgency] || URGENCY_META.Moderate;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 720, width: '95vw', padding: 0, overflow: 'hidden', borderRadius: 20 }}
      >

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)', color: '#fff', padding: '20px 26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🤖</div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  AI Triage Advisor
                </h2>
                <p style={{ margin: 0, fontSize: '.78rem', opacity: 0.8, marginTop: 3 }}>
                  Describe your symptoms → Get specialist recommendation instantly
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>

          {/* Steps indicator */}
          <div style={{ display: 'flex', gap: 0, marginTop: 18, background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
            {[
              { key: 'input', label: '1. Describe Symptoms' },
              { key: 'analyzing', label: '2. AI Analysis' },
              { key: 'results', label: '3. Recommendations' },
            ].map((s, i) => (
              <div key={s.key} style={{ padding: '5px 14px', borderRadius: 8, background: step === s.key ? 'rgba(255,255,255,0.25)' : 'transparent', fontSize: '.75rem', fontWeight: step === s.key ? 700 : 400, opacity: step === s.key ? 1 : 0.6, transition: 'all 0.3s' }}>
                {s.label}
              </div>
            ))}
          </div>
        </div>

        {/* STEP 1: Input */}
        {step === 'input' && (
          <div style={{ padding: '24px 28px', background: '#fff' }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ fontWeight: 700, fontSize: '.9rem', color: '#111827' }}>
                  📝 Describe your symptoms
                </label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 8, padding: '5px 10px', fontSize: '.78rem', color: '#374151', cursor: 'pointer' }}
                >
                  {SUPPORTED_LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ position: 'relative' }}>
                <textarea
                  ref={textareaRef}
                  value={symptoms}
                  onChange={e => setSymptoms(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAnalyze(); }}
                  placeholder="e.g., I've been having sharp chest pain for 2 days, with shortness of breath when climbing stairs, and occasional dizziness..."
                  rows={4}
                  style={{ width: '100%', padding: '14px 50px 14px 14px', borderRadius: 12, border: '2px solid #e5e7eb', fontSize: '.88rem', resize: 'none', lineHeight: 1.6, outline: 'none', transition: 'border 0.2s', fontFamily: "'Inter', sans-serif", color: '#111827' }}
                  onFocus={e => e.target.style.borderColor = '#7c3aed'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
                <button
                  onClick={listening ? stopVoiceInput : startVoiceInput}
                  style={{ position: 'absolute', right: 10, top: 10, width: 34, height: 34, borderRadius: 8, background: listening ? '#ef4444' : '#f3f4f6', border: listening ? 'none' : '1px solid #e5e7eb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.9rem', transition: 'all 0.2s' }}
                  title={listening ? 'Stop listening' : 'Speak your symptoms'}
                >
                  {listening ? '⏹' : '🎙️'}
                </button>
              </div>
              {listening && (
                <div style={{ fontSize: '.75rem', color: '#ef4444', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, background: '#ef4444', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1s infinite' }}></span>
                  Listening... speak your symptoms clearly
                </div>
              )}
              <div style={{ fontSize: '.72rem', color: '#9ca3af', marginTop: 6 }}>
                💡 Tip: Press Ctrl+Enter to analyze · {speechSupported ? '🎙️ Voice input available' : '⌨️ Type your symptoms'}
              </div>
            </div>

            {/* Quick symptom chips */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: '.75rem', fontWeight: 600, color: '#6b7280', marginBottom: 10 }}>QUICK SYMPTOMS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {QUICK_SYMPTOMS.map(s => (
                  <button
                    key={s}
                    onClick={() => setSymptoms(s)}
                    style={{ background: symptoms === s ? '#ede9fe' : '#f9fafb', border: `1px solid ${symptoms === s ? '#7c3aed' : '#e5e7eb'}`, color: symptoms === s ? '#7c3aed' : '#374151', borderRadius: 20, padding: '5px 12px', fontSize: '.75rem', cursor: 'pointer', fontWeight: symptoms === s ? 600 : 400, transition: 'all 0.15s' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!symptoms.trim()}
              style={{ width: '100%', padding: '13px', borderRadius: 12, background: symptoms.trim() ? 'linear-gradient(135deg,#7c3aed,#4c1d95)' : '#e5e7eb', border: 'none', color: symptoms.trim() ? '#fff' : '#9ca3af', fontWeight: 700, fontSize: '.95rem', cursor: symptoms.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s' }}
            >
              <span>🤖</span> Analyze Symptoms & Find Specialist
            </button>
          </div>
        )}

        {/* STEP 2: Analyzing */}
        {step === 'analyzing' && (
          <div style={{ padding: '60px 28px', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#4c1d95)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', animation: 'pulse 1.5s infinite', boxShadow: '0 0 30px rgba(124,58,237,0.4)' }}>
              🤖
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>AI Triage Analysis Running...</div>
              <div style={{ color: '#6b7280', fontSize: '.85rem', marginTop: 8 }}>
                Analyzing symptoms and matching hospital departments
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 360 }}>
              {['Parsing symptom keywords', 'Cross-referencing clinical database', 'Calculating specialist match confidence', 'Preparing recommendations'].map((task, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f9fafb', borderRadius: 8, fontSize: '.8rem', color: '#374151', animation: `fadeIn 0.3s ease ${i * 0.4}s both` }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ color: '#7c3aed', fontSize: '.7rem' }}></i>
                  {task}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Results */}
        {step === 'results' && result && (
          <div style={{ overflowY: 'auto', maxHeight: '65vh', background: '#f8f9fa' }}>

            {/* Urgency banner */}
            <div style={{ background: urgencyMeta.bg, border: `1px solid ${urgencyMeta.border}`, borderTop: 'none', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700, color: urgencyMeta.color, fontSize: '.88rem' }}>
                  {urgencyMeta.icon} Urgency Level: {result.urgency}
                </div>
                <div style={{ fontSize: '.78rem', color: '#374151', marginTop: 4 }}>{result.urgencyReason}</div>
              </div>
              <button onClick={() => setStep('input')} style={{ background: 'transparent', border: '1px solid #d1d5db', color: '#374151', borderRadius: 8, padding: '6px 14px', fontSize: '.78rem', cursor: 'pointer', fontWeight: 600 }}>
                🔄 Try Again
              </button>
            </div>

            {/* Patient advice */}
            {result.patientAdvice && (
              <div style={{ margin: '16px 20px 0', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '12px 16px', fontSize: '.83rem', color: '#1e40af' }}>
                <span style={{ fontWeight: 700 }}>💬 AI Advice: </span>{result.patientAdvice}
              </div>
            )}

            {/* Recommendations */}
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontWeight: 700, fontSize: '.88rem', color: '#374151' }}>
                🏥 Recommended Departments ({result.recommendations?.length || 0} matches)
              </div>
              {result.recommendations?.map((rec, idx) => (
                <div
                  key={rec.departmentId || idx}
                  style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: idx === 0 ? 'linear-gradient(135deg,#7c3aed,#4c1d95)' : idx === 1 ? '#eff6ff' : '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: idx === 0 ? 'none' : '1px solid #e5e7eb' }}>
                        {rec.icon}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 800, fontSize: '.98rem', color: '#111827' }}>{rec.name}</span>
                          {idx === 0 && <span style={{ background: '#7c3aed', color: '#fff', fontSize: '.65rem', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>BEST MATCH</span>}
                        </div>
                        <div style={{ fontSize: '.75rem', color: '#6b7280', marginTop: 2 }}>{rec.description}</div>
                      </div>
                    </div>

                    {/* Confidence ring */}
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: `conic-gradient(${idx === 0 ? '#7c3aed' : idx === 1 ? '#3b82f6' : '#10b981'} ${rec.confidence * 3.6}deg, #f3f4f6 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.78rem', color: '#111827' }}>
                          {rec.confidence}%
                        </div>
                      </div>
                      <div style={{ fontSize: '.6rem', color: '#6b7280', marginTop: 4 }}>Match</div>
                    </div>
                  </div>

                  {/* Confidence bar */}
                  <div style={{ background: '#f3f4f6', borderRadius: 6, height: 6, marginBottom: 10 }}>
                    <div style={{ height: '100%', borderRadius: 6, background: idx === 0 ? 'linear-gradient(90deg,#7c3aed,#9f67ff)' : idx === 1 ? '#3b82f6' : '#10b981', width: `${rec.confidence}%`, transition: 'width 0.8s ease' }}></div>
                  </div>

                  <div style={{ fontSize: '.8rem', color: '#4b5563', marginBottom: 10, lineHeight: 1.5 }}>
                    {rec.reasoning}
                  </div>

                  {/* Symptom tags */}
                  {rec.keySymptomMatch?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                      {rec.keySymptomMatch.map((s, si) => (
                        <span key={si} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 12, padding: '3px 10px', fontSize: '.7rem', color: '#374151' }}>🎯 {s}</span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleSpeak(rec.reasoning, idx)}
                      style={{ background: 'transparent', border: '1px solid #e5e7eb', color: speakingIdx === idx ? '#7c3aed' : '#6b7280', borderRadius: 8, padding: '6px 12px', fontSize: '.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                      <i className={`fa-solid ${speakingIdx === idx ? 'fa-stop' : 'fa-volume-high'}`}></i>
                      {speakingIdx === idx ? 'Stop' : 'Hear'}
                    </button>
                    <button
                      onClick={() => {
                        if (onBookAppointment) onBookAppointment(rec);
                        onClose();
                        showToast(`Redirecting to book appointment with ${rec.name}...`, 'success');
                      }}
                      style={{ flex: 1, background: idx === 0 ? 'linear-gradient(135deg,#7c3aed,#4c1d95)' : 'transparent', border: idx === 0 ? 'none' : '1px solid #7c3aed', color: idx === 0 ? '#fff' : '#7c3aed', borderRadius: 8, padding: '7px 14px', fontSize: '.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    >
                      <i className="fa-solid fa-calendar-plus"></i> Book Appointment
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* Footer disclaimer */}
        <div style={{ background: '#fafafa', borderTop: '1px solid #e5e7eb', padding: '10px 24px', fontSize: '.7rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="fa-solid fa-circle-info" style={{ color: '#d1d5db' }}></i>
          AI triage recommendations are for guidance only. Please see a qualified physician for clinical diagnosis.
        </div>

      </div>
    </div>
  );
}
