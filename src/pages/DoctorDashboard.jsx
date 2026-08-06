import { useState } from 'react';
import { ToastContainer, showToast } from '../components/Toast';

const PATIENTS = [
  { id: 'MT001', name: 'Rahul Sharma', age: 42, gender: 'M', condition: 'Hypertension', score: 91, scoreStatus: 'h', adherence: 95, status: 'Active', bg: '#1a73e8' },
  { id: 'MT002', name: 'Ravi Kumar', age: 54, gender: 'M', condition: 'Diabetes T2', score: 72, scoreStatus: 'm', adherence: 58, status: 'Urgent', bg: '#d93025' },
  { id: 'MT003', name: 'Meena Patel', age: 38, gender: 'F', condition: 'Post-surgery', score: 67, scoreStatus: 'l', adherence: 71, status: 'Pending', bg: '#0f9d58' },
  { id: 'MT004', name: 'Sanjay Rao', age: 45, gender: 'M', condition: 'Chest Pain', score: 88, scoreStatus: 'h', adherence: 89, status: 'Active', bg: '#7c4dff' },
  { id: 'MT005', name: 'Priya Deshpande', age: 29, gender: 'F', condition: 'Heart Failure', score: 94, scoreStatus: 'h', adherence: 97, status: 'Active', bg: '#00bfa5' },
];

const APPOINTMENTS = [
  { time: '9:00 AM', patient: 'Ravi Kumar', type: 'Diabetes management · In-person', status: 'Done', color: 'var(--secondary)' },
  { time: '10:30 AM', patient: 'Meena Patel', type: 'Wound healing review · Video', status: 'Next', color: 'var(--primary)' },
  { time: '11:00 AM', patient: 'Sanjay Rao', type: 'Chest pain, ECG review · Video', status: 'Upcoming', color: 'var(--amber)' },
  { time: '2:30 PM', patient: 'Priya Deshpande', type: 'Cardiac meds adjustment · Video', status: 'Upcoming', color: 'var(--teal)' },
  { time: '4:00 PM', patient: 'Emergency Slot', type: 'AI-prioritized emergency', status: 'Emergency', color: 'var(--red)' },
];

const SCRIBE_LINES = [
  { key: 'ECG Finding', val: 'Sinus tachycardia — Heart rate 102 bpm' },
  { key: 'Diagnosis', val: 'Hypertensive heart disease — ICD I11.9' },
  { key: 'Medicine', val: 'Atorvastatin 20mg — Once daily · 30 days' },
  { key: 'Advice', val: 'Low-sodium diet · Avoid strenuous activity · 10k steps/day' },
  { key: 'Follow-up', val: 'Return in 2 weeks — AI auto-booked: Aug 20, 11:00 AM' },
];

export default function DoctorDashboard() {
  const [recording, setRecording] = useState(false);
  const [scribeIndex, setScribeIndex] = useState(0);
  const [scribeData, setScribeData] = useState([
    { key: 'Patient', val: 'Sanjay Rao · 45M · #MT004' },
    { key: 'Complaint', val: 'Chest pain · Shortness of breath · 3 days' },
    { key: 'BP', val: '142/92 mmHg — Elevated' },
  ]);

  const toggleRecording = () => {
    if (recording) {
      setRecording(false);
      showToast('Recording stopped. AI Medical Scribe summary saved.', 'info');
    } else {
      setRecording(true);
      showToast('AI Medical Scribe listening...', 'success');
      // Simulate live transcription
      let idx = scribeIndex;
      const interval = setInterval(() => {
        if (idx < SCRIBE_LINES.length) {
          const line = SCRIBE_LINES[idx];
          setScribeData(prev => [...prev, line]);
          idx++;
          setScribeIndex(idx);
        } else {
          clearInterval(interval);
          setRecording(false);
          showToast('Voice Consultation complete! Prescription generated.', 'success');
        }
      }, 2000);
    }
  };

  return (
    <div className="page" style={{ background: 'var(--bg)' }}>
      <ToastContainer />
      <div className="content-grid">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: '.84rem', color: 'var(--text2)' }}>Welcome back,</div>
            <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Dr. Arjun Mehta 👨‍⚕️</h1>
            <div style={{ fontSize: '.84rem', color: 'var(--text2)', marginTop: 4 }}>Cardiologist · Apollo Hospital · 8 Appointments Today</div>
          </div>
          <button className="btn btn-primary" onClick={toggleRecording}>
            <i className={`fa-solid ${recording ? 'fa-stop pulse' : 'fa-microphone'}`}></i>
            {recording ? 'Stop Recording' : 'Start AI Voice Consult'}
          </button>
        </div>

        <div className="dash-grid">
          {/* Sidebar */}
          <div className="dash-sidebar">
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div className="avatar avatar-md" style={{ background: 'var(--primary)' }}>AM</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.9rem' }}>Dr. Arjun Mehta</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--primary)' }}>Cardiology Dept</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, textAlign: 'center' }}>
                <div style={{ background: 'var(--bg)', padding: 10, borderRadius: 8 }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>24</span>
                  <div style={{ fontSize: '.68rem', color: 'var(--text2)' }}>Active Patients</div>
                </div>
                <div style={{ background: 'var(--bg)', padding: 10, borderRadius: 8 }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--secondary)' }}>91%</span>
                  <div style={{ fontSize: '.68rem', color: 'var(--text2)' }}>Avg Adherence</div>
                </div>
              </div>
            </div>

            {/* AI Alerts */}
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: 12 }}>🚨 AI Alerts</div>
              <div className="alert-item">
                <div className="alert-dot" style={{ background: 'var(--red)' }}></div>
                <div>
                  <div className="alert-title">Ravi Kumar — Missed 2 doses</div>
                  <div className="alert-sub">Requires follow-up call · Urgent</div>
                </div>
              </div>
              <div className="alert-item">
                <div className="alert-dot" style={{ background: 'var(--amber)' }}></div>
                <div>
                  <div className="alert-title">Meena Patel — Score dropped to 67</div>
                  <div className="alert-sub">Schedule earlier follow-up</div>
                </div>
              </div>
            </div>

            {/* Trust Engine */}
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: 12 }}>🛡️ AI Trust Engine</div>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary)' }}>87</span>
                <div style={{ fontSize: '.72rem', color: 'var(--text2)' }}>Doctor Trust Score</div>
              </div>
              {[
                { label: 'Communication', val: 92 },
                { label: 'Patient Understanding', val: 88 },
                { label: 'Med Adherence', val: 91 },
              ].map(t => (
                <div key={t.label} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', marginBottom: 2 }}>
                    <span>{t.label}</span>
                    <span style={{ fontWeight: 700 }}>{t.val}%</span>
                  </div>
                  <div className="progress-track"><div className="progress-fill progress-blue" style={{ width: `${t.val}%` }}></div></div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Area */}
          <div className="dash-main">
            {/* AI Medical Scribe Panel */}
            <div className="card" style={{ border: recording ? '2px solid var(--primary)' : '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="fa-solid fa-microphone" style={{ color: recording ? 'var(--red)' : 'var(--primary)' }}></i>
                  AI Medical Scribe
                  {recording && <span className="badge badge-red pulse">● Live Recording</span>}
                </div>
                <span style={{ fontSize: '.75rem', color: 'var(--text2)' }}>Voice-to-Prescription Engine</span>
              </div>
              <div>
                {scribeData.map((s, i) => (
                  <div key={i} className="scribe-field">
                    <span className="scribe-key">{s.key}</span>
                    <span className="scribe-val">{s.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Patients Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--borderl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '.9rem' }}>👥 Active Patients</span>
                <button className="btn btn-outline btn-sm">+ Add Patient</button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Condition</th>
                    <th>Recovery Score</th>
                    <th>Adherence</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {PATIENTS.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar avatar-sm" style={{ background: p.bg }}>{p.name.split(' ').map(n=>n[0]).join('')}</div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{p.name}</div>
                            <div style={{ fontSize: '.68rem', color: 'var(--text2)' }}>#{p.id} · {p.age}{p.gender}</div>
                          </div>
                        </div>
                      </td>
                      <td>{p.condition}</td>
                      <td>
                        <span className={`badge badge-${p.scoreStatus === 'h' ? 'green' : p.scoreStatus === 'm' ? 'amber' : 'red'}`}>
                          {p.scoreStatus === 'h' ? '✓' : '⚠'} {p.score}/100
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-track" style={{ flex: 1, width: 80 }}>
                            <div className={`progress-fill progress-${p.adherence >= 80 ? 'green' : 'amber'}`} style={{ width: `${p.adherence}%` }}></div>
                          </div>
                          <span style={{ fontSize: '.75rem', fontWeight: 700 }}>{p.adherence}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${p.status === 'Active' ? 'green' : p.status === 'Urgent' ? 'red' : 'amber'}`}>{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Appointments Timeline */}
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 14 }}>📅 Today's Consultation Schedule</div>
              <div className="timeline">
                {APPOINTMENTS.map((a, i) => (
                  <div key={i} className="timeline-item">
                    <span className="t-time">{a.time}</span>
                    <div className="t-dot" style={{ background: a.color }}></div>
                    <div className="t-content">
                      <div className="t-patient">{a.patient}</div>
                      <div className="t-type">{a.type}</div>
                    </div>
                    <span className="badge badge-blue" style={{ background: 'transparent', borderColor: a.color, color: a.color }}>{a.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
