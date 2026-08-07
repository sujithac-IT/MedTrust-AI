import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { callGemini } from '../utils/gemini';

export default function AIChat({ sessionId, compact = false }) {
  const { currentUser, isDemoMode } = useAuth();
  const [messages, setMessages] = useState([
    { id: 'init', role: 'ai', text: "Hello! I'm your MediTrust AI Clinical Assistant. Describe your symptoms and I'll analyze them with clinical intelligence. 😊", time: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

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

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userText = text.trim();
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

    // Call Gemini AI
    try {
      const aiResponseText = await callGemini(userText);
      const aiMsg = { id: Date.now() + 'a', role: 'ai', text: aiResponseText, time: new Date() };
      setMessages(prev => [...prev, aiMsg]);

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

  const formatTime = (date) => {
    if (!date) return '';
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="chat-wrap" style={compact ? { height: 380 } : {}}>
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
        {['Chest pain & tightness', 'High fever & chills', 'Throbbing headache', 'Back pain', 'Shortness of breath'].map(q => (
          <button key={q} className="quick-chip" onClick={() => sendMessage(q)} disabled={loading}>{q}</button>
        ))}
      </div>

      <div className="chat-input-row">
        <input
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
          placeholder="Describe your symptom..."
          disabled={loading}
        />
        <button className="btn btn-primary btn-icon" onClick={() => sendMessage(input)} disabled={loading}>
          <i className="fa-solid fa-paper-plane"></i>
        </button>
      </div>
    </div>
  );
}
