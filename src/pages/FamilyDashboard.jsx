import { useState } from 'react';
import { ToastContainer, showToast } from '../components/Toast';

export default function FamilyDashboard() {
  const [patient] = useState({
    name: 'Rahul Sharma',
    relation: 'Spouse (Husband)',
    age: 42,
    patientId: 'MT001',
    attendingDoctor: 'Dr. Arjun Mehta',
    condition: 'Post-Cardiac Angioplasty',
    recoveryScore: 91,
    medAdherence: 95,
    lastUpdate: '10 mins ago · BP 120/80 mmHg recorded'
  });

  const [alerts] = useState([
    { id: 1, type: 'Medication Taken', text: 'Rahul took Amlodipine 5mg at 7:00 AM', time: '7:05 AM', icon: '✅', color: 'green' },
    { id: 2, type: 'Doctor Note', text: 'Dr. Arjun Mehta updated follow-up to Aug 20', time: 'Yesterday', icon: '👨‍⚕️', color: 'blue' },
    { id: 3, type: 'Vitals Recorded', text: 'Morning BP 120/80 mmHg, HR 75 bpm', time: 'Yesterday', icon: '🩺', color: 'teal' },
  ]);

  return (
    <div className="page" style={{ background: 'var(--bg)' }}>
      <ToastContainer />
      <div className="content-grid">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: '.84rem', color: 'var(--text2)' }}>Family Care Portal · Connected Account</div>
            <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Family Member Dashboard 👨‍👩‍👧</h1>
            <div style={{ fontSize: '.84rem', color: 'var(--text2)', marginTop: 4 }}>Monitoring Care for: <strong>{patient.name}</strong> ({patient.relation})</div>
          </div>
          <button className="btn btn-primary" onClick={() => showToast('🔔 Family SMS Alerts active for emergency & medicine drops.', 'success')}>
            <i className="fa-solid fa-bell"></i> Family Alerts Active
          </button>
        </div>

        <div className="dash-grid">
          {/* Main Status & Recovery */}
          <div className="dash-main">
            {/* Patient Header Card */}
            <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary), #0f4c8a)', color: '#fff', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <span style={{ fontSize: '.75rem', opacity: .8, textTransform: 'uppercase', letterSpacing: '.5px' }}>PATIENT DIGITAL TWIN STATUS</span>
                  <h2 style={{ margin: '4px 0 6px', color: '#fff', fontSize: '1.5rem' }}>{patient.name} (#{patient.patientId})</h2>
                  <div style={{ fontSize: '.84rem', opacity: .9 }}>{patient.condition} · Attending: {patient.attendingDoctor}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#34e8a8' }}>{patient.recoveryScore}/100</div>
                  <div style={{ fontSize: '.75rem', opacity: .8 }}>Recovery Progress Index</div>
                </div>
              </div>
            </div>

            {/* Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
              <div className="card">
                <div style={{ fontSize: '.75rem', color: 'var(--text2)' }}>MEDICATION ADHERENCE</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--secondary)', margin: '4px 0' }}>{patient.medAdherence}%</div>
                <div className="progress-track"><div className="progress-fill progress-green" style={{ width: `${patient.medAdherence}%` }}></div></div>
              </div>

              <div className="card">
                <div style={{ fontSize: '.75rem', color: 'var(--text2)' }}>LAST RECORDED VITALS</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', margin: '4px 0' }}>BP 120/80 mmHg</div>
                <div style={{ fontSize: '.72rem', color: 'var(--text2)' }}>HR: 75 bpm · SpO2: 98%</div>
              </div>

              <div className="card">
                <div style={{ fontSize: '.75rem', color: 'var(--text2)' }}>NEXT DOCTOR VISIT</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--amber)', margin: '4px 0' }}>Aug 20, 10:30 AM</div>
                <div style={{ fontSize: '.72rem', color: 'var(--text2)' }}>Video Consultation</div>
              </div>
            </div>

            {/* Care Activity Stream */}
            <div className="card">
              <h3 style={{ marginTop: 0, fontSize: '1.05rem', marginBottom: 14 }}>📜 Care Updates & Medication Logs</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {alerts.map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '1.4rem' }}>{a.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '.88rem', fontWeight: 600 }}>{a.text}</div>
                      <div style={{ fontSize: '.75rem', color: 'var(--text2)' }}>{a.type} · {a.time}</div>
                    </div>
                    <span className={`badge badge-${a.color}`}>Verified</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar: Emergency Location & Doctor Contact */}
          <div className="dash-sidebar">
            <div className="card">
              <h3 style={{ marginTop: 0, fontSize: '1rem', marginBottom: 12 }}>📍 Emergency GPS Location</h3>
              <p style={{ fontSize: '.78rem', color: 'var(--text2)', marginBottom: 12 }}>Live location tracking during active SOS alerts.</p>
              <div style={{ height: 140, background: '#1e293b', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.8rem', textAlignment: 'center', padding: 10 }}>
                <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>🏠 📍</div>
                <div>Home Location · Safe</div>
                <div style={{ fontSize: '.7rem', color: '#94a3b8', marginTop: 2 }}>Lat 12.9716 N, Lon 77.5946 E</div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0, fontSize: '1rem', marginBottom: 12 }}>👨‍⚕️ Attending Physician</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div className="avatar avatar-md" style={{ background: 'var(--primary)' }}>AM</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.9rem' }}>Dr. Arjun Mehta</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--text2)' }}>Senior Cardiologist</div>
                </div>
              </div>
              <button className="btn btn-outline w-full" onClick={() => showToast('Connecting call to Dr. Arjun Mehta\'s assistant...', 'info')}>
                <i className="fa-solid fa-phone"></i> Call Doctor's Office
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
