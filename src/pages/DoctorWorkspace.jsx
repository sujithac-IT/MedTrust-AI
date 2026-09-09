// MediTrust AI — Doctor Workspace (Complete Consultation Workflow)
// Orchestrates: Patient Selection → Consultation → Google Meet → Transcript → Gemini → Case Sheet → Approval → History

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ToastContainer, showToast } from '../components/Toast';
import GoogleMeetStudio from '../components/GoogleMeetStudio';
import CaseSheetEditor from '../components/CaseSheetEditor';
import DoctorApprovalModal from '../components/DoctorApprovalModal';
import PatientManagementModal from '../components/PatientManagementModal';
import {
  CONSULTATION_STATUS, TRANSCRIPT_STATUS,
  createConsultation, canTransition,
} from '../types/consultation';
import {
  createMeeting, retrieveTranscript, formatTranscriptForAI,
  isGoogleConfigured, DEMO_TRANSCRIPT_LINES,
} from '../services/googleMeet';
import { extractCaseSheetWithGemini, isGeminiConfigured, getGeminiConfigStatus } from '../services/geminiService';
import {
  getPatients, addPatient, searchPatients,
  addConsultationToHistory, getConsultationHistory, getAllConsultationHistory,
} from '../services/patientService';
import {
  SUPPORTED_LANGUAGES, translateSummary, speakText, stopSpeaking,
} from '../utils/gemini';

// Workflow phases (UI-level)
const PHASE = {
  PATIENTS: 'patients',
  CONSULTATION: 'consultation',
  PROCESSING: 'processing',
  REVIEW: 'review',
  APPROVED: 'approved',
};

export default function DoctorWorkspace() {
  const { userProfile } = useAuth();

  // Doctor info
  const doctor = {
    name: userProfile?.displayName || 'Dr. Arjun Mehta',
    id: userProfile?.uid || 'DOC-001',
    specialty: userProfile?.specialty || 'General Medicine',
    hospital: userProfile?.hospital || 'MediTrust AI Health Institute',
    licenseNo: userProfile?.licenseNo || 'MCI-2024-4821',
  };

  // ── State ──
  const [phase, setPhase] = useState(PHASE.PATIENTS);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [consultation, setConsultation] = useState(null);
  const [transcriptLines, setTranscriptLines] = useState([]);
  const [caseSheet, setCaseSheet] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [consultationHistory, setConsultationHistory] = useState([]);
  const [selectedHistoryRecord, setSelectedHistoryRecord] = useState(null);
  const [patientHistoryMap, setPatientHistoryMap] = useState({});

  // ── Load patients on mount ──
  useEffect(() => {
    loadPatients();
    loadHistory();
  }, []);

  const loadPatients = async () => {
    const result = await getPatients();
    if (result.success) setPatients(result.patients);
  };

  const loadHistory = () => {
    const history = getAllConsultationHistory();
    setConsultationHistory(history);
  };

  // ── Patient Selection ──
  const filteredPatients = searchPatients(patients, searchTerm);

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setTranscriptLines([]);
    setCaseSheet(null);
    setSelectedHistoryRecord(null);

    // Create consultation and meeting
    const meeting = await createMeeting();
    const cons = createConsultation({
      patientId: patient.id,
      doctorId: doctor.id,
      meetingId: meeting.meetingId,
      meetingUrl: meeting.meetingUrl,
    });
    cons.meetingCode = meeting.meetingCode;
    cons.spaceId = meeting.spaceId;
    cons.source = meeting.source;
    setConsultation(cons);

    // Load patient-specific history
    const histResult = await getConsultationHistory(patient.id);
    setPatientHistoryMap(prev => ({ ...prev, [patient.id]: histResult.records }));

    setPhase(PHASE.CONSULTATION);
    showToast(`Consultation created for ${patient.name}`, 'success');
  };

  const handleCreatePatient = async (patientData) => {
    const result = await addPatient(patientData);
    if (result.success) {
      setPatients(prev => [result.patient, ...prev]);
      setShowPatientModal(false);
      showToast(`Patient ${result.patient.name} created successfully`, 'success');
    } else {
      showToast(result.errors?.join(', ') || 'Failed to create patient', 'error');
    }
  };

  // ── Consultation Lifecycle ──
  const handleStartConsultation = () => {
    setConsultation(prev => ({
      ...prev,
      status: CONSULTATION_STATUS.ACTIVE,
      startTime: new Date().toISOString(),
    }));
  };

  const handleTranscriptLineAdd = (line) => {
    setTranscriptLines(prev => [...prev, line]);
  };

  const handleTranscriptReady = () => {
    setConsultation(prev => ({
      ...prev,
      status: CONSULTATION_STATUS.ENDED,
      endTime: new Date().toISOString(),
    }));
    // Auto-proceed to processing
    processTranscriptAndGenerate();
  };

  const handleEndConsultation = () => {
    setConsultation(prev => ({
      ...prev,
      status: CONSULTATION_STATUS.ENDED,
      endTime: new Date().toISOString(),
    }));

    if (transcriptLines.length >= 3) {
      processTranscriptAndGenerate();
    } else {
      showToast('Consultation too short for AI analysis. Need at least 3 transcript lines.', 'error');
    }
  };

  // ── Processing Pipeline ──
  const processTranscriptAndGenerate = async () => {
    setPhase(PHASE.PROCESSING);

    // Stage 1: Transcript Processing
    setProcessingStage('transcript');
    setConsultation(prev => ({
      ...prev,
      status: CONSULTATION_STATUS.TRANSCRIPT_PROCESSING,
      transcriptStatus: TRANSCRIPT_STATUS.PROCESSING,
    }));
    await sleep(800);

    // If we have fewer lines than the demo, use accumulated lines
    let finalLines = transcriptLines;
    if (finalLines.length === 0) {
      // Fallback: retrieve transcript (demo will return sample)
      const transcriptResult = await retrieveTranscript(consultation?.spaceId);
      if (transcriptResult.success && transcriptResult.lines.length > 0) {
        finalLines = transcriptResult.lines;
        setTranscriptLines(finalLines);
      }
    }

    setConsultation(prev => ({
      ...prev,
      status: CONSULTATION_STATUS.TRANSCRIPT_AVAILABLE,
      transcriptStatus: TRANSCRIPT_STATUS.AVAILABLE,
      transcript: finalLines,
    }));

    // Stage 2: Gemini AI Extraction
    setProcessingStage('extraction');
    setConsultation(prev => ({
      ...prev,
      status: CONSULTATION_STATUS.CASE_SHEET_GENERATING,
    }));
    await sleep(600);

    const transcriptText = formatTranscriptForAI(finalLines);
    const extractionResult = await extractCaseSheetWithGemini(transcriptText);

    if (extractionResult.success) {
      const cs = extractionResult.data;
      // Enrich patient details from selected patient
      if (selectedPatient) {
        cs.patient_details = {
          name: selectedPatient.name,
          age: String(selectedPatient.age || cs.patient_details?.age || 'Not mentioned'),
          gender: selectedPatient.gender || cs.patient_details?.gender || 'Not mentioned',
        };
      }

      setCaseSheet(cs);
      setConsultation(prev => ({
        ...prev,
        status: CONSULTATION_STATUS.CASE_SHEET_READY,
        caseSheet: cs,
      }));

      setPhase(PHASE.REVIEW);
      const geminiStatus = getGeminiConfigStatus();
      showToast(
        `Case sheet generated ${extractionResult.source === 'gemini_api' ? 'via Gemini AI' : 'via built-in clinical NLP'}. Please review.`,
        'success'
      );
    } else {
      showToast('Case sheet generation failed. Please try again.', 'error');
      setPhase(PHASE.CONSULTATION);
    }
  };

  // ── Case Sheet Actions ──
  const handleCaseSheetUpdate = (updatedCaseSheet) => {
    setCaseSheet(updatedCaseSheet);
    setConsultation(prev => ({ ...prev, caseSheet: updatedCaseSheet }));
    showToast('Case sheet updated', 'info');
  };

  const handleSaveDraft = () => {
    showToast('Draft saved locally', 'success');
  };

  const handleRegenerate = () => {
    processTranscriptAndGenerate();
  };

  const handleApproveClick = () => {
    setShowApprovalModal(true);
  };

  const handleConfirmApproval = async () => {
    const approvedRecord = {
      ...consultation,
      caseSheet: caseSheet,
      status: CONSULTATION_STATUS.APPROVED,
      approvedAt: new Date().toISOString(),
      approvedBy: doctor.id,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty,
      hospital: doctor.hospital,
      patientName: selectedPatient?.name,
    };

    // Save to patient history
    await addConsultationToHistory(selectedPatient.id, approvedRecord);

    setConsultation(prev => ({
      ...prev,
      status: CONSULTATION_STATUS.APPROVED,
    }));

    // Refresh history
    const histResult = await getConsultationHistory(selectedPatient.id);
    setPatientHistoryMap(prev => ({ ...prev, [selectedPatient.id]: histResult.records }));
    setConsultationHistory(prev => [approvedRecord, ...prev]);

    setShowApprovalModal(false);
    setPhase(PHASE.APPROVED);
    showToast('Case sheet approved and saved to patient medical history!', 'success');
  };

  // ── New Consultation ──
  const handleNewConsultation = () => {
    setPhase(PHASE.PATIENTS);
    setSelectedPatient(null);
    setConsultation(null);
    setTranscriptLines([]);
    setCaseSheet(null);
    setSelectedHistoryRecord(null);
    loadHistory();
  };

  // ══════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════

  return (
    <div className="page" style={{ background: 'var(--bg)', padding: '20px 24px' }}>
      <ToastContainer />

      {/* ────────────── PHASE: Patient Selection ────────────── */}
      {phase === PHASE.PATIENTS && (
        <div style={{ maxWidth: 960, margin: '0 auto' }} className="fade-in">
          <div className="page-header">
            <h1 className="page-title" style={{ color: 'var(--text)' }}>Doctor Consultation Workspace</h1>
            <p className="page-subtitle">Select a patient to begin an AI-assisted Google Meet consultation</p>
          </div>

          {/* Configuration Status */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <div className={`badge ${isGoogleConfigured() ? 'badge-green' : 'badge-amber'}`}>
              <i className={`fa-solid ${isGoogleConfigured() ? 'fa-check' : 'fa-info-circle'}`} />
              Google Meet: {isGoogleConfigured() ? 'Configured' : 'Demo Mode'}
            </div>
            <div className={`badge ${isGeminiConfigured() ? 'badge-green' : 'badge-amber'}`}>
              <i className={`fa-solid ${isGeminiConfigured() ? 'fa-check' : 'fa-info-circle'}`} />
              Gemini AI: {isGeminiConfigured() ? 'Configured' : 'Local NLP'}
            </div>
          </div>

          {/* Patient Card */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title">
                <i className="fa-solid fa-users" style={{ color: 'var(--primary)', marginRight: 8 }} />
                Patients
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <i className="fa-solid fa-search" style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text3)', fontSize: '.82rem',
                  }} />
                  <input
                    className="form-input"
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: 36, width: 220, fontSize: '.82rem' }}
                  />
                </div>
                <button className="btn btn-sm btn-primary" onClick={() => setShowPatientModal(true)}>
                  <i className="fa-solid fa-plus" /> Add Patient
                </button>
              </div>
            </div>

            {filteredPatients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
                <i className="fa-solid fa-user-slash" style={{ fontSize: '2rem', marginBottom: 12, opacity: 0.3 }} />
                <div style={{ fontSize: '.88rem' }}>No patients found</div>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Age / Gender</th>
                    <th>Contact</th>
                    <th>Medical Conditions</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar avatar-sm" style={{ background: 'var(--primary)' }}>
                            {p.name?.[0] || 'P'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
                            <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>#{p.id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text)' }}>{p.age || '—'} / {p.gender || '—'}</td>
                      <td style={{ fontSize: '.82rem', color: 'var(--text2)' }}>{p.phone || p.email || '—'}</td>
                      <td style={{ fontSize: '.82rem', color: 'var(--text2)' }}>
                        {(p.medicalConditions || []).join(', ') || 'None recorded'}
                      </td>
                      <td>
                        <button className="btn btn-sm btn-primary" onClick={() => handleSelectPatient(p)}>
                          <i className="fa-solid fa-stethoscope" /> Consult
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Recent Consultation History */}
          {consultationHistory.length > 0 && (
            <div className="card">
              <div className="card-title" style={{ marginBottom: 16 }}>
                <i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--text3)', marginRight: 8 }} />
                Recent Consultations
              </div>
              {consultationHistory.slice(0, 5).map((h, i) => (
                <div key={i} className="history-item" onClick={() => setSelectedHistoryRecord(h)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                        {h.patientName || 'Patient'} — {h.caseSheet?.assessment || 'Consultation'}
                      </div>
                      <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>
                        {h.approvedAt ? new Date(h.approvedAt).toLocaleString('en-IN') : h.savedAt ? new Date(h.savedAt).toLocaleString('en-IN') : ''}
                      </div>
                    </div>
                    <span className="badge badge-green"><i className="fa-solid fa-check" /> Approved</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Historical Record Viewer */}
          {selectedHistoryRecord && (
            <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setSelectedHistoryRecord(null); }}>
              <div className="modal-content" style={{ maxWidth: 720, padding: 24, maxHeight: '85vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ color: 'var(--text)', margin: 0 }}>Approved Case Sheet</h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedHistoryRecord(null)}>
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>
                <CaseSheetEditor
                  caseSheet={selectedHistoryRecord.caseSheet}
                  consultation={selectedHistoryRecord}
                  patient={{ name: selectedHistoryRecord.patientName, id: selectedHistoryRecord.patientId }}
                  doctor={{ name: selectedHistoryRecord.doctorName, specialty: selectedHistoryRecord.doctorSpecialty, hospital: selectedHistoryRecord.hospital }}
                  isApproved={true}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────── PHASE: Live Consultation ────────────── */}
      {phase === PHASE.CONSULTATION && selectedPatient && consultation && (
        <div className="consultation-workspace fade-in">
          {/* Left: Patient Info Panel */}
          <div className="workspace-panel">
            <div className="workspace-panel-header">
              <i className="fa-solid fa-user" style={{ color: 'var(--primary)' }} /> Patient Information
            </div>
            <div className="workspace-panel-body">
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div className="avatar avatar-lg" style={{ background: 'var(--primary)', margin: '0 auto 12px' }}>
                  {selectedPatient.name?.split(' ').map(n => n[0]).join('') || 'P'}
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>{selectedPatient.name}</div>
                <div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>#{selectedPatient.id}</div>
              </div>

              {[
                ['Age', selectedPatient.age ? `${selectedPatient.age} years` : '—'],
                ['Gender', selectedPatient.gender || '—'],
                ['Phone', selectedPatient.phone || '—'],
                ['Email', selectedPatient.email || '—'],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: '.84rem' }}>
                  <span style={{ color: 'var(--text2)' }}>{label}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{val}</span>
                </div>
              ))}

              {/* Allergies */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                  Allergies
                </div>
                {(selectedPatient.allergies || []).map((a, i) => (
                  <div key={i} style={{ fontSize: '.82rem', padding: '4px 10px', background: 'var(--red-light)', borderRadius: 6, marginBottom: 4, color: 'var(--red)' }}>
                    {a}
                  </div>
                ))}
              </div>

              {/* Medical conditions */}
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                  Medical Conditions
                </div>
                {(selectedPatient.medicalConditions || []).map((c, i) => (
                  <div key={i} style={{ fontSize: '.82rem', padding: '4px 10px', background: 'var(--bg)', borderRadius: 6, marginBottom: 4, color: 'var(--text)' }}>
                    {c}
                  </div>
                ))}
              </div>

              {/* Patient History */}
              {(patientHistoryMap[selectedPatient.id] || []).length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                    Past Consultations
                  </div>
                  {patientHistoryMap[selectedPatient.id].slice(0, 3).map((h, i) => (
                    <div key={i} style={{ fontSize: '.78rem', padding: '6px 10px', background: 'var(--secondary-light)', borderRadius: 6, marginBottom: 4, color: 'var(--secondary)' }}>
                      <div style={{ fontWeight: 600 }}>{h.caseSheet?.assessment || 'Consultation'}</div>
                      <div style={{ fontSize: '.7rem' }}>{h.approvedAt ? new Date(h.approvedAt).toLocaleDateString('en-IN') : ''}</div>
                    </div>
                  ))}
                </div>
              )}

              <button className="btn btn-ghost btn-sm" style={{ marginTop: 20, width: '100%', justifyContent: 'center' }} onClick={handleNewConsultation}>
                <i className="fa-solid fa-arrow-left" /> Change Patient
              </button>
            </div>
          </div>

          {/* Center: Google Meet Studio (DOMINANT) */}
          <div className="consultation-center-col">
            <GoogleMeetStudio
              consultation={consultation}
              patient={selectedPatient}
              onStartConsultation={handleStartConsultation}
              onEndConsultation={handleEndConsultation}
              onTranscriptReady={handleTranscriptReady}
              transcriptLines={transcriptLines}
              onTranscriptLineAdd={handleTranscriptLineAdd}
            />
          </div>

          {/* Right: AI Medical Scribe */}
          <div className="workspace-panel">
            <div className="workspace-panel-header">
              <i className="fa-solid fa-brain" style={{ color: 'var(--primary)' }} /> AI Medical Scribe
              {consultation.status === CONSULTATION_STATUS.ACTIVE && (
                <span className="badge badge-red" style={{ marginLeft: 'auto' }}>● Live</span>
              )}
            </div>
            <div className="workspace-panel-body">
              {transcriptLines.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
                  <i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize: '2rem', marginBottom: 12, opacity: 0.3 }} />
                  <div style={{ fontSize: '.85rem' }}>AI scribe will appear here during consultation</div>
                </div>
              ) : (
                <div>
                  <div className="scribe-section">
                    <div className="scribe-label"><i className="fa-solid fa-message" /> Live Transcription</div>
                    <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                      {transcriptLines.map((line, i) => (
                        <div key={i} className="transcript-line fade-in">
                          <div className={`transcript-speaker ${line.speaker}`}>
                            {line.speaker === 'doctor' ? 'Doctor' : 'Patient'}
                          </div>
                          <div className="transcript-text" style={{ color: 'var(--text)' }}>{line.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Consultation Status */}
                  <div style={{ marginTop: 16, padding: '12px 0', borderTop: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 8 }}>
                      Status
                    </div>
                    <div style={{ fontSize: '.82rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="fa-solid fa-closed-captioning" style={{ color: 'var(--primary)', width: 16 }} />
                        <span style={{ color: 'var(--text)' }}>{transcriptLines.length} lines transcribed</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="fa-solid fa-robot" style={{ color: 'var(--teal)', width: 16 }} />
                        <span style={{ color: 'var(--text)' }}>AI: {isGeminiConfigured() ? 'Gemini Ready' : 'Local NLP Ready'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="fa-solid fa-file-medical" style={{ color: 'var(--text3)', width: 16 }} />
                        <span style={{ color: 'var(--text)' }}>Case Sheet: Pending</span>
                      </div>
                    </div>
                  </div>

                  {/* Manual generate button */}
                  {consultation.status === CONSULTATION_STATUS.ENDED && (
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
                      onClick={processTranscriptAndGenerate}
                    >
                      <i className="fa-solid fa-wand-magic-sparkles" /> Generate Case Sheet
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ────────────── PHASE: Processing ────────────── */}
      {phase === PHASE.PROCESSING && (
        <div className="fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center', maxWidth: 500 }}>
            <div className="processing-spinner" style={{ margin: '0 auto 24px', width: 48, height: 48 }} />
            <h2 style={{ fontSize: '1.4rem', marginBottom: 8, color: 'var(--text)' }}>Processing Consultation</h2>
            <p style={{ color: 'var(--text2)', fontSize: '.9rem', marginBottom: 24 }}>
              AI is analyzing the transcript and extracting clinical information
            </p>

            <div className="status-steps" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
              <span className={`status-step ${processingStage === 'transcript' ? 'active' : 'done'}`}>
                <i className={`fa-solid ${processingStage === 'transcript' ? 'fa-spinner fa-spin' : 'fa-check'}`} /> Transcript
              </span>
              <span className="status-arrow">→</span>
              <span className={`status-step ${processingStage === 'extraction' ? 'active' : processingStage === 'transcript' ? 'pending' : 'done'}`}>
                <i className={`fa-solid ${processingStage === 'extraction' ? 'fa-spinner fa-spin' : processingStage === 'transcript' ? 'fa-brain' : 'fa-check'}`} />
                {isGeminiConfigured() ? 'Gemini AI' : 'Clinical NLP'}
              </span>
              <span className="status-arrow">→</span>
              <span className="status-step pending">Case Sheet</span>
              <span className="status-arrow">→</span>
              <span className="status-step pending">Doctor Review</span>
            </div>
          </div>
        </div>
      )}

      {/* ────────────── PHASE: Review Case Sheet ────────────── */}
      {phase === PHASE.REVIEW && caseSheet && (
        <div style={{ maxWidth: 900, margin: '0 auto' }} className="fade-in">
          {/* Status Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 className="page-title" style={{ fontSize: '1.4rem', color: 'var(--text)' }}>Review AI-Generated Case Sheet</h1>
              <p className="page-subtitle">Verify, edit, and approve before saving to patient records</p>
            </div>
            <div className="status-steps">
              <span className="status-step done"><i className="fa-solid fa-check" /> Transcribed</span>
              <span className="status-arrow">→</span>
              <span className="status-step done"><i className="fa-solid fa-check" /> AI Extracted</span>
              <span className="status-arrow">→</span>
              <span className="status-step active"><i className="fa-solid fa-pen" /> Doctor Review</span>
              <span className="status-arrow">→</span>
              <span className="status-step pending">Approved</span>
            </div>
          </div>

          <CaseSheetEditor
            caseSheet={caseSheet}
            consultation={consultation}
            patient={selectedPatient}
            doctor={doctor}
            onUpdate={handleCaseSheetUpdate}
            onApprove={handleApproveClick}
            onRegenerate={handleRegenerate}
            onSaveDraft={handleSaveDraft}
            isApproved={false}
          />
        </div>
      )}

      {/* ────────────── PHASE: Approved ────────────── */}
      {phase === PHASE.APPROVED && (
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', padding: '60px 0' }} className="fade-in">
          <div style={{
            width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
            background: 'var(--secondary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="fa-solid fa-check" style={{ fontSize: '2rem', color: 'var(--secondary)' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 8, color: 'var(--text)' }}>Case Sheet Approved & Saved</h2>
          <p style={{ color: 'var(--text2)', marginBottom: 32 }}>
            The clinical record has been approved and saved to {selectedPatient?.name}'s medical history.
          </p>

          <div className="card" style={{ textAlign: 'left', marginBottom: 24 }}>
            <div className="card-title" style={{ marginBottom: 16 }}>Record Summary</div>
            {[
              ['Patient', selectedPatient?.name],
              ['Patient ID', selectedPatient?.id],
              ['Doctor', doctor.name],
              ['Assessment', caseSheet?.assessment],
              ['Consultation ID', consultation?.id],
              ['Status', 'Approved ✓'],
              ['Approved At', consultation?.status === CONSULTATION_STATUS.APPROVED ? new Date().toLocaleString('en-IN') : ''],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: '.85rem' }}>
                <span style={{ color: 'var(--text2)' }}>{l}</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{v || '—'}</span>
              </div>
            ))}

            <div className="status-steps" style={{ marginTop: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
              <span className="status-step done"><i className="fa-solid fa-check" /> Consultation</span>
              <span className="status-arrow">→</span>
              <span className="status-step done"><i className="fa-solid fa-check" /> Transcript</span>
              <span className="status-arrow">→</span>
              <span className="status-step done"><i className="fa-solid fa-check" /> AI Extraction</span>
              <span className="status-arrow">→</span>
              <span className="status-step done"><i className="fa-solid fa-check" /> Approved</span>
              <span className="status-arrow">→</span>
              <span className="status-step done"><i className="fa-solid fa-check" /> Saved</span>
            </div>
          </div>

          <button className="btn btn-primary btn-lg" onClick={handleNewConsultation}>
            <i className="fa-solid fa-plus" /> New Consultation
          </button>
        </div>
      )}

      {/* ────────────── Modals ────────────── */}
      {showApprovalModal && (
        <DoctorApprovalModal
          caseSheet={caseSheet}
          doctor={doctor}
          onConfirm={handleConfirmApproval}
          onCancel={() => setShowApprovalModal(false)}
        />
      )}

      {showPatientModal && (
        <PatientManagementModal
          onSave={handleCreatePatient}
          onCancel={() => setShowPatientModal(false)}
        />
      )}
    </div>
  );
}

// Utility
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
