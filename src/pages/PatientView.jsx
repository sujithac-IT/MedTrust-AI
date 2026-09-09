// MediTrust AI — Patient View
// Displays patient's consultation history, approved case sheets, medications, and voice summaries.

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { ToastContainer, showToast } from '../components/Toast';
import CaseSheetEditor from '../components/CaseSheetEditor';
import {
  SUPPORTED_LANGUAGES, translateSummary, generateSummary,
  speakText, stopSpeaking,
} from '../utils/gemini';
import { getAllConsultationHistory } from '../services/patientService';
import { generateCaseSheetSummary } from '../services/geminiService';

export default function PatientView() {
  const { userProfile } = useAuth();
  const profile = userProfile || {};

  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(profile.preferredLanguage || 'English');
  const [isPlaying, setIsPlaying] = useState(false);

  // Load records from local history + Firestore
  useEffect(() => {
    // Local consultation history
    const localRecords = getAllConsultationHistory();
    if (localRecords.length > 0) {
      setRecords(localRecords);
    }

    // Also try Firestore
    try {
      const q = query(collection(db, 'consultationHistory'), orderBy('savedAt', 'desc'), limit(20));
      const unsub = onSnapshot(q, (snap) => {
        const fireRecords = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (fireRecords.length > 0) {
          // Merge without duplicates
          const merged = [...fireRecords];
          for (const lr of localRecords) {
            if (!merged.find(r => r.id === lr.id)) merged.push(lr);
          }
          setRecords(merged);
        }
      });
      return unsub;
    } catch (e) {
      console.warn('Firestore records listener:', e);
    }
  }, []);

  // Refresh local records periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const localRecords = getAllConsultationHistory();
      if (localRecords.length > records.length) {
        setRecords(localRecords);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [records.length]);

  // Voice playback
  const handlePlay = (text) => {
    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      const utt = speakText(text, selectedLanguage);
      if (utt) utt.onend = () => setIsPlaying(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 960, margin: '0 auto', padding: '24px' }}>
      <ToastContainer />

      <div className="page-header">
        <h1 className="page-title" style={{ color: 'var(--text)' }}>My Medical Records</h1>
        <p className="page-subtitle">View your consultation history and approved case sheets</p>
      </div>

      {/* Back Button when viewing record */}
      {selectedRecord && (
        <button className="btn btn-ghost" onClick={() => setSelectedRecord(null)} style={{ marginBottom: 16, color: 'var(--text2)' }}>
          <i className="fa-solid fa-arrow-left" /> Back to Records
        </button>
      )}

      {/* ── Record Detail View ── */}
      {selectedRecord ? (
        <div className="fade-in">
          {/* Record Header */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <span className="badge badge-green" style={{ marginBottom: 8, display: 'inline-flex' }}>
                  <i className="fa-solid fa-check" /> Doctor Approved
                </span>
                <h2 style={{ fontSize: '1.2rem', margin: '8px 0 4px', color: 'var(--text)' }}>
                  {selectedRecord.caseSheet?.assessment || 'Consultation Record'}
                </h2>
                <div style={{ fontSize: '.85rem', color: 'var(--text2)' }}>
                  {selectedRecord.doctorName || 'Doctor'} · {selectedRecord.doctorSpecialty || 'General Medicine'} · {
                    selectedRecord.approvedAt ? new Date(selectedRecord.approvedAt).toLocaleDateString('en-IN', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    }) : ''
                  }
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '.78rem', color: 'var(--text3)' }}>
                <div>Consultation #{selectedRecord.id?.slice(0, 12) || 'N/A'}</div>
                <div>{selectedRecord.hospital || 'MediTrust AI Health Institute'}</div>
              </div>
            </div>
          </div>

          {/* Full Case Sheet Viewer (read-only) */}
          {selectedRecord.caseSheet ? (
            <CaseSheetEditor
              caseSheet={selectedRecord.caseSheet}
              consultation={selectedRecord}
              patient={{ name: selectedRecord.patientName, id: selectedRecord.patientId }}
              doctor={{
                name: selectedRecord.doctorName,
                specialty: selectedRecord.doctorSpecialty,
                hospital: selectedRecord.hospital,
              }}
              isApproved={true}
            />
          ) : (
            /* Legacy record without 17-section case sheet */
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-title" style={{ marginBottom: 20 }}>
                <i className="fa-solid fa-file-medical" style={{ color: 'var(--primary)', marginRight: 8 }} />
                Clinical Summary
              </div>

              {[
                ['Chief Complaint', selectedRecord.chiefComplaint],
                ['Diagnosis', `${selectedRecord.diagnosis || ''} ${selectedRecord.icdCode ? `(${selectedRecord.icdCode})` : ''}`],
                ['Doctor\'s Advice', selectedRecord.doctorAdvice?.join(' · ') || selectedRecord.doctorAdvice],
                ['Follow-up', selectedRecord.followUp],
              ].map(([label, value]) => value && (
                <div key={label} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: '.9rem', color: 'var(--text)', lineHeight: 1.6 }}>{value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Medications (for legacy records) */}
          {!selectedRecord.caseSheet && selectedRecord.medications && selectedRecord.medications.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-title" style={{ marginBottom: 16 }}>
                <i className="fa-solid fa-pills" style={{ color: 'var(--secondary)', marginRight: 8 }} />
                Prescribed Medications
              </div>
              <table className="med-table">
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Dosage</th>
                    <th>Frequency</th>
                    <th>Duration</th>
                    <th>Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRecord.medications.map((m, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{m.medicine}</td>
                      <td>{m.dosage}</td>
                      <td>{m.frequency}</td>
                      <td>{m.duration}</td>
                      <td>{m.instructions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ── Records List ── */
        <div className="fade-in">
          {records.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <i className="fa-solid fa-file-medical" style={{ fontSize: '3rem', color: 'var(--text3)', marginBottom: 16, opacity: 0.3 }} />
              <h3 style={{ fontSize: '1.1rem', marginBottom: 8, color: 'var(--text)' }}>No Records Yet</h3>
              <p style={{ color: 'var(--text2)', fontSize: '.9rem' }}>
                Your consultation records will appear here after your doctor approves a case sheet.
              </p>
            </div>
          ) : (
            <div className="card">
              <div className="card-title" style={{ marginBottom: 16 }}>
                <i className="fa-solid fa-folder-open" style={{ color: 'var(--primary)', marginRight: 8 }} />
                Consultation History ({records.length} record{records.length !== 1 ? 's' : ''})
              </div>

              {records.map((rec, i) => (
                <div key={i} className="history-item" onClick={() => setSelectedRecord(rec)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                        {rec.caseSheet?.assessment || rec.diagnosis || 'Consultation'}
                      </div>
                      <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>
                        {rec.doctorName || 'Doctor'} · {
                          rec.approvedAt ? new Date(rec.approvedAt).toLocaleDateString('en-IN', {
                            year: 'numeric', month: 'short', day: 'numeric',
                          }) : rec.savedAt ? new Date(rec.savedAt).toLocaleDateString('en-IN', {
                            year: 'numeric', month: 'short', day: 'numeric',
                          }) : ''
                        }
                      </div>
                      {/* Chief complaints preview */}
                      {rec.caseSheet?.chief_complaint && (
                        <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginTop: 4 }}>
                          {rec.caseSheet.chief_complaint.filter(c => c !== 'Not mentioned in consultation').join(', ')}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="badge badge-green">
                        <i className="fa-solid fa-check" /> Approved
                      </span>
                      <i className="fa-solid fa-chevron-right" style={{ color: 'var(--text3)', fontSize: '.72rem' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
