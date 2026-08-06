import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const AI_RESPONSES = {
  'chest pain': ["I understand. How long have you had this pain?", "Does it radiate to your left arm or jaw?", "Are you experiencing shortness of breath? Based on your symptoms, I recommend a Cardiologist consultation. 🏥"],
  'headache': ["I'm sorry to hear that. Is it throbbing or constant?", "Any fever or stiff neck with it?", "I recommend a Neurologist. Would you like to book an appointment? 🧠"],
  'fever': ["Let me help. What is your temperature?", "Any cough, body pain, or rash?", "I recommend an urgent General Physician consultation. 🌡️"],
  'back pain': ["Is the pain localized or does it radiate to legs?", "Does it worsen when sitting or bending?", "An Orthopaedic specialist would be best. Shall I book? 🦴"],
  'breathing': ["This is serious. How severe is it?", "Do you have chest tightness or wheezing?", "⚠️ This needs urgent attention. I'm prioritizing an Emergency consultation."],
  'default': ["Thank you for sharing. How long have you had this?", "Any other symptoms alongside this?", "I'll recommend the most appropriate specialist. One moment..."]
};

export default function AIChat({ sessionId, compact = false }) {
  const { currentUser, userProfile, isDemoMode } = useAuth();
  const [messages, setMessages] = useState([
    { id: 'init', role: 'ai', text: "Hello! I'm your AI Health Assistant powered by MediTrust AI. Describe your symptoms and I'll guide you to the right specialist. 😊", time: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [chatState, setChatState] = useState({});
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isDemoMode || !sessionId) return;
    const q = query(collection(db, 'chats', sessionId, 'messages'), orderBy('timestamp'));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data(), time: d.data().timestamp?.toDate() }));
      if (msgs.length > 0) setMessages(msgs);
    });
    return unsub;
  }, [sessionId]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { id: Date.now() + 'u', role: 'user', text: text.trim(), time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    if (!isDemoMode && sessionId) {
      await addDoc(collection(db, 'chats', sessionId, 'messages'), {
        role: 'user', text: text.trim(), timestamp: serverTimestamp(),
        userId: currentUser?.uid
      });
    }

    // AI response
    setTimeout(() => {
      const lower = text.toLowerCase();
      let key = 'default';
      for (const k of Object.keys(AI_RESPONSES)) {
        if (k !== 'default' && lower.includes(k)) { key = k; break; }
      }
      const responses = AI_RESPONSES[key];
      const idx = (chatState[key] || 0) % responses.length;
      setChatState(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
      const aiMsg = { id: Date.now() + 'a', role: 'ai', text: responses[idx], time: new Date() };
      setMessages(prev => [...prev, aiMsg]);
    }, 700);
  };

  const formatTime = (date) => {
    if (!date) return '';
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="chat-wrap" style={compact ? { height: 360 } : {}}>
      <div className="chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`msg-row ${msg.role === 'user' ? 'user' : 'ai'}`}>
            <div className={`msg-avatar ${msg.role === 'ai' ? 'avatar avatar-sm' : 'avatar avatar-sm'}`}
              style={{ background: msg.role === 'ai' ? 'var(--primary)' : 'var(--teal-light)', color: msg.role === 'ai' ? '#fff' : 'var(--teal)' }}>
              {msg.role === 'ai' ? '🤖' : '👤'}
            </div>
            <div>
              <div className="msg-bubble">{msg.text}</div>
              <div className="msg-time">{formatTime(msg.time)}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="quick-chips">
        {['Chest pain', 'Headache', 'Fever', 'Back pain', 'Breathing difficulty'].map(q => (
          <button key={q} className="quick-chip" onClick={() => sendMessage(q)}>{q}</button>
        ))}
      </div>
      <div className="chat-input-row">
        <input
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
          placeholder="Describe your symptom..."
        />
        <button className="btn btn-primary btn-icon" onClick={() => sendMessage(input)}>
          <i className="fa-solid fa-paper-plane"></i>
        </button>
      </div>
    </div>
  );
}
