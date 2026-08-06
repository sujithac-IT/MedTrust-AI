import { useState } from 'react';
import { ToastContainer, showToast } from '../components/Toast';

export default function WomensHealth() {
  const [activeTab, setActiveTab] = useState('cycle');

  const periodDays = [1, 2, 3, 4, 5];
  const fertileDays = [10, 11, 12, 13, 14];
  const ovulationDay = 12;
  const today = 6;

  const cycleDays = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="page" style={{ background: 'linear-gradient(160deg, #fce4ec 0%, #f8f9fa 40%, #ede7f6 100%)' }}>
      <ToastContainer />
      <div className="content-grid">
        <div style={{ marginBottom: 28, textCenter: 'center' }}>
          <div className="section-label" style={{ color: '#c2185b' }}><i className="fa-solid fa-venus"></i> Dedicated Suite</div>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>Women's Health Intelligence</h1>
          <p style={{ color: 'var(--text2)', marginTop: 4 }}>Life-stage care from menstrual health and pregnancy companion to menopause wellness.</p>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { id: 'cycle', icon: '🌸', label: 'Menstrual Health' },
            { id: 'pregnancy', icon: '🤰', label: 'Pregnancy Companion' },
            { id: 'wellness', icon: '💆', label: 'Wellness & Menopause' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`btn ${activeTab === t.id ? 'btn-primary' : 'btn-outline'}`}
              style={activeTab === t.id ? { background: '#c2185b', borderColor: '#c2185b' } : { borderColor: '#f48fb1', color: '#c2185b' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Cycle Screen */}
        {activeTab === 'cycle' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: 14 }}>August 2026 — Cycle Tracker</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, textCenter: 'center', fontSize: '.68rem', fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>
                {['S','M','T','W','T','F','S'].map((d,i)=><span key={i} style={{ textAlign: 'center' }}>{d}</span>)}
              </div>
              <div className="cycle-cal">
                {cycleDays.map(d => {
                  let cls = '';
                  if (periodDays.includes(d)) cls = 'period';
                  else if (d === ovulationDay) cls = 'ovulation';
                  else if (fertileDays.includes(d)) cls = 'fertile';
                  return (
                    <div key={d} className={`cycle-day ${cls} ${d === today ? 'today' : ''}`}
                      onClick={() => showToast(`Day ${d}: ${cls === 'period' ? 'Menstrual phase' : cls === 'ovulation' ? 'Ovulation Day' : cls === 'fertile' ? 'Fertile Window' : 'Follicular phase'}`, 'info')}>
                      {d}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 14, fontSize: '.72rem', flexWrap: 'wrap' }}>
                <span style={{ color: '#c2185b', fontWeight: 600 }}>● Period</span>
                <span style={{ color: '#388e3c', fontWeight: 600 }}>● Fertile</span>
                <span style={{ color: '#4caf50', fontWeight: 700 }}>● Ovulation</span>
              </div>
            </div>

            <div className="card">
              <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: 14 }}>🌡️ AI Fertility Insights</div>
              {[
                { label: 'Fertile Window', val: 'Aug 10–14', color: 'var(--secondary)' },
                { label: 'Ovulation Day', val: 'Aug 12', color: 'var(--secondary)' },
                { label: 'Next Period', val: 'Aug 22 (Est.)', color: '#c2185b' },
                { label: 'Cycle Regularity', val: 'Regular ✓', color: 'var(--primary)' },
              ].map(i => (
                <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--borderl)', fontSize: '.84rem' }}>
                  <span style={{ color: 'var(--text2)' }}>{i.label}</span>
                  <span style={{ fontWeight: 700, color: i.color }}>{i.val}</span>
                </div>
              ))}
            </div>

            <div className="card" style={{ background: 'var(--pink-light)', border: '1px solid #f48fb1' }}>
              <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#c2185b', marginBottom: 6 }}>🤖 AI Health Insight</div>
              <p style={{ fontSize: '.84rem', color: '#880e4f', lineHeight: 1.6 }}>
                Your cycle has been regular for 4 consecutive months. No hormonal anomalies detected. AI recommends scheduling your annual gynecology wellness check in the next 30 days.
              </p>
            </div>
          </div>
        )}

        {/* Pregnancy Screen */}
        {activeTab === 'pregnancy' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            <div className="card" style={{ background: 'linear-gradient(135deg, #fce4ec, #f8bbd0)', border: '1px solid #f48fb1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#c2185b' }}>Week 24</div>
                  <div style={{ fontSize: '.84rem', color: '#880e4f', fontWeight: 600 }}>2nd Trimester · ~16 weeks to go</div>
                </div>
                <span style={{ fontSize: '2.8rem' }}>👶</span>
              </div>
              <div className="progress-track" style={{ marginTop: 14, height: 10, background: 'rgba(194,24,91,.15)' }}>
                <div className="progress-fill" style={{ width: '60%', background: '#c2185b' }}></div>
              </div>
              <div style={{ fontSize: '.75rem', color: '#880e4f', marginTop: 6 }}>60% of pregnancy complete</div>
            </div>

            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 10 }}>🍼 This Week — Baby Development</div>
              <p style={{ fontSize: '.84rem', color: 'var(--text2)', lineHeight: 1.6 }}>
                Your baby is about 30 cm long and weighs approx 600g. The brain is developing rapidly. You may feel stronger kicks this week! 💕
              </p>
            </div>

            <div className="card" style={{ background: 'var(--red-light)', border: '1px solid rgba(217,48,37,.2)' }}>
              <div style={{ fontWeight: 700, color: 'var(--red)', marginBottom: 6 }}>🚨 Maternal Risk Monitor</div>
              <p style={{ fontSize: '.82rem', color: 'var(--text2)', lineHeight: 1.5, marginBottom: 12 }}>
                BP slightly elevated at last visit. AI has alerted Dr. Sunita Kulkarni. If you feel dizziness or headache, tap Emergency SOS.
              </p>
              <button className="btn btn-danger btn-sm" onClick={() => showToast('🆘 Maternal SOS Alert Sent to Hospital & Emergency Contacts!', 'error')}>
                🆘 Emergency SOS
              </button>
            </div>
          </div>
        )}

        {/* Wellness Screen */}
        {activeTab === 'wellness' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 12 }}>🧠 Postpartum & Mental Wellness Check</div>
              {[
                { label: 'Mood Stability', emojis: ['😣','😐','🙂','😁'], sel: 2 },
                { label: 'Sleep Quality', emojis: ['😣','😐','🙂','😁'], sel: 1 },
                { label: 'Anxiety Level', emojis: ['😣','😐','🙂','😁'], sel: 0 },
              ].map(w => (
                <div key={w.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--borderl)' }}>
                  <span style={{ fontSize: '.84rem' }}>{w.label}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {w.emojis.map((e, idx) => (
                      <span key={idx} style={{ fontSize: '1.1rem', cursor: 'pointer', opacity: idx === w.sel ? 1 : 0.4 }} onClick={() => showToast(`${w.label} logged!`, 'success')}>{e}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="card" style={{ background: 'var(--purple-light)', border: '1px solid rgba(124,77,255,.2)' }}>
              <div style={{ fontWeight: 700, color: 'var(--purple)', marginBottom: 8 }}>🌟 Menopause AI Coach</div>
              <p style={{ fontSize: '.84rem', color: 'var(--text2)', lineHeight: 1.6, marginBottom: 12 }}>
                Personalized wellness plan including nutrition adjustments, bone density exercises, and sleep hygiene.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['🥗 Calcium-rich diet plan — Updated daily', '🏋️ Bone strength exercises — 3×/week', '😴 Sleep hygiene routine — Personalized', '🧘 Mindfulness sessions — Daily 10 min'].map(item => (
                  <div key={item} style={{ fontSize: '.8rem', color: 'var(--text)' }}>{item}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
