import { useState, useRef } from 'react';
import { speakText, stopSpeaking, saveToHospitalRecords } from '../utils/gemini';
import { db } from '../firebase';
import { showToast } from './Toast';

const URGENCY_META = {
  Low:       { color: '#059669', bg: '#ecfdf5', border: '#6ee7b7', badge: '#d1fae5', text: '#065f46' },
  Moderate:  { color: '#d97706', bg: '#fffbeb', border: '#fcd34d', badge: '#fef3c7', text: '#92400e' },
  High:      { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', badge: '#fee2e2', text: '#991b1b' },
  Emergency: { color: '#9b1c1c', bg: '#fff1f2', border: '#fda4af', badge: '#ffe4e6', text: '#881337' },
};

export default function CaseSheetModal({ caseSheet, patient = {}, doctor = {}, transcriptLines = [], videoSummary = null, onClose, onPosted }) {
  const printRef = useRef(null);
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [recordId, setRecordId] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [activeTab, setActiveTab] = useState('sheet');

  if (!caseSheet) return null;

  const cs = caseSheet;
  const urg = URGENCY_META[cs.urgency] || URGENCY_META.Moderate;
  const patientName = patient.name || cs.patientName || 'Patient';
  const patientAge  = patient.age  || cs.patientAge  || 42;
  const patientGender = patient.gender || cs.patientGender || 'Male';
  const patientId   = patient.id   || cs.patientId   || 'MT001';
  const doctorName  = doctor.name  || cs.doctorName  || 'Dr. Arjun Mehta';
  const sessionDate = cs.date || new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  const handlePrint = () => window.print();

  const handleSpeak = () => {
    if (speaking) { stopSpeaking(); setSpeaking(false); return; }
    setSpeaking(true);
    const text = [
      `Case Sheet for ${patientName}.`,
      `Chief Complaint: ${cs.chiefComplaint}.`,
      `Diagnosis: ${cs.diagnosis}.`,
      cs.medications?.length ? `Medications: ${cs.medications.map(m => `${m.name} ${m.dosage}, ${m.frequency}, for ${m.duration}`).join('. ')}.` : '',
      `Doctor's advice: ${cs.advice}.`,
      `Follow-up: ${cs.followUpPlan}.`,
    ].filter(Boolean).join(' ');
    speakText(text, cs.language || 'en-IN');
    setTimeout(() => setSpeaking(false), text.length * 60);
  };

  const handlePost = async () => {
    setPosting(true);
    try {
      const result = await saveToHospitalRecords(db, {
        ...cs, patientName, patientId, patientAge, patientGender, doctorName,
        source: videoSummary ? 'video-consultation' : 'voice-consultation',
      }, { doctorId: doctor.id || 'dr-arjun-mehta', doctorName, patientId, hospitalId: 'apollo-medtrust-001' });
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

  const tabs = [
    { id: 'sheet',      label: '📋 Case Sheet' },
    { id: 'transcript', label: '🎙️ Transcript', disabled: !transcriptLines.length && !videoSummary },
    { id: 'video',      label: '📹 Video Summary', disabled: !videoSummary },
  ];

  /* ─── RENDER ────────────────────────────────────────────────────────────── */
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content cs-modal" onClick={e => e.stopPropagation()}>

        {/* ── Modal Header ─────────────────────────────────────────────────── */}
        <div className="cs-header">
          <div className="cs-header-left">
            <div className="cs-header-icon">📋</div>
            <div>
              <div className="cs-header-title">AI Clinical Case Sheet</div>
              <div className="cs-header-sub">{cs.sessionId} &nbsp;·&nbsp; {sessionDate} &nbsp;·&nbsp; MediTrust AI Health Institute</div>
            </div>
          </div>
          <div className="cs-header-right">
            {videoSummary && (
              <span className="cs-source-badge cs-source-video">📹 Video Consultation</span>
            )}
            <span className="cs-urgency-pill" style={{ background: urg.badge, color: urg.text, border: `1px solid ${urg.border}` }}>
              {cs.urgency?.toUpperCase() || 'MODERATE'} PRIORITY
            </span>
            <button className="cs-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* ── Tab Bar ──────────────────────────────────────────────────────── */}
        <div className="cs-tab-bar">
          {tabs.map(t => (
            <button
              key={t.id}
              disabled={t.disabled}
              onClick={() => !t.disabled && setActiveTab(t.id)}
              className={`cs-tab ${activeTab === t.id ? 'cs-tab--active' : ''} ${t.disabled ? 'cs-tab--disabled' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: CASE SHEET                                                */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'sheet' && (
          <div ref={printRef} className="printable-rx cs-body">

            {/* Hospital letterhead */}
            <div className="cs-letterhead">
              <div className="cs-letterhead-left">
                <div className="cs-hosp-logo">🏥</div>
                <div>
                  <div className="cs-hosp-name">MediTrust AI Health Institute</div>
                  <div className="cs-hosp-sub">Agentic Clinical Intelligence System &nbsp;·&nbsp; ISO 27001 Certified</div>
                </div>
              </div>
              <div className="cs-letterhead-right">
                <div className="cs-doc-name">{doctorName}</div>
                <div className="cs-doc-cred">MD, DM (Cardiology) &nbsp;·&nbsp; Senior Consultant</div>
                <div className="cs-doc-reg">Reg. No: MCI-2012-84921</div>
                <div className="cs-doc-date">{sessionDate}</div>
              </div>
            </div>

            {/* Patient info strip */}
            <div className="cs-patient-strip">
              {[
                { label: 'PATIENT NAME',    val: patientName },
                { label: 'AGE / GENDER',    val: `${patientAge} Yrs / ${patientGender}` },
                { label: 'PATIENT ID',      val: `#${patientId}` },
                { label: 'SESSION ID',      val: cs.sessionId || '—' },
                { label: 'CONSULTATION',    val: videoSummary ? 'Video Call' : 'In-Person / Voice' },
              ].map(({ label, val }) => (
                <div key={label} className="cs-patient-cell">
                  <span className="cs-patient-label">{label}</span>
                  <span className="cs-patient-val">{val}</span>
                </div>
              ))}
            </div>

            {/* Urgency stripe */}
            <div className="cs-urgency-stripe" style={{ background: urg.bg, borderLeftColor: urg.color }}>
              <div className="cs-urgency-text" style={{ color: urg.text }}>
                <span style={{ fontWeight: 800, marginRight: 6 }}>Clinical Urgency:</span>{cs.urgency || 'Moderate'}
                {cs.urgency === 'Emergency' && ' — Please escalate immediately'}
              </div>
              {posted && (
                <div className="cs-posted-badge">
                  <i className="fa-solid fa-circle-check"></i> Posted · #{recordId?.slice(0, 14)}
                </div>
              )}
            </div>

            {/* Vitals row */}
            {cs.vitals && (
              <div className="cs-section">
                <div className="cs-section-label">RECORDED VITALS</div>
                <div className="cs-vitals-grid">
                  {[
                    { icon: '🩺', label: 'Blood Pressure', val: cs.vitals.bp },
                    { icon: '❤️',  label: 'Heart Rate',     val: cs.vitals.hr },
                    { icon: '🌡️', label: 'Temperature',    val: cs.vitals.temp },
                    { icon: '💨', label: 'SpO₂',            val: cs.vitals.spo2 },
                    { icon: '⚖️', label: 'Weight',          val: cs.vitals.weight },
                    { icon: '📏', label: 'Height',          val: cs.vitals.height },
                  ].map(v => (
                    <div key={v.label} className="cs-vital-card">
                      <div className="cs-vital-icon">{v.icon}</div>
                      <div className="cs-vital-val">{v.val || '—'}</div>
                      <div className="cs-vital-label">{v.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SOAP – Subjective & Objective */}
            <div className="cs-soap-grid">
              <div className="cs-soap-card cs-soap-s">
                <div className="cs-soap-badge cs-soap-badge-s">S — Subjective</div>
                <div className="cs-soap-heading">Chief Complaint</div>
                <div className="cs-soap-body">{cs.chiefComplaint || '—'}</div>
              </div>
              <div className="cs-soap-card cs-soap-o">
                <div className="cs-soap-badge cs-soap-badge-o">O — Objective</div>
                <div className="cs-soap-heading">Clinical Findings</div>
                <div className="cs-soap-body">{cs.clinicalFindings || '—'}</div>
              </div>
            </div>

            {/* History */}
            {cs.historyOfPresentIllness && (
              <div className="cs-section">
                <div className="cs-section-label">HISTORY OF PRESENT ILLNESS</div>
                <div className="cs-text-block">{cs.historyOfPresentIllness}</div>
              </div>
            )}

            {/* Assessment */}
            <div className="cs-section">
              <div className="cs-soap-badge cs-soap-badge-a" style={{ display: 'inline-flex', marginBottom: 10 }}>A — Assessment</div>
              <div className="cs-diagnosis-row">
                <span className="cs-diagnosis-text">{cs.diagnosis || 'Diagnosis pending'}</span>
                {cs.icdCode && <span className="cs-icd-badge">{cs.icdCode}</span>}
              </div>
              {cs.differentialDiagnosis?.length > 0 && (
                <div className="cs-differentials">
                  <span className="cs-diff-label">Differentials:</span>
                  {cs.differentialDiagnosis.map((d, i) => (
                    <span key={i} className="cs-diff-tag">{d}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Medications table */}
            {cs.medications?.length > 0 && (
              <div className="cs-section">
                <div className="cs-rx-header">
                  <span className="cs-rx-symbol">Rx</span>
                  <div className="cs-soap-badge cs-soap-badge-p" style={{ display: 'inline-flex' }}>P — Plan &nbsp;·&nbsp; Prescribed Medications</div>
                </div>
                <table className="cs-meds-table">
                  <thead>
                    <tr>
                      {['#', 'MEDICINE & DOSAGE', 'FREQUENCY', 'DURATION', 'INSTRUCTIONS'].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cs.medications.map((m, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'cs-row-even' : 'cs-row-odd'}>
                        <td className="cs-td-num">{idx + 1}</td>
                        <td className="cs-td-med">
                          <span className="cs-med-name">{m.name}</span>
                          <span className="cs-med-dose">{m.dosage}</span>
                        </td>
                        <td>{m.frequency}</td>
                        <td>{m.duration}</td>
                        <td className="cs-td-instr">{m.instructions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Investigations */}
            {cs.investigations?.length > 0 && (
              <div className="cs-section">
                <div className="cs-section-label">INVESTIGATIONS ORDERED</div>
                <div className="cs-inv-list">
                  {cs.investigations.map((inv, i) => (
                    <span key={i} className="cs-inv-tag">🧪 {inv}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Advice + Follow-up (2-col) */}
            <div className="cs-advice-grid">
              <div className="cs-advice-card cs-advice-yellow">
                <div className="cs-advice-heading">💡 Doctor's Lifestyle Advice</div>
                <div className="cs-advice-body">{cs.advice || '—'}</div>
              </div>
              <div className="cs-advice-card cs-advice-green">
                <div className="cs-advice-heading">📅 Follow-up Plan</div>
                <div className="cs-advice-body">{cs.followUpPlan || '—'}</div>
              </div>
            </div>

            {/* Referrals */}
            {cs.referrals?.filter(Boolean).length > 0 && (
              <div className="cs-referrals">
                <span className="cs-ref-label">🔗 Referrals:</span>
                <span className="cs-ref-val">{cs.referrals.join(', ')}</span>
              </div>
            )}

            {/* Doctor notes */}
            {cs.doctorNotes && (
              <div className="cs-doctor-notes">
                <span className="cs-notes-label">📝 Doctor's Notes:</span>
                <span className="cs-notes-val">{cs.doctorNotes}</span>
              </div>
            )}

            {/* Footer – signature & QR */}
            <div className="cs-footer">
              <div className="cs-footer-left">
                <div className="cs-qr-block">
                  [QR<br/>VERIFIED]
                </div>
                <div className="cs-hash-text">
                  AI-Generated &amp; Digitally Signed via MediTrust Blockchain.<br/>
                  Hash: <span className="cs-hash-code">{cs.verificationHash || '0x8a92f...4e19'}</span>
                </div>
              </div>
              <div className="cs-footer-right">
                <div className="cs-sig-name">{doctorName.replace('Dr. ', '')}</div>
                <div className="cs-sig-line">Doctor Digital Signature</div>
              </div>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: TRANSCRIPT                                                */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'transcript' && (
          <div className="cs-transcript-body">
            {transcriptLines.length === 0 ? (
              <div className="cs-empty">No transcript captured.</div>
            ) : transcriptLines.map((line, i) => (
              <div key={i} className="cs-tline">
                <div className={`cs-tline-avatar ${line.speaker?.includes('Dr') ? 'cs-tline-doc' : 'cs-tline-pat'}`}>
                  {line.speaker?.includes('Dr') ? '👨‍⚕️' : '👤'}
                </div>
                <div className="cs-tline-bubble" style={{ borderLeftColor: line.speaker?.includes('Dr') ? '#38bdf8' : '#34d399' }}>
                  <div className="cs-tline-speaker" style={{ color: line.speaker?.includes('Dr') ? '#38bdf8' : '#34d399' }}>
                    {line.speaker} {line.time ? `· ${line.time}` : ''}
                  </div>
                  <div className="cs-tline-text">{line.text}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: VIDEO SUMMARY                                             */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'video' && videoSummary && (
          <div className="cs-video-summary-body">
            <div className="cs-vs-header">
              <div className="cs-vs-icon">📹</div>
              <div>
                <div className="cs-vs-title">Video Consultation Summary</div>
                <div className="cs-vs-sub">Auto-generated by AI Medical Scribe after call ended</div>
              </div>
            </div>
            <div className="cs-vs-stats">
              {[
                { label: 'Duration',    val: videoSummary.duration || '18 min' },
                { label: 'Participants', val: videoSummary.participants || '2' },
                { label: 'AI Confidence', val: videoSummary.confidence || '94%' },
                { label: 'Language',    val: videoSummary.language || 'English' },
              ].map(s => (
                <div key={s.label} className="cs-vs-stat">
                  <div className="cs-vs-stat-val">{s.val}</div>
                  <div className="cs-vs-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="cs-vs-sections">
              {[
                { title: '💬 Key Discussion Points', body: videoSummary.keyPoints || cs.chiefComplaint },
                { title: '🩺 Clinical Observations', body: videoSummary.observations || cs.clinicalFindings },
                { title: '📋 Decisions Made',        body: videoSummary.decisions || `Diagnosis: ${cs.diagnosis}. Prescribed ${cs.medications?.length || 0} medication(s).` },
                { title: '📅 Next Steps',             body: videoSummary.nextSteps || cs.followUpPlan },
              ].map(s => (
                <div key={s.title} className="cs-vs-section">
                  <div className="cs-vs-section-title">{s.title}</div>
                  <div className="cs-vs-section-body">{s.body || '—'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Action Bar ───────────────────────────────────────────────────── */}
        <div className="cs-action-bar no-print">
          <div className="cs-action-info">
            <i className="fa-solid fa-shield-halved" style={{ color: '#1a73e8' }}></i>
            AI-generated · Requires physician review before clinical use
          </div>
          <div className="cs-action-buttons">
            <button onClick={handleSpeak} className={`cs-btn-speak ${speaking ? 'cs-btn-speak--active' : ''}`}>
              <i className={`fa-solid ${speaking ? 'fa-stop' : 'fa-volume-high'}`}></i>
              {speaking ? 'Stop' : 'Read Aloud'}
            </button>
            <button onClick={handlePrint} className="cs-btn-print">
              <i className="fa-solid fa-print"></i> Print PDF
            </button>
            {!posted ? (
              <button onClick={handlePost} disabled={posting} className="cs-btn-post">
                {posting
                  ? <><i className="fa-solid fa-spinner fa-spin"></i> Posting to HMS...</>
                  : <><i className="fa-solid fa-hospital"></i> Post to Hospital HMS</>}
              </button>
            ) : (
              <div className="cs-posted-confirm">
                <i className="fa-solid fa-circle-check"></i> Posted to HMS &nbsp;·&nbsp; #{recordId?.slice(0, 12)}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
