import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { ToastContainer, showToast } from '../components/Toast';
import VideoConsultationModal from '../components/VideoConsultationModal';
import PrescriptionModal from '../components/PrescriptionModal';
import ConsultationScribeModal from '../components/ConsultationScribeModal';
import CaseSheetModal from '../components/CaseSheetModal';

const PATIENTS = [
  { id: 'MT001', name: 'Rahul Sharma', age: 42, gender: 'Male', condition: 'Hypertension', score: 91, scoreStatus: 'h', adherence: 95, status: 'Active', bg: '#1a73e8' },
  { id: 'MT002', name: 'Ravi Kumar', age: 54, gender: 'Male', condition: 'Diabetes T2', score: 72, scoreStatus: 'm', adherence: 58, status: 'Urgent', bg: '#d93025' },
  { id: 'MT003', name: 'Meena Patel', age: 38, gender: 'Female', condition: 'Post-surgery', score: 67, scoreStatus: 'l', adherence: 71, status: 'Pending', bg: '#0f9d58' },
  { id: 'MT004', name: 'Sanjay Rao', age: 45, gender: 'Male', condition: 'Chest Pain', score: 88, scoreStatus: 'h', adherence: 89, status: 'Active', bg: '#7c4dff' },
  { id: 'MT005', name: 'Priya Deshpande', age: 29, gender: 'Female', condition: 'Heart Failure', score: 94, scoreStatus: 'h', adherence: 97, status: 'Active', bg: '#00bfa5' },
];

const INITIAL_APPOINTMENTS = [
  { time: '9:00 AM', patient: 'Ravi Kumar', type: 'Diabetes management · In-person', status: 'Done', color: 'var(--secondary)' },
  { time: '10:30 AM', patient: 'Meena Patel', type: 'Wound healing review · Video', status: 'Next', color: 'var(--primary)', isVideo: true },
  { time: '11:00 AM', patient: 'Sanjay Rao', type: 'Chest pain, ECG review · Video', status: 'Upcoming', color: 'var(--amber)', isVideo: true },
  { time: '2:30 PM', patient: 'Priya Deshpande', type: 'Cardiac meds adjustment · Video', status: 'Upcoming', color: 'var(--teal)', isVideo: true },
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
  const { isDemoMode } = useAuth();

  // Legacy scribe state
  const [recording, setRecording] = useState(false);
  const [scribeIndex, setScribeIndex] = useState(0);
  const [scribeData, setScribeData] = useState([
    { key: 'Patient', val: 'Rahul Sharma · 42M · #MT001' },
    { key: 'Complaint', val: 'Chest tightness · Exertional dyspnea · 3 days' },
    { key: 'BP', val: '138/88 mmHg — Mildly Elevated' },
  ]);

  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [activeVideoCall, setActiveVideoCall] = useState(null);
  const [activeRx, setActiveRx] = useState(null);

  // ── New feature states ──────────────────────────────────────────────────────
  const [activeScribePatient, setActiveScribePatient] = useState(null);   // ConsultationScribeModal
  const [activeCaseSheet, setActiveCaseSheet] = useState(null);            // CaseSheetModal {caseSheet, patient, transcriptLines}
  const [recentCaseSheets, setRecentCaseSheets] = useState([]);            // Firestore live records
  const [activeTab, setActiveTab] = useState('patients');                   // 'patients' | 'records'

  // Firestore appointment listener
  useEffect(() => {
    if (isDemoMode) return;
    try {
      const q = query(collection(db, 'appointments'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
        const dbAppts = snap.docs.map(doc => {
          const d = doc.data();
          return {
            time: d.slotTime || '12:00 PM',
            patient: d.patientName || 'Patient',
            type: `${d.department || 'Cardiology'} · ${d.consultType || 'Video'}`,
            status: 'Upcoming',
            color: 'var(--primary)',
            isVideo: d.consultType?.toLowerCase().includes('video')
          };
        });
        if (dbAppts.length > 0) setAppointments(prev => [...dbAppts, ...prev]);
      });
      return unsub;
    } catch (e) {
      console.warn("Firestore appointments listener notice:", e);
    }
  }, [isDemoMode]);

  // Firestore hospital records listener
  useEffect(() => {
    if (isDemoMode) return;
    try {
      const q = query(
        collection(db, 'hospitalRecords'),
        orderBy('postedAt', 'desc'),
        limit(10)
      );
      const unsub = onSnapshot(q, (snap) => {
        const records = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecentCaseSheets(records);
      });
      return unsub;
    } catch (e) {
      console.warn("Firestore hospitalRecords listener notice:", e);
    }
  }, [isDemoMode]);

  const toggleRecording = () => {
    if (recording) {
      setRecording(false);
      showToast('Recording stopped. AI Medical Scribe summary saved.', 'info');
    } else {
      setRecording(true);
      showToast('AI Medical Scribe listening...', 'success');
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
          setActiveRx({
            patientName: 'Rahul Sharma',
            diagnosis: 'Hypertensive Heart Disease',
            icdCode: 'ICD-10 I11.9',
            medications: [
              { name: 'Atorvastatin', dosage: '20mg', frequency: '0-0-1 (Night)', duration: '30 Days', instructions: 'After dinner' },
              { name: 'Amlodipine', dosage: '5mg', frequency: '1-0-0 (Morning)', duration: '30 Days', instructions: 'After breakfast' }
            ]
          });
        }
      }, 1800);
    }
  };

  const handleVideoGeneratedRx = (parsedScribe) => {
    setActiveRx({
      patientName: activeVideoCall?.patient || 'Rahul Sharma',
      diagnosis: parsedScribe.diagnosis || 'Hypertensive Heart Disease with Tachycardia',
      icdCode: parsedScribe.icdCode || 'ICD-10 I11.9',
      medications: parsedScribe.medications || [
        { name: 'Atorvastatin', dosage: '20mg', frequency: '0-0-1 (Night)', duration: '30 Days', instructions: 'After food' },
        { name: 'Amlodipine', dosage: '5mg', frequency: '1-0-0 (Morning)', duration: '30 Days', instructions: 'After food' }
      ],
      advice: parsedScribe.advice,
      vitals: parsedScribe.vitalStatus
    });
    showToast('Digital Prescription generated from Video AI Scribe!', 'success');
  };

  // ── When case sheet is generated from scribe ──────────────────────────────
  const handleCaseSheetReady = (caseSheet, transcriptLines) => {
    setActiveCaseSheet({
      caseSheet,
      patient: activeScribePatient,
      transcriptLines
    });
    setActiveScribePatient(null);
  };

  const handleCaseSheetPosted = (recordId, caseSheet) => {
    // Add to local list immediately (before Firestore refresh)
    setRecentCaseSheets(prev => [{
      id: recordId,
      ...caseSheet,
      status: 'Posted',
      postedAt: { toDate: () => new Date() }
    }, ...prev.slice(0, 9)]);
  };

  return (
    <div className="page" style={{ background: 'var(--bg)' }}>
      <ToastContainer />

      {/* Video Consultation Modal */}
      {activeVideoCall && (
        <VideoConsultationModal
          patientName={activeVideoCall.patient}
          doctorName="Dr. Arjun Mehta"
          onClose={() => setActiveVideoCall(null)}
          onGenerateRx={handleVideoGeneratedRx}
        />
      )}

      {/* Prescription Modal */}
      {activeRx && (
        <PrescriptionModal
          rx={activeRx}
          onClose={() => setActiveRx(null)}
        />
      )}

      {/* NEW: Consultation Scribe Modal */}
      {activeScribePatient && (
        <ConsultationScribeModal
          patient={activeScribePatient}
          doctorName="Dr. Arjun Mehta"
          onClose={() => setActiveScribePatient(null)}
          onCaseSheetReady={handleCaseSheetReady}
        />
      )}

      {/* NEW: Case Sheet Modal */}
      {activeCaseSheet && (
        <CaseSheetModal
          caseSheet={activeCaseSheet.caseSheet}
          patient={activeCaseSheet.patient}
          doctor={{ name: 'Dr. Arjun Mehta' }}
          transcriptLines={activeCaseSheet.transcriptLines}
          onClose={() => setActiveCaseSheet(null)}
          onPosted={handleCaseSheetPosted}
        />
      )}

      <div className="content-grid">
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: '.84rem', color: 'var(--text2)' }}>Welcome back,</div>
            <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Dr. Arjun Mehta 👨‍⚕️</h1>
            <div style={{ fontSize: '.84rem', color: 'var(--text2)', marginTop: 4 }}>Cardiologist · Apollo Hospital · {appointments.length} Appointments Today</div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-outline" onClick={() => setActiveRx({ patientName: 'Rahul Sharma' })}>
              <i className="fa-solid fa-file-prescription"></i> Create / Print Rx
            </button>
            <button className="btn btn-outline" onClick={toggleRecording}>
              <i className={`fa-solid ${recording ? 'fa-stop pulse' : 'fa-microphone'}`}></i>
              {recording ? 'Stop Quick Scribe' : 'Quick AI Scribe'}
            </button>
            <button className="btn btn-primary" onClick={() => setActiveScribePatient(PATIENTS[0])}>
              <i className="fa-solid fa-stethoscope"></i> Start Consultation
            </button>
          </div>
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

            {/* NEW: Recent Posted Records */}
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: 12 }}>🏥 HMS Records</div>
              {recentCaseSheets.length === 0 ? (
                <div style={{ fontSize: '.78rem', color: 'var(--text2)', textAlign: 'center', padding: '12px 0' }}>
                  No records posted yet.<br />Start a consultation to generate records.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {recentCaseSheets.slice(0, 4).map((rec, i) => (
                    <div key={rec.id || i} style={{ background: 'var(--bg)', padding: '8px 10px', borderRadius: 8, fontSize: '.75rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{rec.patientName || 'Patient'}</div>
                      <div style={{ color: 'var(--text2)', marginTop: 2 }}>{rec.diagnosis || 'Case sheet posted'}</div>
                      <div style={{ color: 'var(--secondary)', fontSize: '.68rem', marginTop: 2 }}>✅ Posted · {rec.id?.slice(0, 10) || 'DEMO'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Area */}
          <div className="dash-main">
            {/* AI Medical Scribe Quick Panel */}
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

            {/* Patients Table with tabs */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '0 0 0 0', borderBottom: '1px solid var(--borderl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 16 }}>
                <div style={{ display: 'flex' }}>
                  {[
                    { id: 'patients', label: '👥 Active Patients' },
                    { id: 'records', label: '📋 Case Sheet Records' },
                  ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: activeTab === tab.id ? '#fff' : 'transparent', border: 'none', borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === tab.id ? 'var(--primary)' : 'var(--text2)', fontWeight: 600, fontSize: '.84rem', padding: '12px 18px', cursor: 'pointer', transition: 'all 0.2s' }}>
                      {tab.label}
                    </button>
                  ))}
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => showToast('Patient MT006 added to workspace.', 'info')}>+ Add Patient</button>
              </div>

              {/* Patients tab */}
              {activeTab === 'patients' && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Condition</th>
                      <th>Recovery Score</th>
                      <th>Adherence</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PATIENTS.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="avatar avatar-sm" style={{ background: p.bg }}>{p.name.split(' ').map(n => n[0]).join('')}</div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{p.name}</div>
                              <div style={{ fontSize: '.68rem', color: 'var(--text2)' }}>#{p.id} · {p.age} · {p.gender}</div>
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
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {/* NEW: Start Consultation */}
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => setActiveScribePatient(p)}
                              title="Start AI-assisted voice consultation"
                            >
                              <i className="fa-solid fa-stethoscope"></i> Consult
                            </button>
                            <button className="btn btn-sm btn-outline" onClick={() => setActiveVideoCall({ patient: p.name })}>
                              <i className="fa-solid fa-video"></i> Video
                            </button>
                            <button className="btn btn-sm btn-outline" onClick={() => setActiveRx({ patientName: p.name, patientId: p.id, patientAge: p.age, patientGender: p.gender })}>
                              <i className="fa-solid fa-file-prescription"></i> Rx
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Case Sheet Records tab */}
              {activeTab === 'records' && (
                <div style={{ padding: '16px' }}>
                  {recentCaseSheets.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text2)' }}>
                      <div style={{ fontSize: '2rem', marginBottom: 12 }}>📋</div>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>No case sheets yet</div>
                      <div style={{ fontSize: '.82rem' }}>Click <strong>Consult</strong> on a patient to begin a consultation and generate the first case sheet.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {recentCaseSheets.map((rec, i) => (
                        <div key={rec.id || i} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span className="badge badge-green">✅ Posted</span>
                              <span style={{ fontWeight: 700, fontSize: '.9rem' }}>{rec.patientName || 'Patient'}</span>
                            </div>
                            <div style={{ fontSize: '.82rem', color: 'var(--text2)', marginBottom: 4 }}>{rec.diagnosis || 'Case sheet posted to HMS'}</div>
                            <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>
                              Record #{(rec.id || 'DEMO').slice(0, 14)} · Dr. {rec.doctorName || 'Arjun Mehta'} · {rec.hospitalName || 'MediTrust AI Health Institute'}
                            </div>
                          </div>
                          <button className="btn btn-sm btn-outline" onClick={() => setActiveCaseSheet({ caseSheet: rec, patient: { name: rec.patientName, id: rec.patientId, age: rec.patientAge, gender: rec.patientGender }, transcriptLines: [] })}>
                            <i className="fa-solid fa-eye"></i> View
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Appointments Timeline */}
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 14 }}>📅 Today's Consultation Schedule</div>
              <div className="timeline">
                {appointments.map((a, i) => (
                  <div key={i} className="timeline-item">
                    <span className="t-time">{a.time}</span>
                    <div className="t-dot" style={{ background: a.color }}></div>
                    <div className="t-content">
                      <div className="t-patient">{a.patient}</div>
                      <div className="t-type">{a.type}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="badge badge-blue" style={{ background: 'transparent', borderColor: a.color, color: a.color }}>{a.status}</span>
                      <button className="btn btn-sm btn-primary" onClick={() => setActiveVideoCall({ patient: a.patient })}>
                        <i className="fa-solid fa-video"></i> Join
                      </button>
                    </div>
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
