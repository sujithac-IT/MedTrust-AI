// MediTrust AI — Consultation Data Types & Schemas
// Central definitions for consultation states, patient schema, and case sheet structure.

// ════════════════════════════════════════════════════════════════════
// CONSULTATION STATES
// ════════════════════════════════════════════════════════════════════

export const CONSULTATION_STATUS = {
  SCHEDULED: 'SCHEDULED',
  ACTIVE: 'ACTIVE',
  ENDED: 'ENDED',
  TRANSCRIPT_PROCESSING: 'TRANSCRIPT_PROCESSING',
  TRANSCRIPT_AVAILABLE: 'TRANSCRIPT_AVAILABLE',
  CASE_SHEET_GENERATING: 'CASE_SHEET_GENERATING',
  CASE_SHEET_READY: 'CASE_SHEET_READY',
  APPROVED: 'APPROVED',
  FAILED: 'FAILED',
};

export const TRANSCRIPT_STATUS = {
  WAITING: 'WAITING',
  PROCESSING: 'PROCESSING',
  AVAILABLE: 'AVAILABLE',
  UNAVAILABLE: 'UNAVAILABLE',
  FAILED: 'FAILED',
};

// Valid state transitions
export const VALID_TRANSITIONS = {
  [CONSULTATION_STATUS.SCHEDULED]: [CONSULTATION_STATUS.ACTIVE, CONSULTATION_STATUS.FAILED],
  [CONSULTATION_STATUS.ACTIVE]: [CONSULTATION_STATUS.ENDED, CONSULTATION_STATUS.FAILED],
  [CONSULTATION_STATUS.ENDED]: [CONSULTATION_STATUS.TRANSCRIPT_PROCESSING, CONSULTATION_STATUS.FAILED],
  [CONSULTATION_STATUS.TRANSCRIPT_PROCESSING]: [CONSULTATION_STATUS.TRANSCRIPT_AVAILABLE, CONSULTATION_STATUS.FAILED],
  [CONSULTATION_STATUS.TRANSCRIPT_AVAILABLE]: [CONSULTATION_STATUS.CASE_SHEET_GENERATING, CONSULTATION_STATUS.FAILED],
  [CONSULTATION_STATUS.CASE_SHEET_GENERATING]: [CONSULTATION_STATUS.CASE_SHEET_READY, CONSULTATION_STATUS.FAILED],
  [CONSULTATION_STATUS.CASE_SHEET_READY]: [CONSULTATION_STATUS.APPROVED, CONSULTATION_STATUS.CASE_SHEET_GENERATING],
  [CONSULTATION_STATUS.APPROVED]: [], // Terminal state
  [CONSULTATION_STATUS.FAILED]: [CONSULTATION_STATUS.SCHEDULED], // Allow retry
};

/**
 * Validates a state transition.
 * @param {string} current - Current consultation status
 * @param {string} next - Proposed next status
 * @returns {boolean}
 */
export function canTransition(current, next) {
  const allowed = VALID_TRANSITIONS[current];
  return allowed ? allowed.includes(next) : false;
}

// ════════════════════════════════════════════════════════════════════
// CONSULTATION SCHEMA
// ════════════════════════════════════════════════════════════════════

export function createConsultation({ patientId, doctorId, meetingId = '', meetingUrl = '' }) {
  return {
    id: 'CONS-' + Date.now().toString(36).toUpperCase(),
    patientId,
    doctorId,
    meetingId,
    meetingUrl,
    status: CONSULTATION_STATUS.SCHEDULED,
    startTime: null,
    endTime: null,
    transcriptStatus: TRANSCRIPT_STATUS.WAITING,
    caseSheetStatus: null,
    transcript: [],
    caseSheet: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ════════════════════════════════════════════════════════════════════
// PATIENT SCHEMA
// ════════════════════════════════════════════════════════════════════

export function createPatient({ name, dateOfBirth, age, gender, phone, email, allergies = [], medicalConditions = [] }) {
  return {
    id: 'PAT-' + Date.now().toString(36).toUpperCase(),
    name: name?.trim() || '',
    dateOfBirth: dateOfBirth || '',
    age: age || '',
    gender: gender || '',
    phone: phone?.trim() || '',
    email: email?.trim() || '',
    allergies: Array.isArray(allergies) ? allergies : [allergies].filter(Boolean),
    medicalConditions: Array.isArray(medicalConditions) ? medicalConditions : [medicalConditions].filter(Boolean),
    consultations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ════════════════════════════════════════════════════════════════════
// 17-SECTION CASE SHEET TEMPLATE
// ════════════════════════════════════════════════════════════════════

export const EMPTY_CASE_SHEET = {
  patient_details: { name: '', age: '', gender: '' },
  chief_complaint: [],
  history_of_present_illness: '',
  symptoms: [],
  duration: '',
  past_medical_history: [],
  medications: [],
  allergies: [],
  family_history: [],
  social_history: '',
  doctor_observations: '',
  investigations: [],
  assessment: '',
  treatment_plan: '',
  follow_up: '',
  missing_information: [],
  uncertain_information: [],
};

/** The display order and labels for the 17 sections of the case sheet */
export const CASE_SHEET_SECTIONS = [
  { key: 'patient_details', label: 'Patient Information', type: 'object' },
  { key: 'chief_complaint', label: 'Chief Complaint', type: 'list' },
  { key: 'history_of_present_illness', label: 'History of Present Illness', type: 'text' },
  { key: 'symptoms', label: 'Symptoms', type: 'list' },
  { key: 'duration', label: 'Duration', type: 'text' },
  { key: 'past_medical_history', label: 'Past Medical History', type: 'list' },
  { key: 'medications', label: 'Current Medications', type: 'medications' },
  { key: 'allergies', label: 'Allergies', type: 'list' },
  { key: 'family_history', label: 'Family History', type: 'list' },
  { key: 'social_history', label: 'Social History', type: 'text' },
  { key: 'doctor_observations', label: 'Doctor Observations', type: 'text' },
  { key: 'investigations', label: 'Investigations', type: 'list' },
  { key: 'assessment', label: 'Assessment / Diagnosis', type: 'text' },
  { key: 'treatment_plan', label: 'Treatment Plan', type: 'text' },
  { key: 'follow_up', label: 'Follow-up', type: 'text' },
  { key: 'missing_information', label: 'Missing Information', type: 'list', style: 'warning' },
  { key: 'uncertain_information', label: 'Uncertain Information', type: 'list', style: 'caution' },
];

// ════════════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ════════════════════════════════════════════════════════════════════

export function validatePatientInput({ name, gender, age }) {
  const errors = [];
  if (!name || name.trim().length < 2) errors.push('Patient name is required (at least 2 characters).');
  if (!gender) errors.push('Gender is required.');
  if (age !== undefined && age !== '' && (isNaN(Number(age)) || Number(age) < 0 || Number(age) > 150)) {
    errors.push('Age must be a number between 0 and 150.');
  }
  return errors;
}

export function validateConsultationForApproval(consultation) {
  const errors = [];
  if (!consultation?.caseSheet) errors.push('Case sheet must be generated before approval.');
  if (consultation?.status === CONSULTATION_STATUS.APPROVED) errors.push('This consultation is already approved.');
  return errors;
}
