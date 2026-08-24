import { useState, useRef } from 'react';
import { speakText, stopSpeaking, saveToHospitalRecords } from '../utils/gemini';
import { db } from '../firebase';
import { showToast } from './Toast';

const URGENCY_COLOR = { Low: '#10b981', Moderate: '#f59e0b', High: '#ef4444', Emergency: '#dc2626' };
const URGENCY_BG = { Low: '#f0fdf4', Moderate: '#fffbeb', High: '#fef2f2', Emergency: '#fee2e2' };

export default function CaseSheetModal({ caseSheet, patient = {}, doctor = {}, transcriptLines = [], onClose, onPosted }) {
  const printRef = useRef(null);
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [recordId, setRecordId] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [activeTab, setActiveTab] = useState('sheet');

  if (!caseSheet) return null;

  const cs = caseSheet;
  const urgencyColor = URGENCY_COLOR[cs.urgency] || '#f59e0b';
  const urgencyBg = URGENCY_BG[cs.urgency] || '#fffbeb';
  const patientName = patient.name || cs.patientName || 'Patient';
  const doctorName = doctor.name || 'Dr. Arjun Mehta';

  const handlePrint = () => window.print();

  const handleSpeak = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    const summary = [
      `Case Sheet Summary for ${patientName}.`,
      `Chief Complaint: ${cs.chiefComplaint}.`,
      `Diagnosis: ${cs.diagnosis}, ${cs.icdCode}.`,
      `Medications: ${cs.medications?.map(m => `${m.name} ${m.dosage} ${m.frequency} for ${m.duration}`).join('. ')}.`,
      `Doctor's Advice: ${cs.advice}.`,
      `Follow-up Plan: ${cs.followUpPlan}.`,
    ].join(' ');
    speakText(summary, cs.language || 'en-IN');
    setTimeout(() => setSpeaking(false), summary.length * 55);
  };

  const handlePostToHospital = async () => {
    setPosting(true);
    try {
      const result = await saveToHospitalRecords(db, {
        ...cs,
        patientName,
        patientId: patient.id || 'MT001',
        patientAge: patient.age || 42,
        patientGender: patient.gender || 'Male',
        doctorName,
      }, {
        doctorId: doctor.id || 'dr-arjun-mehta',
        doctorName,
        patientId: patient.id || 'MT001',
        hospitalId: 'apollo-medtrust-001',
      });
      setRecordId(result.recordId);
      setPosted(true);
      showToast('✅ Case sheet posted to Hospital Management System!', 'success');
      if (onPosted) onPosted(result.recordId, cs);
    } catch (e) {
      showToast('Record posting failed. Please try again.', 'error');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 880, width: '96vw', padding: 0, overflow: 'hidden', borderRadius: 18 }}
      >
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #1a73e8 0%, #0f4c8a 100%)', color: '#fff', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>📋</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>AI Generated Case Sheet</div>
              <div style={{ fontSize: '.78rem', opacity: 0.8 }}>{cs.sessionId} · {cs.date} · MediTrust AI Health Institute</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ background: urgencyColor, color: '#fff', fontSize: '.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: 20, letterSpacing: '.3px' }}>
              {cs.urgency?.toUpperCase()} PRIORITY
            </span>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: '#f8f9fa', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: 0 }}>
          {[
            { id: 'sheet', label: '📋 Case Sheet', },
            { id: 'transcript', label: '🎙️ Consultation Transcript', disabled: transcriptLines.length === 0 },
          ].map(tab => (
            <button key={tab.id} onClick={() => !tab.disabled && setActiveTab(tab.id)} style={{ background: activeTab === tab.id ? '#fff' : 'transparent', border: 'none', borderBottom: activeTab === tab.id ? '2px solid #1a73e8' : '2px solid transparent', color: tab.disabled ? '#d1d5db' : activeTab === tab.id ? '#1a73e8' : '#6b7280', fontWeight: 600, fontSize: '.84rem', padding: '12px 20px', cursor: tab.disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Case Sheet Tab */}
        {activeTab === 'sheet' && (
          <div ref={printRef} className="printable-rx" style={{ overflowY: 'auto', maxHeight: '65vh', background: '#fff' }}>
            <div style={{ padding: '28px 32px', fontFamily: "'Inter', sans-serif", color: '#1f2937' }}>

              {/* Hospital Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #1a73e8', paddingBottom: 18, marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ background: '#1a73e8', color: '#fff', width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800 }}>🏥</div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#1a73e8', letterSpacing: '-0.5px' }}>MediTrust AI Health Institute</h2>
                    <div style={{ fontSize: '.72rem', color: '#6b7280' }}>Agentic Clinical Intelligence System · AI Case Sheet · ISO 27001</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '.82rem' }}>
                  <div style={{ fontWeight: 700, color: '#111827' }}>{doctorName}</div>
                  <div style={{ color: '#4b5563', fontSize: '.75rem' }}>MD, DM (Cardiology) · Senior Consultant</div>
                  <div style={{ color: '#6b7280', fontSize: '.72rem' }}>Reg No: MCI-2012-84921</div>
                  <div style={{ color: '#1a73e8', fontWeight: 600, fontSize: '.72rem', marginTop: 2 }}>{cs.date}</div>
                </div>
              </div>

              {/* Patient Strip */}
              <div style={{ background: '#f3f4f6', borderRadius: 10, padding: '14px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, fontSize: '.82rem', marginBottom: 20 }}>
                {[
                  ['PATIENT NAME', patientName],
                  ['AGE / GENDER', `${patient.age || 42} Yrs / ${patient.gender || 'Male'}`],
                  ['PATIENT ID', `#${patient.id || 'MT001'}`],
                  ['SESSION ID', cs.sessionId],
                  ['LANGUAGE', cs.language?.split('-')[0]?.toUpperCase() || 'EN'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <span style={{ color: '#6b7280', fontSize: '.68rem', display: 'block', fontWeight: 600 }}>{label}</span>
                    <strong style={{ fontSize: '.85rem' }}>{val}</strong>
                  </div>
                ))}
              </div>

              {/* Urgency banner */}
              <div style={{ background: urgencyBg, border: `1px solid ${urgencyColor}30`, borderLeft: `4px solid ${urgencyColor}`, padding: '10px 16px', borderRadius: '0 8px 8px 0', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '.82rem', fontWeight: 600, color: urgencyColor }}>
                  ⚡ Clinical Urgency: {cs.urgency}
                </div>
                {posted && (
                  <div style={{ fontSize: '.72rem', color: '#10b981', fontWeight: 600 }}>
                    ✅ Posted to HMS · Record ID: {recordId}
                  </div>
                )}
              </div>

              {/* Vitals */}
              {cs.vitals && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#6b7280', letterSpacing: '.5px', marginBottom: 8 }}>RECORDED VITALS</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10 }}>
                    {[
                      { label: 'Blood Pressure', val: cs.vitals.bp, icon: '🩺' },
                      { label: 'Heart Rate', val: cs.vitals.hr, icon: '❤️' },
                      { label: 'Temperature', val: cs.vitals.temp, icon: '🌡️' },
                      { label: 'SpO2', val: cs.vitals.spo2, icon: '💨' },
                      { label: 'Weight', val: cs.vitals.weight, icon: '⚖️' },
                    ].map(v => (
                      <div key={v.label} style={{ background: '#eff6ff', borderRadius: 8, padding: '10px 12px', textAlign: 'center', border: '1px solid #bfdbfe' }}>
                        <div style={{ fontSize: '1.1rem', marginBottom: 4 }}>{v.icon}</div>
                        <div style={{ fontWeight: 700, fontSize: '.85rem', color: '#1e40af' }}>{v.val || '—'}</div>
                        <div style={{ fontSize: '.65rem', color: '#6b7280', marginTop: 2 }}>{v.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SOAP Sections */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                {[
                  { label: '🅢 Subjective — Chief Complaint', val: cs.chiefComplaint, color: '#7c3aed', bg: '#f5f3ff' },
                  { label: '🅞 Objective — Clinical Findings', val: cs.clinicalFindings, color: '#0369a1', bg: '#f0f9ff' },
                ].map(section => (
                  <div key={section.label} style={{ background: section.bg, borderRadius: 10, padding: '14px 16px', border: `1px solid ${section.color}20` }}>
                    <div style={{ fontSize: '.72rem', fontWeight: 700, color: section.color, marginBottom: 6 }}>{section.label}</div>
                    <div style={{ fontSize: '.83rem', color: '#374151', lineHeight: 1.6 }}>{section.val || '—'}</div>
                  </div>
                ))}
              </div>

              {/* History */}
              {cs.historyOfPresentIllness && (
                <div style={{ background: '#fafafa', borderRadius: 10, padding: '14px 16px', marginBottom: 16, border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#374151', letterSpacing: '.5px', marginBottom: 6 }}>📝 HISTORY OF PRESENT ILLNESS</div>
                  <div style={{ fontSize: '.83rem', color: '#4b5563', lineHeight: 1.6 }}>{cs.historyOfPresentIllness}</div>
                </div>
              )}

              {/* Diagnosis */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#6b7280', letterSpacing: '.5px', marginBottom: 6 }}>🅐 Assessment — DIAGNOSIS & CLINICAL IMPRESSION</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>{cs.diagnosis}</span>
                  <span style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '.72rem', padding: '3px 10px', borderRadius: 6, fontWeight: 600 }}>{cs.icdCode}</span>
                </div>
                {cs.differentialDiagnosis?.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: '.78rem', color: '#6b7280' }}>
                    <span style={{ fontWeight: 600 }}>Differentials: </span>
                    {cs.differentialDiagnosis.join(' · ')}
                  </div>
                )}
              </div>

              {/* Medications */}
              {cs.medications?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1a73e8', fontFamily: 'serif' }}>Rx</span>
                    <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#6b7280', letterSpacing: '.5px' }}>🅟 PLAN — PRESCRIBED MEDICATIONS</div>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', textAlign: 'left', color: '#4b5563', fontSize: '.72rem' }}>
                        {['MEDICINE & DOSAGE', 'FREQUENCY', 'DURATION', 'INSTRUCTIONS'].map(h => (
                          <th key={h} style={{ padding: '9px 12px', borderBottom: '2px solid #e5e7eb' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cs.medications.map((m, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '11px 12px', fontWeight: 700, color: '#111827' }}>{m.name} <span style={{ fontWeight: 400, color: '#6b7280', fontSize: '.75rem' }}>({m.dosage})</span></td>
                          <td style={{ padding: '11px 12px', color: '#374151' }}>{m.frequency}</td>
                          <td style={{ padding: '11px 12px', color: '#374151' }}>{m.duration}</td>
                          <td style={{ padding: '11px 12px', color: '#059669', fontWeight: 500 }}>{m.instructions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Investigations */}
              {cs.investigations?.length > 0 && (
                <div style={{ marginBottom: 20, background: '#fefce8', border: '1px solid #fef08a', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#854d0e', letterSpacing: '.5px', marginBottom: 8 }}>🔬 INVESTIGATIONS ORDERED</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {cs.investigations.map((inv, i) => (
                      <span key={i} style={{ background: '#fff', border: '1px solid #fde68a', borderRadius: 20, padding: '4px 12px', fontSize: '.78rem', color: '#92400e', fontWeight: 500 }}>🧪 {inv}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Advice + Follow-up */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div style={{ background: '#fffbe8', padding: 14, borderRadius: 10, border: '1px solid #fef08a' }}>
                  <div style={{ fontWeight: 700, color: '#854d0e', marginBottom: 6, fontSize: '.78rem' }}>💡 Doctor's Lifestyle Advice</div>
                  <div style={{ color: '#713f12', lineHeight: 1.6, fontSize: '.82rem' }}>{cs.advice}</div>
                </div>
                <div style={{ background: '#f0fdf4', padding: 14, borderRadius: 10, border: '1px solid #bbf7d0' }}>
                  <div style={{ fontWeight: 700, color: '#166534', marginBottom: 6, fontSize: '.78rem' }}>📅 Follow-up Plan</div>
                  <div style={{ color: '#14532d', lineHeight: 1.6, fontSize: '.82rem' }}>{cs.followUpPlan}</div>
                </div>
              </div>

              {/* Referrals */}
              {cs.referrals?.length > 0 && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 16px', marginBottom: 18, fontSize: '.82rem' }}>
                  <span style={{ fontWeight: 700, color: '#1e40af' }}>🔗 Referrals: </span>
                  <span style={{ color: '#1e3a8a' }}>{cs.referrals.join(', ')}</span>
                </div>
              )}

              {/* Doctor notes */}
              {cs.doctorNotes && (
                <div style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: '.82rem' }}>
                  <span style={{ fontWeight: 700, color: '#374151' }}>📝 Doctor's Notes: </span>
                  <span style={{ color: '#4b5563' }}>{cs.doctorNotes}</span>
                </div>
              )}

              {/* Footer */}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 50, height: 50, background: '#111827', color: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.55rem', textAlign: 'center', padding: 4, fontFamily: 'monospace' }}>
                    [QR<br/>VERIFIED]
                  </div>
                  <div style={{ fontSize: '.68rem', color: '#9ca3af', lineHeight: 1.6 }}>
                    AI-Generated & Digitally Signed via MediTrust Blockchain.<br />
                    Hash: <span style={{ fontFamily: 'monospace' }}>{cs.verificationHash || '0x8a92f...4e19'}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "'Brush Script MT', cursive", fontSize: '1.5rem', color: '#1a73e8' }}>{doctorName.replace('Dr. ', '')}</div>
                  <div style={{ fontSize: '.68rem', color: '#6b7280', borderTop: '1px dashed #d1d5db', paddingTop: 4 }}>Doctor Digital Signature</div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Transcript Tab */}
        {activeTab === 'transcript' && (
          <div style={{ overflowY: 'auto', maxHeight: '65vh', padding: '20px 24px', background: '#0d1117' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {transcriptLines.map((line, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: line.speaker === 'Doctor' ? 'rgba(26,115,232,0.2)' : 'rgba(16,185,129,0.15)', border: `1px solid ${line.speaker === 'Doctor' ? 'rgba(26,115,232,0.3)' : 'rgba(16,185,129,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem', flexShrink: 0 }}>
                    {line.speaker === 'Doctor' ? '👨‍⚕️' : '👤'}
                  </div>
                  <div style={{ flex: 1, background: line.speaker === 'Doctor' ? 'rgba(26,115,232,0.08)' : 'rgba(16,185,129,0.06)', border: `1px solid ${line.speaker === 'Doctor' ? 'rgba(26,115,232,0.12)' : 'rgba(16,185,129,0.1)'}`, borderRadius: '4px 12px 12px 12px', padding: '10px 14px' }}>
                    <div style={{ fontSize: '.7rem', fontWeight: 700, color: line.speaker === 'Doctor' ? '#38bdf8' : '#34d399', marginBottom: 4 }}>
                      {line.speaker} {line.time ? `· ${line.time}` : ''}
                    </div>
                    <div style={{ fontSize: '.83rem', color: '#e2e8f0', lineHeight: 1.5 }}>{line.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action bar */}
        <div className="no-print" style={{ background: '#f9fafb', borderTop: '1px solid #e5e7eb', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: '.8rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="fa-solid fa-brain" style={{ color: '#1a73e8' }}></i>
            AI-generated clinical case sheet · Requires physician review
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={handleSpeak} style={{ background: speaking ? '#7c3aed' : 'transparent', border: '1px solid #7c3aed', color: speaking ? '#fff' : '#7c3aed', borderRadius: 8, padding: '8px 14px', fontSize: '.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className={`fa-solid ${speaking ? 'fa-stop' : 'fa-volume-high'}`}></i>
              {speaking ? 'Stop' : 'Read Aloud'}
            </button>
            <button onClick={handlePrint} className="btn btn-outline" style={{ fontSize: '.82rem' }}>
              <i className="fa-solid fa-print"></i> Print PDF
            </button>
            {!posted ? (
              <button onClick={handlePostToHospital} disabled={posting} style={{ background: posting ? '#d1d5db' : 'linear-gradient(135deg,#10b981,#059669)', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 18px', fontSize: '.82rem', fontWeight: 700, cursor: posting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                {posting ? <><i className="fa-solid fa-spinner fa-spin"></i> Posting...</> : <><i className="fa-solid fa-hospital"></i> Post to Hospital HMS</>}
              </button>
            ) : (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 16px', fontSize: '.82rem', color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="fa-solid fa-circle-check"></i> Posted · #{recordId?.slice(0, 12)}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
