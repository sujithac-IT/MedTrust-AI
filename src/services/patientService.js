// MediTrust AI — Patient Management Service
// CRUD operations for patient records with Firestore and in-memory fallback.

import {
  collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc,
  query, where, orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { createPatient, validatePatientInput } from '../types/consultation';

// ════════════════════════════════════════════════════════════════════
// IN-MEMORY STORE (demo fallback)
// ════════════════════════════════════════════════════════════════════

const DEMO_PATIENTS = [
  {
    id: 'PAT-001',
    name: 'Rahul Sharma',
    dateOfBirth: '1984-03-15',
    age: 42,
    gender: 'Male',
    phone: '+91 98765 43210',
    email: 'rahul.sharma@email.com',
    allergies: ['No known drug allergies (NKDA)'],
    medicalConditions: ['Hypertension — Amlodipine 5mg daily'],
    consultations: [],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'PAT-002',
    name: 'Priya Deshpande',
    dateOfBirth: '1997-07-22',
    age: 29,
    gender: 'Female',
    phone: '+91 87654 32109',
    email: 'priya.deshpande@email.com',
    allergies: ['Penicillin'],
    medicalConditions: ['No significant past history'],
    consultations: [],
    createdAt: '2024-02-20T14:30:00Z',
    updatedAt: '2024-02-20T14:30:00Z',
  },
  {
    id: 'PAT-003',
    name: 'Ravi Kumar',
    dateOfBirth: '1972-11-08',
    age: 54,
    gender: 'Male',
    phone: '+91 76543 21098',
    email: 'ravi.kumar@email.com',
    allergies: ['Sulfa drugs'],
    medicalConditions: ['Type 2 Diabetes — Metformin 500mg', 'Hypertension'],
    consultations: [],
    createdAt: '2024-03-10T09:15:00Z',
    updatedAt: '2024-03-10T09:15:00Z',
  },
];

// Local store used in demo mode or when Firestore is unavailable
let localPatients = [...DEMO_PATIENTS];
let localConsultationHistory = {};

function isFirestoreAvailable() {
  const key = import.meta.env.VITE_FIREBASE_API_KEY;
  return key && key !== 'demo-api-key' && key !== 'your-api-key-here';
}

// ════════════════════════════════════════════════════════════════════
// GET ALL PATIENTS
// ════════════════════════════════════════════════════════════════════

export async function getPatients() {
  if (!isFirestoreAvailable()) {
    return { success: true, patients: [...localPatients], source: 'local' };
  }

  try {
    const q = query(collection(db, 'patients'), orderBy('createdAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    const patients = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    // Merge with local demo patients if Firestore is empty
    if (patients.length === 0) {
      return { success: true, patients: [...localPatients], source: 'local_fallback' };
    }
    return { success: true, patients, source: 'firestore' };
  } catch (e) {
    console.warn('Firestore getPatients error:', e);
    return { success: true, patients: [...localPatients], source: 'local_fallback' };
  }
}

// ════════════════════════════════════════════════════════════════════
// GET SINGLE PATIENT
// ════════════════════════════════════════════════════════════════════

export async function getPatientById(patientId) {
  if (!isFirestoreAvailable()) {
    const patient = localPatients.find(p => p.id === patientId);
    return patient ? { success: true, patient, source: 'local' } : { success: false, error: 'Patient not found' };
  }

  try {
    const docSnap = await getDoc(doc(db, 'patients', patientId));
    if (docSnap.exists()) {
      return { success: true, patient: { id: docSnap.id, ...docSnap.data() }, source: 'firestore' };
    }
    // Check local fallback
    const local = localPatients.find(p => p.id === patientId);
    return local
      ? { success: true, patient: local, source: 'local' }
      : { success: false, error: 'Patient not found' };
  } catch (e) {
    console.warn('Firestore getPatient error:', e);
    const local = localPatients.find(p => p.id === patientId);
    return local
      ? { success: true, patient: local, source: 'local' }
      : { success: false, error: 'Patient not found' };
  }
}

// ════════════════════════════════════════════════════════════════════
// CREATE PATIENT
// ════════════════════════════════════════════════════════════════════

export async function addPatient(patientData) {
  const validationErrors = validatePatientInput(patientData);
  if (validationErrors.length > 0) {
    return { success: false, errors: validationErrors };
  }

  const patient = createPatient(patientData);

  if (!isFirestoreAvailable()) {
    localPatients = [patient, ...localPatients];
    return { success: true, patient, source: 'local' };
  }

  try {
    const docRef = await addDoc(collection(db, 'patients'), {
      ...patient,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    patient.id = docRef.id;
    return { success: true, patient, source: 'firestore' };
  } catch (e) {
    console.warn('Firestore addPatient error, saving locally:', e);
    localPatients = [patient, ...localPatients];
    return { success: true, patient, source: 'local_fallback' };
  }
}

// ════════════════════════════════════════════════════════════════════
// UPDATE PATIENT
// ════════════════════════════════════════════════════════════════════

export async function updatePatient(patientId, updates) {
  if (!isFirestoreAvailable()) {
    localPatients = localPatients.map(p =>
      p.id === patientId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    return { success: true, source: 'local' };
  }

  try {
    await updateDoc(doc(db, 'patients', patientId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return { success: true, source: 'firestore' };
  } catch (e) {
    console.warn('Firestore updatePatient error:', e);
    localPatients = localPatients.map(p =>
      p.id === patientId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    return { success: true, source: 'local_fallback' };
  }
}

// ════════════════════════════════════════════════════════════════════
// SEARCH PATIENTS
// ════════════════════════════════════════════════════════════════════

export function searchPatients(patients, searchTerm) {
  if (!searchTerm || !searchTerm.trim()) return patients;
  const term = searchTerm.toLowerCase().trim();
  return patients.filter(p =>
    p.name?.toLowerCase().includes(term) ||
    p.id?.toLowerCase().includes(term) ||
    p.email?.toLowerCase().includes(term) ||
    p.phone?.includes(term)
  );
}

// ════════════════════════════════════════════════════════════════════
// CONSULTATION HISTORY
// ════════════════════════════════════════════════════════════════════

export async function addConsultationToHistory(patientId, consultationRecord) {
  const record = {
    ...consultationRecord,
    patientId,
    savedAt: new Date().toISOString(),
  };

  // Local store
  if (!localConsultationHistory[patientId]) {
    localConsultationHistory[patientId] = [];
  }
  localConsultationHistory[patientId].unshift(record);

  // Also persist to Firestore if available
  if (isFirestoreAvailable()) {
    try {
      await addDoc(collection(db, 'consultationHistory'), {
        ...record,
        savedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Firestore consultation history save error:', e);
    }
  }

  return { success: true, record };
}

export async function getConsultationHistory(patientId) {
  // Try Firestore first
  if (isFirestoreAvailable()) {
    try {
      const q = query(
        collection(db, 'consultationHistory'),
        where('patientId', '==', patientId),
        orderBy('savedAt', 'desc'),
        limit(20)
      );
      const snapshot = await getDocs(q);
      const records = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      if (records.length > 0) {
        return { success: true, records, source: 'firestore' };
      }
    } catch (e) {
      console.warn('Firestore getHistory error:', e);
    }
  }

  // Fallback to local store
  const records = localConsultationHistory[patientId] || [];
  return { success: true, records, source: 'local' };
}

export function getAllConsultationHistory() {
  const allRecords = [];
  for (const patientId of Object.keys(localConsultationHistory)) {
    allRecords.push(...localConsultationHistory[patientId]);
  }
  allRecords.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
  return allRecords;
}
