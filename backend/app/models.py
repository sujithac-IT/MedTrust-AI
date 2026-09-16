from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date

class Role:
    DOCTOR = "doctor"
    STUDENT = "student"
    PATIENT = "patient"

class User(BaseModel):
    id: str
    name: str
    role: str  # doctor, student, patient
    email: str
    credentials: Optional[str] = None
    department: Optional[str] = None
    avatar: Optional[str] = None

class Patient(BaseModel):
    id: str
    mrn: str
    name: str
    dob: str
    age: int
    gender: str
    blood_group: str
    contact: str
    allergies: List[str] = Field(default_factory=list)
    chronic_conditions: List[str] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())

class PatientCreate(BaseModel):
    name: str
    dob: str
    gender: str
    blood_group: str
    contact: str
    allergies: List[str] = Field(default_factory=list)
    chronic_conditions: List[str] = Field(default_factory=list)

class TranscriptTurn(BaseModel):
    id: Optional[str] = None
    speaker: str  # 'doctor' | 'student' | 'patient'
    speaker_name: Optional[str] = None
    timestamp: str
    text: str
    confidence: float = 0.98

class MedicationItem(BaseModel):
    drug: str
    dosage: str
    frequency: str
    route: str = "Oral"
    duration: str
    instructions: str = "After meals"

class SymptomItem(BaseModel):
    symptom: str
    severity: str  # Mild, Moderate, Severe, Critical
    onset: Optional[str] = None

class CaseSheet17Sections(BaseModel):
    # 1. Patient Info
    patient_info: Dict[str, Any] = Field(default_factory=dict)
    # 2. Chief Complaint
    chief_complaint: str = ""
    # 3. History of Present Illness (HPI)
    hpi: str = ""
    # 4. Symptoms Checklist & Severity
    symptoms: List[SymptomItem] = Field(default_factory=list)
    # 5. Duration & Onset
    duration_onset: str = ""
    # 6. Past Medical History
    past_medical_history: List[str] = Field(default_factory=list)
    # 7. Current Medications (structured list)
    current_medications: List[MedicationItem] = Field(default_factory=list)
    # 8. Allergies & Adverse Reactions
    allergies_adverse_reactions: List[str] = Field(default_factory=list)
    # 9. Family History
    family_history: List[str] = Field(default_factory=list)
    # 10. Social / Occupational History
    social_occupational_history: str = ""
    # 11. Doctor / Clinical Observations & Vitals
    doctor_observations: Dict[str, Any] = Field(default_factory=dict)
    # 12. Recommended Investigations / Lab Tests
    recommended_investigations: List[str] = Field(default_factory=list)
    # 13. Provisional Assessment / Clinical Impression (ICD-10)
    provisional_assessment: str = ""
    # 14. Treatment Plan & Prescriptions
    treatment_plan: str = ""
    # 15. Follow-up & Red Flags
    follow_up_red_flags: Dict[str, Any] = Field(default_factory=dict)
    # 16. Missing / Incomplete Information
    missing_information: List[str] = Field(default_factory=list)
    # 17. Uncertain / Needs Clarification
    uncertain_information: List[str] = Field(default_factory=list)

class DoctorApproval(BaseModel):
    doctor_id: str
    doctor_name: str
    registration_no: str
    department: str
    hospital: str = "Apollo MedTrust University Teaching Hospital"
    signature_data_url: str
    verification_notes: Optional[str] = None
    approved_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    sha256_audit_stamp: str

class MultilingualSummary(BaseModel):
    english: str
    tamil: str
    hindi: str
    telugu: str
    malayalam: str
    kannada: str

class Consultation(BaseModel):
    id: str
    patient_id: str
    patient_name: str
    doctor_id: str
    doctor_name: str
    student_id: Optional[str] = None
    student_name: Optional[str] = None
    meet_space: str
    meet_code: str
    meet_url: str
    calendar_link: str
    status: str = "in_progress"  # in_progress, completed, approved_locked
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    transcript: List[TranscriptTurn] = Field(default_factory=list)
    case_sheet: Optional[CaseSheet17Sections] = None
    doctor_approval: Optional[DoctorApproval] = None
    multilingual_summary: Optional[MultilingualSummary] = None

class CaseSheetUpdateRequest(BaseModel):
    case_sheet: CaseSheet17Sections

class DoctorSignRequest(BaseModel):
    doctor_id: str
    doctor_name: str
    registration_no: str
    department: str
    signature_data_url: str
    verification_notes: Optional[str] = None
