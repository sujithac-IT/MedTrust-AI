import { useState } from 'react';
import { ToastContainer, showToast } from '../components/Toast';

export default function WhatsAppCompanion() {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: "👋 Hello Rahul! I'm your MediTrust AI WhatsApp Care Companion. Your post-op recovery plan is active.", time: '7:00 AM' },
    { id: 2, sender: 'bot', text: "⏰ Reminder: Time for Amlodipine 5mg (BP Tablet). Please reply 'Taken' or tap below.", time: '7:01 AM' },
    { id: 3, sender: 'user', text: "Taken", time: '7:05 AM' },
    { id: 4, sender: 'bot', text: "✅ Confirmed! Amlodipine 5mg logged at 7:05 AM. Your Digital Twin Recovery score increased to 91/100. 🌟", time: '7:05 AM' },
    { id: 5, sender: 'bot', text: "📋 Your official Digital Prescription from Dr. Arjun Mehta is ready: Amlodipine 5mg, Atorvastatin 20mg. Tap PDF to view.", time: '10:00 AM' },
  ]);

  const [input, setInput] = useState('');

  const sendMessage = (text) => {
    if (!text.trim()) return;
    const userMsg = { id: Date.now(), sender: 'user', text: text.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      let replyText = "🤖 MediTrust Bot: Received! Your query has been analyzed and logged into your EMR history. Dr. Arjun Mehta's team will be notified.";
      if (text.toLowerCase().includes('taken')) {
        replyText = "✅ Great job! Medicine recorded. Keep up the high adherence score!";
      } else if (text.toLowerCase().includes('pain') || text.toLowerCase().includes('fever')) {
        replyText = "⚠️ Symptom alert logged. If severity increases, please use our 108 Emergency SOS button immediately!";
      }
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: replyText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      showToast('New WhatsApp message received.', 'info');
    }, 1000);
  };

  return (
    <div className="page" style={{ background: '#0b141a', minHeight: 'calc(100vh - 64px)', color: '#e9edef' }}>
      <ToastContainer />
      <div style={{ maxWidth: 850, margin: '0 auto', padding: '20px 16px' }}>
        
        {/* WhatsApp Header */}
        <div style={{ background: '#202c33', padding: '14px 20px', borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid #2a3942' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#00a884', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: '#fff' }}>
            💬
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#e9edef' }}>MediTrust AI Assistant (Official WhatsApp Channel)</div>
            <div style={{ fontSize: '.75rem', color: '#00a884' }}>Verified Hospital Bot · Online 24×7</div>
          </div>
          <button className="btn btn-sm btn-outline" style={{ borderColor: '#00a884', color: '#00a884' }} onClick={() => showToast('WhatsApp notification test sent to your phone number.', 'success')}>
            Test SMS/WhatsApp Push
          </button>
        </div>

        {/* Chat Window */}
        <div style={{ background: '#0b141a', height: 460, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, borderLeft: '1px solid #202c33', borderRight: '1px solid #202c33' }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '75%', padding: '10px 14px', borderRadius: 12,
                background: msg.sender === 'user' ? '#005c4b' : '#202c33',
                color: '#e9edef', fontSize: '.88rem', lineHeight: 1.4,
                boxShadow: '0 2px 4px rgba(0,0,0,.2)'
              }}>
                <div>{msg.text}</div>
                <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.6)', textAlign: 'right', marginTop: 4 }}>{msg.time}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Quick Reply Chips */}
        <div style={{ background: '#111b21', padding: '10px 16px', display: 'flex', gap: 8, borderLeft: '1px solid #202c33', borderRight: '1px solid #202c33', flexWrap: 'wrap' }}>
          {['Taken Amlodipine', 'Snooze 15 min', 'Report Pain', 'Request Diet Plan'].map(q => (
            <button key={q} onClick={() => sendMessage(q)} style={{ background: '#202c33', border: '1px solid #00a884', color: '#00a884', padding: '6px 12px', borderRadius: 16, fontSize: '.78rem', cursor: 'pointer' }}>
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{ background: '#202c33', padding: '12px 16px', borderRadius: '0 0 12px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            style={{ flex: 1, background: '#2a3942', border: 'none', padding: '12px 16px', borderRadius: 20, color: '#fff', fontSize: '.9rem', outline: 'none' }}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            placeholder="Type a message or symptom update..."
          />
          <button onClick={() => sendMessage(input)} style={{ width: 44, height: 44, borderRadius: '50%', background: '#00a884', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>

      </div>
    </div>
  );
}
