# MedTrust AI - Clinical Telehealth & 17-Section AI Case Sheet Platform

MedTrust AI is a hospital-grade telehealth and academic clinical platform designed for senior physicians, medical students, and patients. It captures spoken consultations, normalizes speaker turns (Doctor, Student, Patient), uses dual-engine AI (Google Gemini AI + offline Clinical NLP engine) to synthesize an exhaustive 17-section clinical case sheet, supports legal electronic sign-off with SHA-256 audit-locking, and provides patient instructions in 6 Indian languages with native voice playback (TTS).

---

## Key Features

1. **Dual Video Telehealth & Google Meet Stage**:
   - WebRTC live camera/microphone preview with permission fallback.
   - Real-time Audio Waveform Visualizer (`AudioContext` & `AnalyserNode`) with dynamic decibel meter.
   - Google Meet Spaces API integration (`spaces/mt-xxxx-yyyy`), direct Meet links, and Google Calendar sync.
   - Call controls: Mute/Unmute, Camera On/Off, Screen Share, and Call Timer.

2. **Speech Recognition & Diarization**:
   - Live continuous Web Speech API listening.
   - Turn-taking diarization with color-coded speaker badges (`[Doctor]`, `[Medical Student]`, `[Patient]`).
   - 5 Realistic specialty clinical sample cases (Cardiology, Endocrinology, Pediatrics, Gastroenterology, Psychiatry) with live animated dialogue simulation.

3. **17-Section Clinical Case Sheet Studio**:
   - 1. Patient Info & Care Team
   - 2. Chief Complaint
   - 3. History of Present Illness (HPI)
   - 4. Symptoms Checklist with Clinical Severity (Mild, Moderate, Severe, Critical)
   - 5. Duration & Onset
   - 6. Past Medical History
   - 7. Current Medications (Interactive Dynamic Table with + Add Drug & Remove Row)
   - 8. Allergies & Adverse Reactions
   - 9. Family History
   - 10. Social / Occupational History
   - 11. Doctor Observations & Clinical Vitals (BP, Pulse, RR, Temp, SpO2, BMI)
   - 12. Recommended Investigations / Lab Tests
   - 13. Provisional Assessment & Differential Diagnoses (ICD-10)
   - 14. Comprehensive Treatment Plan & Prescriptions
   - 15. Scheduled Follow-up & Emergency Red Flags
   - 16. Missing / Incomplete Information (AI Flagged Clinical Gaps)
   - 17. Uncertain / Needs Clarification Information

4. **Doctor Sign-Off & Cryptographic Audit Lock**:
   - Clinical verification checklist.
   - Doctor credentials display (TNMC-84920, Senior Consultant).
   - HTML5 interactive digital signature pad (draw/clear).
   - Cryptographic SHA-256 audit hash stamp with immutability enforcement.
   - Print-ready hospital letterhead layout.

5. **Multilingual Voice Summaries (TTS) in 6 Indian Languages**:
   - English
   - Tamil (தமிழ்)
   - Hindi (हिन्दी)
   - Telugu (తెలుగు)
   - Malayalam (മലയാളം)
   - Kannada (ಕನ್ನಡ)
   - Web Speech Synthesis audio controls with Play, Pause, and Stop.

6. **Patient Management Hub**:
   - Searchable, filterable patient directory.
   - Register new patient modal with **automatic real-time DOB-to-Age calculator**.

7. **1-Click Multi-Role Switcher**:
   - Senior Doctor (`Dr. Rajesh Sharma, MD`)
   - Medical Student (`Sneha Patel, MBBS Intern`)
   - Patient (`Mr. K. Sundaram`)

---

## Running the Application

### 1. Launch Server
```powershell
python run_app.py
```
or on Windows:
```cmd
run_app.bat
```
or with npm:
```bash
npm start
```

### 2. Open in Browser
- **Web Application**: http://localhost:8000
- **Interactive OpenAPI Documentation**: http://localhost:8000/docs
- **System Health Check**: http://localhost:8000/health

---

## Automated Verification Suite

Run pytest to execute the full 7-test suite:
```powershell
python -m pytest tests/test_medtrust_clinical.py -v
```

Output:
```
tests/test_medtrust_clinical.py::test_calculate_age_accuracy PASSED      [ 14%]
tests/test_medtrust_clinical.py::test_google_meet_space_generation PASSED [ 28%]
tests/test_medtrust_clinical.py::test_offline_clinical_nlp_all_17_sections PASSED [ 42%]
tests/test_medtrust_clinical.py::test_multilingual_summaries_6_languages PASSED [ 57%]
tests/test_medtrust_clinical.py::test_patient_registration_api PASSED    [ 71%]
tests/test_medtrust_clinical.py::test_case_sheet_approval_lock_api PASSED [ 85%]
tests/test_medtrust_clinical.py::test_print_html_endpoint PASSED         [100%]
======================== 7 passed in 0.79s ========================
```
