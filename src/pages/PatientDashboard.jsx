import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import AIChat from '../components/AIChat';
import { ToastContainer, showToast } from '../components/Toast';
import PrescriptionModal from '../components/PrescriptionModal';
import VideoConsultationModal from '../components/VideoConsultationModal';
import TriageAdvisorModal from '../components/TriageAdvisorModal';
import CaseSheetModal from '../components/CaseSheetModal';

const DEMO_SCHEDULE = [
  { id: 0, time: '7:00 AM', name: 'BP Tablet', detail: 'Amlodipine 5mg · After food', icon: '💊', color: 'var(--primary-light)', done: true },
  { id: 1, time: '9:00 AM', name: 'Morning Walk', detail: '20 minutes · Light pace', icon: '🚶', color: 'var(--secondary-light)', done: false },
  { id: 2, time: '1:00 PM', name: 'Antibiotic', detail: 'Amoxicillin 500mg · With food', icon: '💊', color: 'var(--red-light)', done: false },
  { id: 3, time: '6:00 PM', name: 'Physiotherapy', detail: 'Knee exercises · 15 min', icon: '🏃', color: 'var(--teal-light)', done: false },
  { id: 4, time: '9:00 PM', name: 'Diabetes Medicine', detail: 'Metformin 500mg · After dinner', icon: '💊', color: 'var(--amber-light)', done: false },
];

export default function PatientDashboard() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const profile = userProfile || currentUser || {};
  const [schedule, setSchedule] = useState(DEMO_SCHEDULE);
  const [score, setScore] = useState(profile.recoveryScore || 91);
  const [waVisible, setWaVisible] = useState(false);
  const [waMsg, setWaMsg] = useState('');
  const [activeTab, setActiveTab] = useState('home');

  const [activeRx, setActiveRx] = useState(null);
  const [videoCallActive, setVideoCallActive] = useState(false);

  // NEW feature states
  const [triageOpen, setTriageOpen] = useState(false);
  const [activeCaseSheetView, setActiveCaseSheetView] = useState(null);
  const [myRecords, setMyRecords] = useState([]);

  // WhatsApp reminder
  useEffect(() => {
    const t = setTimeout(() => {
      setWaMsg("⏰ Reminder: It's 1:00 PM — Time for Antibiotic (Amoxicillin 500mg). Reply 'Taken' or tap to confirm.");
      setWaVisible(true);
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (waVisible) {
      const t = setTimeout(() => setWaVisible(false), 7000);
      return () => clearTimeout(t);
    }
  }, [waVisible]);

  // Firestore: load patient's own hospital records
  useEffect(() => {
    try {
      const patId = profile.uid || 'MT001';
      const q = query(
        collection(db, 'hospitalRecords'),
        orderBy('postedAt', 'desc'),
        limit(10)
      );
      const unsub = onSnapshot(q, (snap) => {
        const records = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMyRecords(records);
      });
      return unsub;
    } catch (e) {
      console.warn('Firestore patient records listener:', e);
    }
  }, []);

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
    { id: 'reports', label: 'Records & Prescriptions', icon: 'fa-file-medical' },
  ];

  return (
    <div className="page" style={{ background: 'var(--bg)' }}>
      <ToastContainer />

      {/* Prescription Modal */}
      {activeRx && (
        <PrescriptionModal
          rx={activeRx}
          patient={{ name: profile.displayName || 'Rahul Sharma', age: 42, gender: 'Male', id: 'MT001' }}
          onClose={() => setActiveRx(null)}
        />
      )}

      {/* Video Consultation Modal */}
      {videoCallActive && (
        <VideoConsultationModal
          patientName={profile.displayName || 'Rahul Sharma'}
          doctorName="Dr. Arjun Mehta"
          onClose={() => setVideoCallActive(false)}
          onGenerateRx={(newRx) => {
            setActiveRx(newRx);
            showToast('Prescription updated from Telehealth consult!', 'success');
          }}
        />
      )}

      {/* NEW: Triage Advisor Modal */}
      {triageOpen && (
        <TriageAdvisorModal
          onClose={() => setTriageOpen(false)}
          onBookAppointment={(dept) => {
            setTriageOpen(false);
            navigate('/patient/book');
          }}
        />
      )}

      {/* NEW: Case Sheet View Modal */}
      {activeCaseSheetView && (
        <CaseSheetModal
          caseSheet={activeCaseSheetView}
          patient={{ name: profile.displayName || 'Rahul Sharma', age: 42, gender: 'Male', id: 'MT001' }}
          transcriptLines={[]}
          onClose={() => setActiveCaseSheetView(null)}
        />
      )}

      {/* WhatsApp Floating Alert */}
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
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {/* NEW: First Visit / Triage button */}
            <button className="btn btn-outline" onClick={() => setTriageOpen(true)} style={{ borderColor: '#7c3aed', color: '#7c3aed' }}>
              <i className="fa-solid fa-robot"></i> AI Triage Advisor
            </button>
            <button className="btn btn-primary" onClick={() => setVideoCallActive(true)}>
              <i className="fa-solid fa-video"></i> Video Consult
            </button>
            <Link to="/patient/book" className="btn btn-outline"><i className="fa-solid fa-calendar-plus"></i> Book Appt</Link>
            <Link to="/patient/recovery" className="btn btn-outline"><i className="fa-solid fa-heart-pulse"></i> Recovery</Link>
          </div>
        </div>

        {/* NEW: First Visit Triage Banner (prominent card) */}
        <div style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)', borderRadius: 16, padding: '18px 24px', marginBottom: 24, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>🤖</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>First Visit? Not sure which department to go to?</div>
              <div style={{ fontSize: '.82rem', opacity: 0.85, marginTop: 4 }}>
                Tell our AI your symptoms — get instant specialist recommendations in multiple languages
              </div>
            </div>
          </div>
          <button
            onClick={() => setTriageOpen(true)}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)', color: '#fff', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(4px)' }}
          >
            <i className="fa-solid fa-stethoscope"></i> Find My Department
          </button>
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
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', color: '#fff' }}>
                  {score}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '.75rem', opacity: .8 }}>DIGITAL TWIN SCORE</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, margin: '2px 0' }}>{score >= 85 ? 'Excellent Recovery' : 'Moderate Adherence'}</div>
                <div style={{ fontSize: '.72rem', opacity: .8 }}>Top 5% recovery trajectory</div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--secondary-light)', color: 'var(--secondary)' }}><i className="fa-solid fa-pills"></i></div>
            <div>
              <div className="stat-num">{adherence}%</div>
              <div className="stat-label">Today's Med Adherence</div>
              <div className="progress-track" style={{ marginTop: 6, width: 100 }}>
                <div className="progress-fill progress-green" style={{ width: `${adherence}%` }}></div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--teal-light)', color: 'var(--teal)' }}><i className="fa-solid fa-calendar-check"></i></div>
            <div>
              <div className="stat-num">Aug 20</div>
              <div className="stat-label">Next Video Follow-up</div>
              <div style={{ fontSize: '.72rem', color: 'var(--text2)', marginTop: 4 }}>Dr. Arjun Mehta · Cardiology</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--amber-light)', color: 'var(--amber)' }}><i className="fa-solid fa-shield-heart"></i></div>
            <div>
              <div className="stat-num">98%</div>
              <div className="stat-label">AI Trust Metric</div>
              <div style={{ fontSize: '.72rem', color: 'var(--text2)', marginTop: 4 }}>Doctor-Patient Sync High</div>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
          {tabs.map(t => (
            <button key={t.id} className={`btn ${activeTab === t.id ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab(t.id)}>
              <i className={`fa-solid ${t.icon}`}></i> {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Home Schedule */}
        {activeTab === 'home' && (
          <div className="dash-grid">
            <div className="dash-main">
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>📋 Today's Medication & Care Schedule</h3>
                    <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>Click checkmark when completed</div>
                  </div>
                  <span className="badge badge-green">{done}/{schedule.length} Completed</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {schedule.map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 12, borderRadius: 10, background: s.done ? 'var(--bg)' : '#fff', border: '1px solid var(--border)', opacity: s.done ? 0.75 : 1 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 10, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                        {s.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong style={{ fontSize: '.9rem', textDecoration: s.done ? 'line-through' : 'none' }}>{s.name}</strong>
                          <span style={{ fontSize: '.72rem', color: 'var(--text2)' }}>• {s.time}</span>
                        </div>
                        <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>{s.detail}</div>
                      </div>
                      <button onClick={() => markDone(s.id)} disabled={s.done} className={`btn btn-sm ${s.done ? 'btn-outline' : 'btn-primary'}`} style={{ borderRadius: 20 }}>
                        {s.done ? '✓ Completed' : 'Mark Taken'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="dash-sidebar">
              <div className="card">
                <h4 style={{ margin: '0 0 12px 0', fontSize: '.9rem' }}>📄 Digital Prescriptions</h4>
                <p style={{ fontSize: '.8rem', color: 'var(--text2)', lineHeight: 1.5 }}>
                  View, download, or print official hospital prescriptions generated by Dr. Arjun Mehta & AI Medical Scribe.
                </p>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={() => setActiveRx({})}>
                  <i className="fa-solid fa-file-prescription"></i> View Latest Rx (PDF)
                </button>
              </div>

              <div className="card">
                <h4 style={{ margin: '0 0 10px 0', fontSize: '.9rem' }}>📹 Scheduled Video Consultation</h4>
                <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 8, fontSize: '.8rem', marginBottom: 12 }}>
                  <div><strong>Dr. Arjun Mehta</strong></div>
                  <div style={{ color: 'var(--text2)', fontSize: '.75rem' }}>Today at 10:30 AM · Cardiology</div>
                </div>
                <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => setVideoCallActive(true)}>
                  <i className="fa-solid fa-video"></i> Launch Video Room
                </button>
              </div>

              {/* NEW: Triage card in sidebar */}
              <div className="card" style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', border: '1px solid #c4b5fd' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '.9rem', color: '#7c3aed' }}>🤖 AI Triage Advisor</h4>
                <p style={{ fontSize: '.78rem', color: '#6b7280', lineHeight: 1.5, marginBottom: 12 }}>
                  Don't know which doctor to see? Describe symptoms and AI will guide you.
                </p>
                <button className="btn btn-sm" style={{ width: '100%', background: '#7c3aed', border: 'none', color: '#fff', borderRadius: 8, padding: 8, fontWeight: 600, cursor: 'pointer' }} onClick={() => setTriageOpen(true)}>
                  Find Specialist →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: AI Chat */}
        {activeTab === 'chat' && (
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ marginTop: 0, fontSize: '1.1rem' }}>🤖 AI Symptom Intelligence & Clinical Chat</h3>
            <p style={{ fontSize: '.84rem', color: 'var(--text2)', marginBottom: 20 }}>
              Discuss your symptoms with our Gemini-powered AI engine. Guidance is automatically sent to your attending physician.
            </p>
            {/* Quick triage link */}
            <div style={{ background: '#f5f3ff', border: '1px solid #c4b5fd', borderRadius: 10, padding: '10px 14px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '.82rem', color: '#7c3aed', fontWeight: 600 }}>
                🏥 First visit or unsure which department?
              </div>
              <button onClick={() => setTriageOpen(true)} style={{ background: '#7c3aed', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 14px', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer' }}>
                Use AI Triage
              </button>
            </div>
            <AIChat onOpenTriage={() => setTriageOpen(true)} />
          </div>
        )}

        {/* Tab 3: Records & Prescriptions */}
        {activeTab === 'reports' && (
          <div className="card">
            <h3 style={{ marginTop: 0, fontSize: '1.1rem' }}>🏥 Official Health Records & Digital Prescriptions</h3>

            {/* HMS Case Sheets from Firestore */}
            {myRecords.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 700, fontSize: '.85rem', marginBottom: 12, color: 'var(--text)' }}>
                  📋 Hospital Management System Records
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                  {myRecords.slice(0, 6).map((rec, i) => (
                    <div key={rec.id || i} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', background: 'var(--bg)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <span className="badge badge-green">✅ HMS Record</span>
                        <span style={{ fontSize: '1.3rem' }}>📋</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: 4 }}>{rec.diagnosis || 'Case Sheet'}</div>
                      <div style={{ fontSize: '.75rem', color: 'var(--text2)', marginBottom: 4 }}>
                        Dr. {rec.doctorName || 'Arjun Mehta'} · {rec.icdCode || ''}
                      </div>
                      <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginBottom: 12 }}>
                        Record #{(rec.id || 'DEMO').slice(0, 12)} · {rec.hospitalName || 'MediTrust AI Health Institute'}
                      </div>
                      <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => setActiveCaseSheetView(rec)}>
                        <i className="fa-solid fa-eye"></i> View Full Case Sheet
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Static prescriptions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div style={{ border: '1px solid var(--border)', padding: 16, borderRadius: 10, background: 'var(--bg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="badge badge-green">Official Rx</span>
                    <h4 style={{ margin: '8px 0 4px 0', fontSize: '.95rem' }}>Cardiology Prescribed Plan</h4>
                    <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>Dr. Arjun Mehta · Aug 6, 2026</div>
                  </div>
                  <span style={{ fontSize: '1.5rem' }}>📜</span>
                </div>
                <div style={{ fontSize: '.78rem', marginTop: 12, color: 'var(--text2)' }}>
                  Amlodipine 5mg, Atorvastatin 20mg, Metoprolol 25mg · ICD-10 I11.9
                </div>
                <button className="btn btn-primary btn-sm" style={{ marginTop: 14, width: '100%' }} onClick={() => setActiveRx({})}>
                  <i className="fa-solid fa-print"></i> View / Download Printable PDF
                </button>
              </div>

              <div style={{ border: '1px solid var(--border)', padding: 16, borderRadius: 10, background: 'var(--bg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="badge badge-blue">Lab Summary</span>
                    <h4 style={{ margin: '8px 0 4px 0', fontSize: '.95rem' }}>Lipid Profile & ECG Report</h4>
                    <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>Apollo Diagnostics · Aug 5, 2026</div>
                  </div>
                  <span style={{ fontSize: '1.5rem' }}>📊</span>
                </div>
                <div style={{ fontSize: '.78rem', marginTop: 12, color: 'var(--text2)' }}>
                  Total Cholesterol: 210 mg/dL | ECG: Sinus Tachycardia
                </div>
                <button className="btn btn-outline btn-sm" style={{ marginTop: 14, width: '100%' }} onClick={() => showToast('Downloading ECG & Lipid Lab PDF...', 'info')}>
                  <i className="fa-solid fa-download"></i> Download Lab Report
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
