import pytest
from datetime import date
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.database import calculate_age, init_db
from backend.app.meet_service import generate_meet_space, CLINICAL_SCENARIOS
from backend.app.ai_casesheet_service import (
    extract_casesheet_offline_nlp, generate_multilingual_summary
)

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_test_db():
    init_db()

def test_calculate_age_accuracy():
    # Test standard YYYY-MM-DD
    assert calculate_age("2000-01-01") >= 24
    assert calculate_age("1968-04-12") >= 56
    # Test today or future
    assert calculate_age(date.today().isoformat()) == 0
    # Test invalid string returns 0 safely
    assert calculate_age("invalid-date") == 0

def test_google_meet_space_generation():
    meet = generate_meet_space()
    assert "meet_space" in meet
    assert meet["meet_space"].startswith("spaces/mt-")
    assert "meet_code" in meet
    assert len(meet["meet_code"].split("-")) == 3
    assert "meet_url" in meet
    assert "https://meet.google.com/" in meet["meet_url"]
    assert "calendar_link" in meet
    assert "calendar.google.com" in meet["calendar_link"]

def test_offline_clinical_nlp_all_17_sections():
    scenario = CLINICAL_SCENARIOS["cardiology"]
    patient_info = {
        "mrn": "MT-2026-0841",
        "name": "K. Sundaram",
        "age": 58,
        "gender": "Male",
        "blood_group": "O+"
    }
    
    sheet = extract_casesheet_offline_nlp(scenario["transcript"], patient_info)
    
    # 1. Patient Info
    assert sheet.patient_info["name"] == "K. Sundaram"
    assert sheet.patient_info["mrn"] == "MT-2026-0841"
    # 2. Chief Complaint
    assert "chest tightness" in sheet.chief_complaint.lower() or "cough" in sheet.chief_complaint.lower()
    # 3. HPI
    assert len(sheet.hpi) > 20
    # 4. Symptoms Checklist
    assert len(sheet.symptoms) >= 1
    # 5. Duration & Onset
    assert "3 weeks" in sheet.duration_onset.lower() or "progressive" in sheet.duration_onset.lower()
    # 6. Past Medical History
    assert any("Hypertension" in x for x in sheet.past_medical_history)
    # 7. Current Medications
    assert any(m.drug.lower() in ["telmisartan", "sorbitrate", "aspirin", "atorvastatin", "enalapril"] for m in sheet.current_medications)
    # 8. Allergies & Adverse Reactions
    assert any("Penicillin" in a or "Enalapril" in a for a in sheet.allergies_adverse_reactions)
    # 9. Family History
    assert len(sheet.family_history) > 0
    # 10. Social / Occupational History
    assert len(sheet.social_occupational_history) > 0
    # 11. Doctor / Clinical Observations
    assert "blood_pressure" in sheet.doctor_observations
    # 12. Recommended Investigations
    assert any("ECG" in inv for inv in sheet.recommended_investigations)
    # 13. Provisional Assessment
    assert "Angina" in sheet.provisional_assessment or "I20" in sheet.provisional_assessment
    # 14. Treatment Plan
    assert len(sheet.treatment_plan) > 20
    # 15. Follow-up & Red Flags
    assert "scheduled_review" in sheet.follow_up_red_flags
    assert len(sheet.follow_up_red_flags["emergency_red_flags"]) >= 1
    # 16. Missing Information
    assert len(sheet.missing_information) >= 1
    # 17. Uncertain Information
    assert len(sheet.uncertain_information) >= 1

def test_multilingual_summaries_6_languages():
    scenario = CLINICAL_SCENARIOS["cardiology"]
    sheet = extract_casesheet_offline_nlp(scenario["transcript"])
    summary = generate_multilingual_summary(sheet)
    
    # Check all 6 Indian languages
    assert len(summary.english) > 10
    assert len(summary.tamil) > 10
    assert len(summary.hindi) > 10
    assert len(summary.telugu) > 10
    assert len(summary.malayalam) > 10
    assert len(summary.kannada) > 10
    
    # Verify non-English scripts present
    assert any(ord(c) >= 0x0B80 and ord(c) <= 0x0BFF for c in summary.tamil) # Tamil Unicode
    assert any(ord(c) >= 0x0900 and ord(c) <= 0x097F for c in summary.hindi) # Devanagari Unicode
    assert any(ord(c) >= 0x0C00 and ord(c) <= 0x0C7F for c in summary.telugu) # Telugu Unicode
    assert any(ord(c) >= 0x0D00 and ord(c) <= 0x0D7F for c in summary.malayalam) # Malayalam Unicode
    assert any(ord(c) >= 0x0C80 and ord(c) <= 0x0CFF for c in summary.kannada) # Kannada Unicode

def test_patient_registration_api():
    payload = {
        "name": "Lakshmi Narayanan",
        "dob": "1980-05-15",
        "gender": "Female",
        "blood_group": "A+",
        "contact": "+91 98410 99887",
        "allergies": ["Ciprofloxacin"],
        "chronic_conditions": ["Hypothyroidism"]
    }
    res = client.post("/api/patients", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Lakshmi Narayanan"
    assert data["mrn"].startswith("MT-2026-")
    assert data["age"] >= 43
    assert "Ciprofloxacin" in data["allergies"]

def test_case_sheet_approval_lock_api():
    # 1. Create a consultation
    c_res = client.post("/api/consultations", json={"patient_id": "pat-1"})
    assert c_res.status_code == 200
    cid = c_res.json()["id"]
    
    # 2. Load Cardiology scenario into it
    load_res = client.post(f"/api/scenarios/cardiology/load-into/{cid}")
    assert load_res.status_code == 200
    
    # 3. Generate case sheet
    gen_res = client.post(f"/api/consultations/{cid}/generate-casesheet")
    assert gen_res.status_code == 200
    
    # 4. Approve and lock as Doctor
    sign_payload = {
        "doctor_id": "doc-1",
        "doctor_name": "Dr. Rajesh Sharma, MD",
        "registration_no": "TNMC-84920",
        "department": "Cardiology & Internal Medicine",
        "signature_data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "verification_notes": "Clinical management verified in accordance with Apollo Telehealth guidelines."
    }
    app_res = client.post(f"/api/consultations/{cid}/approve", json=sign_payload)
    assert app_res.status_code == 200
    app_data = app_res.json()
    assert app_data["status"] == "approved_locked"
    assert app_data["audit_stamp"].startswith("sha256:")
    
    # 5. Subsequent edit attempt must be rejected with 403
    case_sheet_data = gen_res.json()["case_sheet"]
    case_sheet_data["chief_complaint"] = "Malicious unapproved edit"
    edit_res = client.put(f"/api/consultations/{cid}/casesheet", json={"case_sheet": case_sheet_data})
    assert edit_res.status_code == 403
    
    # 6. Subsequent re-approval must also be rejected
    re_app_res = client.post(f"/api/consultations/{cid}/approve", json=sign_payload)
    assert re_app_res.status_code == 400

def test_print_html_endpoint():
    # Fetch existing consultation or create one
    c_res = client.post("/api/consultations", json={"patient_id": "pat-1"})
    cid = c_res.json()["id"]
    client.post(f"/api/scenarios/cardiology/load-into/{cid}")
    client.post(f"/api/consultations/{cid}/generate-casesheet")
    
    print_res = client.get(f"/api/consultations/{cid}/print")
    assert print_res.status_code == 200
    html = print_res.text
    assert "APOLLO MEDTRUST UNIVERSITY TEACHING HOSPITAL" in html
    assert "Chief Complaint" in html
    assert "Current Medications" in html
