import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { callGemini, SUPPORTED_LANGUAGES, speakText } from '../utils/gemini';

export default function AIChat({ sessionId, compact = false, onOpenTriage }) {
  const { currentUser, isDemoMode } = useAuth();
  const [messages, setMessages] = useState([
    { id: 'init', role: 'ai', text: "Hello! I'm your MediTrust AI Clinical Assistant. Describe your symptoms and I'll analyze them with clinical intelligence. You can also type 'which department' or 'first visit' to get specialist recommendations. 😊", time: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en-IN');
  const [listening, setListening] = useState(false);
  const [lastAiText, setLastAiText] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SR);
  }, []);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (isDemoMode || !sessionId) return;
    const q = query(collection(db, 'chats', sessionId, 'messages'), orderBy('timestamp'));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data(), time: d.data().timestamp?.toDate() }));
      if (msgs.length > 0) setMessages(msgs);
    });
    return unsub;
  }, [sessionId, isDemoMode]);

  // Detect "triage" keywords to prompt advisor
  const detectTriageIntent = (text) => {
    const lower = text.toLowerCase();
    return (
      lower.includes('which department') ||
      lower.includes('which doctor') ||
      lower.includes('which specialty') ||
      lower.includes('first visit') ||
      lower.includes('new patient') ||
      lower.includes('where should i go') ||
      lower.includes('which specialist') ||
      lower.includes('what kind of doctor')
    );
  };

  const startVoiceInput = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = language;
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setInput(prev => prev ? `${prev} ${text}` : text);
    };
    rec.onerror = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setListening(false);
  };

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userText = text.trim();

    // Check for triage intent
    if (detectTriageIntent(userText) && onOpenTriage) {
      const userMsg = { id: Date.now() + 'u', role: 'user', text: userText, time: new Date() };
      const triageMsg = { id: Date.now() + 'a', role: 'ai', text: "🏥 I'm opening the **AI Triage Advisor** for you! Describe your symptoms there and I'll recommend the right department and specialist. One moment...", time: new Date() };
      setMessages(prev => [...prev, userMsg, triageMsg]);
      setInput('');
      setTimeout(() => onOpenTriage(), 1200);
      return;
    }

    const userMsg = { id: Date.now() + 'u', role: 'user', text: userText, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    if (!isDemoMode && sessionId) {
      try {
        await addDoc(collection(db, 'chats', sessionId, 'messages'), {
          role: 'user', text: userText, timestamp: serverTimestamp(),
          userId: currentUser?.uid
        });
      } catch (err) {
        console.warn("Firestore message log notice:", err);
      }
    }

    // Build language-aware prompt
    const langName = SUPPORTED_LANGUAGES.find(l => l.code === language)?.name || 'English';
    const langInstruction = language !== 'en-IN' ? `Please respond in ${langName}. Keep medical terms in English.` : '';
    const systemPrompt = `You are MediTrust AI, an advanced agentic clinical assistant. Provide accurate, empathetic, and structured medical guidance. Always include appropriate specialist recommendations and triage urgency level. ${langInstruction} Disclaimer: This is AI assistance for clinical decision support.`;

    try {
      const aiResponseText = await callGemini(userText, systemPrompt);
      const aiMsg = { id: Date.now() + 'a', role: 'ai', text: aiResponseText, time: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      setLastAiText(aiResponseText);

      if (!isDemoMode && sessionId) {
        await addDoc(collection(db, 'chats', sessionId, 'messages'), {
          role: 'ai', text: aiResponseText, timestamp: serverTimestamp()
        });
      }
    } catch (e) {
      console.warn("AI Chat response error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeakLast = () => {
    if (speaking) {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      speakText(lastAiText, language);
      setTimeout(() => setSpeaking(false), lastAiText.length * 60 + 500);
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="chat-wrap" style={compact ? { height: 380 } : {}}>
      {/* Language + TTS bar */}
      <div style={{ display: 'flex', gap: 8, padding: '6px 0 10px', alignItems: 'center', borderBottom: '1px solid var(--border)', marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '.72rem', color: 'var(--text2)', fontWeight: 600 }}>Language:</span>
        <select
          value={language}
          onChange={e => setLanguage(e.target.value)}
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', fontSize: '.75rem', color: 'var(--text)', cursor: 'pointer' }}
        >
          {SUPPORTED_LANGUAGES.map(l => (
            <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
          ))}
        </select>
        {lastAiText && (
          <button
            onClick={handleSpeakLast}
            style={{ marginLeft: 'auto', background: speaking ? '#7c3aed' : 'transparent', border: `1px solid ${speaking ? '#7c3aed' : 'var(--border)'}`, color: speaking ? '#fff' : 'var(--text2)', borderRadius: 6, padding: '4px 10px', fontSize: '.72rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <i className={`fa-solid ${speaking ? 'fa-stop' : 'fa-volume-high'}`}></i>
            {speaking ? 'Stop' : 'Read Aloud'}
          </button>
        )}
      </div>

      <div className="chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`msg-row ${msg.role === 'user' ? 'user' : 'ai'}`}>
            <div className={`msg-avatar ${msg.role === 'ai' ? 'avatar avatar-sm' : 'avatar avatar-sm'}`}
              style={{ background: msg.role === 'ai' ? 'var(--primary)' : 'var(--teal-light)', color: msg.role === 'ai' ? '#fff' : 'var(--teal)' }}>
              {msg.role === 'ai' ? '🤖' : '👤'}
            </div>
            <div>
              <div className="msg-bubble" style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
              <div className="msg-time">{formatTime(msg.time)}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="msg-row ai">
            <div className="avatar avatar-sm" style={{ background: 'var(--primary)', color: '#fff' }}>🤖</div>
            <div className="msg-bubble" style={{ color: 'var(--text2)', fontStyle: 'italic' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 6 }}></i> Analyzing symptoms...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="quick-chips">
        {['Chest pain & tightness', 'High fever & chills', 'Throbbing headache', 'Back pain', 'Which department?'].map(q => (
          <button key={q} className="quick-chip" onClick={() => sendMessage(q)} disabled={loading}>{q}</button>
        ))}
      </div>

      <div className="chat-input-row">
        {/* Voice input button */}
        {speechSupported && (
          <button
            onClick={listening ? stopVoiceInput : startVoiceInput}
            style={{ background: listening ? '#ef4444' : 'var(--bg)', border: `1px solid ${listening ? '#ef4444' : 'var(--border)'}`, color: listening ? '#fff' : 'var(--text2)', borderRadius: 8, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, fontSize: '.9rem' }}
            title={listening ? 'Stop listening' : 'Voice input'}
          >
            {listening ? '⏹' : '🎙️'}
          </button>
        )}
        <input
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
          placeholder={listening ? 'Listening...' : 'Describe your symptom or ask which department...'}
          disabled={loading}
        />
        <button className="btn btn-primary btn-icon" onClick={() => sendMessage(input)} disabled={loading}>
          <i className="fa-solid fa-paper-plane"></i>
        </button>
      </div>
    </div>
  );
}
