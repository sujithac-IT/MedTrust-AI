import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, doc, onSnapshot, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import AIChat from '../components/AIChat';
import { ToastContainer, showToast } from '../components/Toast';

const DEMO_SCHEDULE = [
  { id: 0, time: '7:00 AM', name: 'BP Tablet', detail: 'Amlodipine 5mg · After food', icon: '💊', color: 'var(--primary-light)', done: true },
  { id: 1, time: '9:00 AM', name: 'Morning Walk', detail: '20 minutes · Light pace', icon: '🚶', color: 'var(--secondary-light)', done: false },
  { id: 2, time: '1:00 PM', name: 'Antibiotic', detail: 'Amoxicillin 500mg · With food', icon: '💊', color: 'var(--red-light)', done: false },
  { id: 3, time: '6:00 PM', name: 'Physiotherapy', detail: 'Knee exercises · 15 min', icon: '🏃', color: 'var(--teal-light)', done: false },
  { id: 4, time: '9:00 PM', name: 'Diabetes Medicine', detail: 'Metformin 500mg · After dinner', icon: '💊', color: 'var(--amber-light)', done: false },
];

export default function PatientDashboard() {
  const { currentUser, userProfile, isDemoMode } = useAuth();
  const profile = userProfile || currentUser || {};
  const [schedule, setSchedule] = useState(DEMO_SCHEDULE);
  const [score, setScore] = useState(profile.recoveryScore || 91);
  const [waVisible, setWaVisible] = useState(false);
  const [waMsg, setWaMsg] = useState('');
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    // Show WhatsApp reminder after 4 seconds
    const t = setTimeout(() => {
      setWaMsg("⏰ Reminder: It's 1:00 PM — Time for Antibiotic (Amoxicillin 500mg). Reply 'Taken' or tap to confirm.");
      setWaVisible(true);
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (waVisible) {
      const t = setTimeout(() => setWaVisible(false), 7000);
      return () => clearTimeout(t);
    }
  }, [waVisible]);

  const markDone = (id) => {
    setSchedule(prev => prev.map(s => s.id === id ? { ...s, done: true } : s));
    const item = schedule.find(s => s.id === id);
    const newScore = Math.min(100, score + 2);
    setScore(newScore);
    showToast(`✅ ${item?.name} marked as taken! Recovery score updated to ${newScore}.`, 'success');
    setWaMsg(`✅ Confirmed! ${item?.name} taken at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Dr. Arjun Mehta has been notified.`);
    setWaVisible(true);
  };

  const done = schedule.filter(s => s.done).length;
  const adherence = Math.round((done / schedule.length) * 100);
  const circumference = 2 * Math.PI * 32;
  const dashOffset = circumference - (score / 100) * circumference;

  const tabs = [
    { id: 'home', label: 'Home', icon: 'fa-house' },
    { id: 'chat', label: 'AI Chat', icon: 'fa-robot' },
    { id: 'reports', label: 'Reports', icon: 'fa-file-medical' },
  ];

  return (
    <div className="page" style={{ background: 'var(--bg)' }}>
      <ToastContainer />

      {/* WA Float */}
      <div className={`wa-float ${waVisible ? 'show' : ''}`}>
        <span style={{ fontSize: '1.2rem' }}>💬</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '.7rem', fontWeight: 700, opacity: .75, marginBottom: 3 }}>MediTrust AI via WhatsApp</div>
          <div style={{ fontSize: '.8rem', lineHeight: 1.5 }}>{waMsg}</div>
        </div>
        <button onClick={() => setWaVisible(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: .7, fontSize: '.9rem' }}>✕</button>
      </div>

      <div className="content-grid">
        {/* Welcome Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: '.84rem', color: 'var(--text2)', fontWeight: 500 }}>Good Morning,</div>
            <h1 style={{ fontSize: '1.8rem', margin: 0 }}>{profile.displayName || 'Rahul Sharma'} 👋</h1>
            <div style={{ fontSize: '.84rem', color: 'var(--text2)', marginTop: 4 }}>Day {profile.recoveryDay || 4} of {profile.recoveryTotal || 14} · Recovery Plan Active</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/patient/book" className="btn btn-primary"><i className="fa-solid fa-calendar-plus"></i> Book Appointment</Link>
            <Link to="/patient/recovery" className="btn btn-outline"><i className="fa-solid fa-heart-pulse"></i> Recovery</Link>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-row" style={{ marginBottom: 24 }}>
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, var(--primary), #0f4c8a)', color: '#fff', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
                <svg width="64" height="64" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="36" cy="36" r="32" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="6" />
                  <circle cx="36" cy="36" r="32" fill="none" stroke="#34e8a8" strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={dashOffset} style={{ transition: 'stroke-dashoffset 1s ease' }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{score}</span>
                  <span style={{ fontSize: '.55rem', color: 'rgba(255,255,255,.7)' }}>/100</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>Recovery Score</div>
                <div style={{ fontSize: '.84rem', color: 'rgba(255,255,255,.85)', marginTop: 4 }}>Day {profile.recoveryDay || 4} of {profile.recoveryTotal || 14}</div>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-val" style={{ color: adherence >= 80 ? 'var(--secondary)' : 'var(--amber)' }}>{adherence}%</span>
            <div className="stat-lbl">Med Adherence Today</div>
            <div className="progress-track" style={{ marginTop: 10 }}><div className="progress-fill progress-green" style={{ width: `${adherence}%` }} /></div>
          </div>
          <div className="stat-card">
            <span className="stat-val" style={{ color: 'var(--primary)' }}>6 days</span>
            <div className="stat-lbl">Until Next Appointment</div>
            <div style={{ fontSize: '.78rem', color: 'var(--primary)', marginTop: 6, fontWeight: 600 }}>📅 Dr. Priya Nair · Aug 12</div>
          </div>
          <div className="stat-card">
            <span className="stat-val" style={{ color: 'var(--teal)' }}>87/100</span>
            <div className="stat-lbl">Trust Score</div>
            <div style={{ fontSize: '.78rem', color: 'var(--text2)', marginTop: 6 }}>Dr. Arjun Mehta — Excellent</div>
          </div>
        </div>

        {/* Tab Nav */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#fff', padding: 6, borderRadius: 99, border: '1px solid var(--border)', width: 'fit-content' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`btn btn-sm ${activeTab === t.id ? 'btn-primary' : 'btn-ghost'}`} style={{ borderRadius: 99 }}>
              <i className={`fa-solid ${t.icon}`}></i> {t.label}
            </button>
          ))}
        </div>

        {/* Home Tab */}
        {activeTab === 'home' && (
          <div className="dash-grid">
            <div className="dash-sidebar">
              {/* Today's Schedule */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--borderl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '.88rem', fontWeight: 700 }}>📋 Today's Schedule</span>
                  <span style={{ fontSize: '.72rem', color: 'var(--text2)' }}>{done}/{schedule.length} done</span>
                </div>
                {schedule.map(item => (
                  <div key={item.id} className={`sched-item ${item.done ? 'done' : ''}`}>
                    <span className="sched-time">{item.time}</span>
                    <div className="sched-icon" style={{ background: item.color }}>{item.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div className="sched-name">{item.name}</div>
                      <div className="sched-detail">{item.detail}</div>
                    </div>
                    <div className={`sched-check ${item.done ? 'checked' : ''}`} onClick={() => !item.done && markDone(item.id)}>✓</div>
                  </div>
                ))}
              </div>

              {/* Next Appointment */}
              <div className="card">
                <div style={{ fontSize: '.88rem', fontWeight: 700, marginBottom: 14 }}>📅 Next Appointment</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 46, height: 46, background: 'var(--primary-light)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>👩‍⚕️</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '.88rem' }}>Dr. Priya Nair</div>
                    <div style={{ fontSize: '.74rem', color: 'var(--primary)', fontWeight: 600 }}>Cardiologist</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text2)', marginTop: 2 }}>📅 Aug 12 · 11:00 AM · Video Consult</div>
                  </div>
                </div>
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>Join Call</button>
                  <Link to="/patient/book" className="btn btn-outline btn-sm">Reschedule</Link>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Recovery Progress */}
              <div className="card">
                <div style={{ fontWeight: 700, marginBottom: 16 }}>📊 Recovery Progress</div>
                {[
                  { label: 'Medication Adherence', val: adherence, color: 'progress-green' },
                  { label: 'Symptom Score', val: 82, color: 'progress-blue' },
                  { label: 'Activity Goals', val: 75, color: 'progress-gradient' },
                  { label: 'Sleep Quality', val: 85, color: 'progress-green' },
                ].map(m => (
                  <div key={m.label} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', marginBottom: 6 }}>
                      <span style={{ fontWeight: 500 }}>{m.label}</span>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{m.label === 'Medication Adherence' ? adherence : m.val}%</span>
                    </div>
                    <div className="progress-track"><div className={`progress-fill ${m.color}`} style={{ width: `${m.label === 'Medication Adherence' ? adherence : m.val}%` }} /></div>
                  </div>
                ))}
              </div>

              {/* AI Insight */}
              <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary-light), var(--teal-light))', border: '1px solid rgba(26,115,232,.15)' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, background: 'var(--primary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>🤖</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--primary)', marginBottom: 6 }}>AI Health Insight</div>
                    <p style={{ fontSize: '.84rem', lineHeight: 1.6, color: 'var(--text)' }}>
                      Your recovery is on track! Medication adherence is excellent at {adherence}%. Keep up the morning walks and physiotherapy. Dr. Priya Nair has been notified of your excellent progress. Recovery score of {score}/100 is above average for Day {profile.recoveryDay || 4}. 🎉
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card">
                <div style={{ fontWeight: 700, marginBottom: 14 }}>⚡ Quick Actions</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                  {[
                    { icon: '🆘', label: 'Emergency SOS', color: 'var(--red)', bg: 'var(--red-light)' },
                    { icon: '💬', label: 'Ask AI Doctor', color: 'var(--primary)', bg: 'var(--primary-light)', action: () => setActiveTab('chat') },
                    { icon: '📷', label: 'Upload Report', color: 'var(--teal)', bg: 'var(--teal-light)' },
                    { icon: '💊', label: 'View Prescription', color: 'var(--secondary)', bg: 'var(--secondary-light)' },
                  ].map(a => (
                    <button key={a.label} onClick={a.action} style={{ padding: '14px 10px', border: `1px solid ${a.bg}`, borderRadius: 12, background: a.bg, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'all .2s' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                      <span style={{ fontSize: '1.4rem' }}>{a.icon}</span>
                      <span style={{ fontSize: '.75rem', fontWeight: 700, color: a.color }}>{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Chat Tab */}
        {activeTab === 'chat' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, background: 'rgba(255,255,255,.18)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🤖</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '.9rem' }}>MediTrust AI Assistant</div>
                <div style={{ fontSize: '.7rem', opacity: .8 }}>● Online · Powered by Gemini AI</div>
              </div>
            </div>
            <AIChat sessionId={currentUser?.uid ? `session-${currentUser.uid}` : null} />
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { name: 'Blood Report', date: 'Jul 28, 2026', icon: '🩸', status: 'Normal', color: 'var(--secondary)' },
              { name: 'ECG Report', date: 'Jul 25, 2026', icon: '📈', status: 'Reviewed', color: 'var(--primary)' },
              { name: 'Chest X-Ray', date: 'Jul 22, 2026', icon: '🫁', status: 'Normal', color: 'var(--secondary)' },
              { name: 'MRI Scan', date: 'Jun 15, 2026', icon: '🧠', status: 'Archived', color: 'var(--text3)' },
            ].map(r => (
              <div key={r.name} className="card card-hover" style={{ cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 46, height: 46, background: 'var(--primary-light)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>{r.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '.88rem' }}>{r.name}</div>
                  <div style={{ fontSize: '.74rem', color: 'var(--text2)' }}>{r.date}</div>
                </div>
                <span className="badge badge-green" style={{ color: r.color, background: 'transparent', border: `1px solid ${r.color}` }}>{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
