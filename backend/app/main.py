import os
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query, Body, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse

try:
    from .models import (
        Patient, PatientCreate, Consultation, CaseSheet17Sections,
        DoctorApproval, DoctorSignRequest, TranscriptTurn, CaseSheetUpdateRequest
    )
    from .database import (
        init_db, list_patients, get_patient_by_id, create_patient,
        get_consultation, list_consultations, save_consultation,
        list_users, get_user, calculate_age
    )
    from .meet_service import generate_meet_space, CLINICAL_SCENARIOS
    from .ai_casesheet_service import (
        generate_casesheet, generate_multilingual_summary, compute_audit_hash
    )
except ImportError:
    from backend.app.models import (
        Patient, PatientCreate, Consultation, CaseSheet17Sections,
        DoctorApproval, DoctorSignRequest, TranscriptTurn, CaseSheetUpdateRequest
    )
    from backend.app.database import (
        init_db, list_patients, get_patient_by_id, create_patient,
        get_consultation, list_consultations, save_consultation,
        list_users, get_user, calculate_age
    )
    from backend.app.meet_service import generate_meet_space, CLINICAL_SCENARIOS
    from backend.app.ai_casesheet_service import (
        generate_casesheet, generate_multilingual_summary, compute_audit_hash
    )

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="MedTrust AI Telehealth & 17-Section Clinical Case Sheet Platform",
    description="Hospital Telehealth and Academic Clinical Documentation API with Dual-Engine AI and 6 Indian Language Summaries",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active WebSocket connections for live consultation rooms
active_connections: Dict[str, List[WebSocket]] = {}

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "app": "MedTrust AI",
        "version": "1.0.0",
        "engine": "Dual-Engine (Gemini AI + Offline Clinical NLP)",
        "timestamp": datetime.now().isoformat()
    }

# --- Auth & Users ---
@app.get("/api/auth/users")
def get_all_users():
    return list_users()

@app.get("/api/auth/users/{user_id}")
def get_user_profile(user_id: str):
    u = get_user(user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return u

# --- Patients API ---
@app.get("/api/patients")
def get_patients(search: Optional[str] = None):
    return list_patients(search)

@app.get("/api/patients/{patient_id}")
def get_patient(patient_id: str):
    p = get_patient_by_id(patient_id)
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    return p

@app.post("/api/patients")
def register_patient(payload: PatientCreate):
    created = create_patient(payload.model_dump())
    return created

# --- Consultations API ---
@app.get("/api/consultations")
def get_consultations():
    return list_consultations()

@app.post("/api/consultations")
def create_new_consultation(
    patient_id: str = Body(..., embed=True),
    doctor_id: str = Body(default="doc-1", embed=True),
    student_id: Optional[str] = Body(default="stu-1", embed=True)
):
    patient = get_patient_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    doctor = get_user(doctor_id) or {"name": "Dr. Rajesh Sharma, MD"}
    student = get_user(student_id) if student_id else None
    
    meet_info = generate_meet_space()
    cid = f"cons-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    consultation = {
        "id": cid,
        "patient_id": patient["id"],
        "patient_name": patient["name"],
        "doctor_id": doctor_id,
        "doctor_name": doctor["name"],
        "student_id": student["id"] if student else None,
        "student_name": student["name"] if student else None,
        "meet_space": meet_info["meet_space"],
        "meet_code": meet_info["meet_code"],
        "meet_url": meet_info["meet_url"],
        "calendar_link": meet_info["calendar_link"],
        "status": "in_progress",
        "created_at": datetime.now().isoformat(),
        "transcript": [],
        "case_sheet": None,
        "doctor_approval": None,
        "multilingual_summary": None
    }
    save_consultation(consultation)
    return consultation

@app.get("/api/consultations/{consultation_id}")
def get_consultation_details(consultation_id: str):
    c = get_consultation(consultation_id)
    if not c:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return c

@app.post("/api/consultations/{consultation_id}/transcript")
async def add_transcript_turn(consultation_id: str, turn: TranscriptTurn):
    c = get_consultation(consultation_id)
    if not c:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    turn_dict = turn.model_dump()
    if not turn_dict.get("id"):
        turn_dict["id"] = f"turn-{len(c['transcript']) + 1}"
    c["transcript"].append(turn_dict)
    save_consultation(c)
    
    # Broadcast to live WebSockets if any
    if consultation_id in active_connections:
        for ws in active_connections[consultation_id]:
            try:
                await ws.send_text(json.dumps({"type": "turn", "data": turn_dict}))
            except Exception:
                pass
                
    return {"status": "turn_added", "turn": turn_dict}

# --- AI Case Sheet Generation & Editing ---
@app.post("/api/consultations/{consultation_id}/generate-casesheet")
def generate_ai_casesheet(consultation_id: str, api_key: Optional[str] = None):
    c = get_consultation(consultation_id)
    if not c:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    if c.get("status") == "approved_locked":
        raise HTTPException(status_code=400, detail="Case sheet is approved and locked. Modifications are forbidden.")
    
    patient = get_patient_by_id(c["patient_id"])
    sheet = generate_casesheet(c["transcript"], patient, api_key=api_key)
    multi_sum = generate_multilingual_summary(sheet)
    
    c["case_sheet"] = sheet.model_dump()
    c["multilingual_summary"] = multi_sum.model_dump()
    save_consultation(c)
    
    return {
        "case_sheet": sheet,
        "multilingual_summary": multi_sum
    }

@app.put("/api/consultations/{consultation_id}/casesheet")
def update_casesheet(consultation_id: str, payload: CaseSheetUpdateRequest):
    c = get_consultation(consultation_id)
    if not c:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    if c.get("status") == "approved_locked":
        raise HTTPException(status_code=403, detail="Cannot edit locked case sheet. Record has been signed by attending doctor.")
    
    c["case_sheet"] = payload.case_sheet.model_dump()
    # Regenerate multilingual summary based on updated sheet
    c["multilingual_summary"] = generate_multilingual_summary(payload.case_sheet).model_dump()
    save_consultation(c)
    return {"status": "updated", "case_sheet": c["case_sheet"]}

@app.post("/api/consultations/{consultation_id}/approve")
def approve_casesheet(consultation_id: str, payload: DoctorSignRequest):
    c = get_consultation(consultation_id)
    if not c:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    if c.get("status") == "approved_locked":
        raise HTTPException(status_code=400, detail="Consultation is already locked and approved.")
    
    if not c.get("case_sheet"):
        raise HTTPException(status_code=400, detail="Case sheet must be generated before doctor sign-off.")
    
    now = datetime.now().isoformat()
    # Generate cryptographic audit hash from case sheet content and doctor credentials
    audit_data = f"{json.dumps(c['case_sheet'], sort_keys=True)}|{payload.doctor_id}|{payload.registration_no}|{now}"
    audit_hash = compute_audit_hash(audit_data)
    
    approval = DoctorApproval(
        doctor_id=payload.doctor_id,
        doctor_name=payload.doctor_name,
        registration_no=payload.registration_no,
        department=payload.department,
        hospital="Apollo MedTrust University Teaching Hospital",
        signature_data_url=payload.signature_data_url,
        verification_notes=payload.verification_notes or "Electronically verified & counter-signed by Attending Physician.",
        approved_at=now,
        sha256_audit_stamp=audit_hash
    )
    
    c["doctor_approval"] = approval.model_dump()
    c["status"] = "approved_locked"
    save_consultation(c)
    
    return {
        "status": "approved_locked",
        "doctor_approval": approval,
        "audit_stamp": audit_hash
    }

# --- Scenarios API ---
@app.get("/api/scenarios")
def get_scenarios():
    return {
        k: {
            "key": k,
            "title": v["title"],
            "chief_complaint": v["chief_complaint"],
            "patient_id": v["patient_id"],
            "turn_count": len(v["transcript"])
        }
        for k, v in CLINICAL_SCENARIOS.items()
    }

@app.post("/api/scenarios/{scenario_key}/load-into/{consultation_id}")
def load_scenario_into_consultation(scenario_key: str, consultation_id: str):
    if scenario_key not in CLINICAL_SCENARIOS:
        raise HTTPException(status_code=404, detail="Scenario key not found")
    c = get_consultation(consultation_id)
    if not c:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    scenario = CLINICAL_SCENARIOS[scenario_key]
    c["transcript"] = [dict(t) for t in scenario["transcript"]]
    # If scenario has corresponding patient, link it
    p = get_patient_by_id(scenario["patient_id"])
    if p:
        c["patient_id"] = p["id"]
        c["patient_name"] = p["name"]
        
    save_consultation(c)
    return {"status": "loaded", "turns": len(c["transcript"]), "consultation": c}

# --- Print / PDF HTML Layout ---
@app.get("/api/consultations/{consultation_id}/print")
def print_casesheet(consultation_id: str):
    c = get_consultation(consultation_id)
    if not c or not c.get("case_sheet"):
        raise HTTPException(status_code=404, detail="Approved case sheet not found")
    
    cs = c["case_sheet"]
    p_info = cs.get("patient_info", {})
    meds = cs.get("current_medications", [])
    syms = cs.get("symptoms", [])
    vitals = cs.get("doctor_observations", {})
    approval = c.get("doctor_approval") or {}
    
    meds_rows = "".join([
        f"<tr><td><strong>{m.get('drug')}</strong></td><td>{m.get('dosage')}</td><td>{m.get('frequency')}</td><td>{m.get('route')}</td><td>{m.get('duration')}</td><td>{m.get('instructions')}</td></tr>"
        for m in meds
    ])
    
    syms_list = "".join([
        f"<span class='badge badge-severity'>{s.get('symptom')} ({s.get('severity')})</span>"
        for s in syms
    ])
    
    inv_list = "".join([f"<li>{item}</li>" for item in cs.get("recommended_investigations", [])])
    missing_list = "".join([f"<li>{item}</li>" for item in cs.get("missing_information", [])])
    uncertain_list = "".join([f"<li>{item}</li>" for item in cs.get("uncertain_information", [])])
    
    sig_img = ""
    if approval and approval.get("signature_data_url"):
        sig_img = f"<img src='{approval['signature_data_url']}' style='max-height: 60px; display: block;' alt='Doctor Signature' />"
    
    audit_badge = ""
    if approval and approval.get("sha256_audit_stamp"):
        audit_badge = f"""
        <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 6px; padding: 10px; margin-top: 15px; font-family: monospace; font-size: 11px;">
            <strong>CRYPTOGRAPHIC AUDIT LOCK:</strong> {approval['sha256_audit_stamp']}<br>
            <strong>VERIFIED AT:</strong> {approval.get('approved_at')}<br>
            <strong>PHYSICIAN:</strong> {approval.get('doctor_name')} ({approval.get('registration_no')}) - {approval.get('department')}
        </div>
        """

    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Clinical Case Sheet - {p_info.get('name', 'Patient')} ({p_info.get('mrn', 'MRN')})</title>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #1e293b; font-size: 13px; line-height: 1.5; }}
            .header {{ display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f766e; padding-bottom: 12px; margin-bottom: 20px; }}
            .hospital-name {{ font-size: 20px; font-weight: 800; color: #0f766e; }}
            .sub-title {{ font-size: 11px; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; }}
            .mrn-box {{ text-align: right; font-size: 12px; }}
            .barcode {{ font-family: monospace; font-size: 16px; letter-spacing: 4px; background: #f1f5f9; padding: 4px 8px; border-radius: 4px; }}
            .section-title {{ font-size: 13px; font-weight: 700; color: #0f766e; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 18px; margin-bottom: 8px; text-transform: uppercase; }}
            .grid-2 {{ display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }}
            .grid-3 {{ display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }}
            .info-card {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 8px; }}
            th, td {{ border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; font-size: 12px; }}
            th {{ background: #f1f5f9; color: #334155; font-weight: 600; }}
            .badge {{ display: inline-block; padding: 2px 8px; border-radius: 4px; margin-right: 6px; margin-bottom: 4px; font-size: 11px; background: #e0f2fe; color: #0369a1; }}
            .badge-severity {{ background: #fee2e2; color: #991b1b; }}
            .sign-box {{ margin-top: 30px; border-top: 1px dashed #94a3b8; padding-top: 15px; display: flex; justify-content: space-between; align-items: flex-end; }}
            @media print {{
                body {{ margin: 15mm; }}
                button {{ display: none; }}
            }}
        </style>
    </head>
    <body>
        <div style="margin-bottom: 15px;">
            <button onclick="window.print()" style="background: #0f766e; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer;">Print / Save as PDF</button>
        </div>
        <div class="header">
            <div>
                <div class="hospital-name">APOLLO MEDTRUST UNIVERSITY TEACHING HOSPITAL</div>
                <div class="sub-title">Clinical Telehealth Services & Medical Case Documentation Division</div>
            </div>
            <div class="mrn-box">
                <div class="barcode">*{p_info.get('mrn', 'MT-2026')}*</div>
                <div style="margin-top: 4px;"><strong>MRN:</strong> {p_info.get('mrn', 'N/A')}</div>
                <div><strong>Date:</strong> {c.get('created_at', '')[:10]}</div>
            </div>
        </div>

        <div class="grid-3 info-card">
            <div><strong>Patient Name:</strong> {p_info.get('name')}</div>
            <div><strong>Age / Gender:</strong> {p_info.get('age')} yrs / {p_info.get('gender')}</div>
            <div><strong>Blood Group:</strong> {p_info.get('blood_group')}</div>
            <div><strong>Attending Doctor:</strong> {p_info.get('attending_physician')}</div>
            <div><strong>Clinical Intern:</strong> {p_info.get('clinical_intern')}</div>
            <div><strong>Status:</strong> <span style="color: green; font-weight: bold;">{c.get('status', '').upper()}</span></div>
        </div>

        <div class="section-title">1. Chief Complaint & 2. Duration</div>
        <div class="info-card">
            <strong>Complaint:</strong> {cs.get('chief_complaint')}<br>
            <strong>Onset / Duration:</strong> {cs.get('duration_onset')}
        </div>

        <div class="section-title">3. History of Present Illness (HPI)</div>
        <p>{cs.get('hpi')}</p>

        <div class="section-title">4. Symptoms & Severity</div>
        <div>{syms_list}</div>

        <div class="grid-2">
            <div>
                <div class="section-title">5. Past Medical History</div>
                <ul>{"".join([f"<li>{x}</li>" for x in cs.get('past_medical_history', [])])}</ul>
            </div>
            <div>
                <div class="section-title">6. Allergies & Adverse Reactions</div>
                <ul>{"".join([f"<li style='color:#b91c1c;'><strong>{x}</strong></li>" for x in cs.get('allergies_adverse_reactions', [])])}</ul>
            </div>
        </div>

        <div class="section-title">7. Current Medications & Prescriptions</div>
        <table>
            <thead><tr><th>Drug Name</th><th>Dosage</th><th>Frequency</th><th>Route</th><th>Duration</th><th>Instructions</th></tr></thead>
            <tbody>{meds_rows}</tbody>
        </table>

        <div class="grid-2">
            <div>
                <div class="section-title">8. Doctor Observations & Vitals</div>
                <div class="info-card">
                    <strong>BP:</strong> {vitals.get('blood_pressure', 'N/A')} | <strong>Pulse:</strong> {vitals.get('pulse_rate', 'N/A')}<br>
                    <strong>RR:</strong> {vitals.get('respiratory_rate', 'N/A')} | <strong>Temp:</strong> {vitals.get('temperature', 'N/A')}<br>
                    <strong>SpO2:</strong> {vitals.get('spo2', 'N/A')} | <strong>BMI:</strong> {vitals.get('bmi', 'N/A')}<br>
                    <strong>Exam:</strong> {vitals.get('systemic_examination', 'N/A')}
                </div>
            </div>
            <div>
                <div class="section-title">9. Recommended Investigations</div>
                <ul>{inv_list}</ul>
            </div>
        </div>

        <div class="section-title">10. Provisional Assessment (ICD-10)</div>
        <p style="white-space: pre-line; background: #f0fdf4; border-left: 4px solid #16a34a; padding: 10px;">{cs.get('provisional_assessment')}</p>

        <div class="section-title">11. Comprehensive Treatment Plan</div>
        <p style="white-space: pre-line;">{cs.get('treatment_plan')}</p>

        <div class="grid-2">
            <div>
                <div class="section-title">12. Scheduled Follow-up & Red Flags</div>
                <div class="info-card">
                    <strong>Review:</strong> {cs.get('follow_up_red_flags', {}).get('scheduled_review', 'N/A')}<br>
                    <strong>Red Flags:</strong>
                    <ul style="color: #991b1b; margin: 4px 0 0 16px;">
                        {"".join([f"<li>{rf}</li>" for rf in cs.get('follow_up_red_flags', {}).get('emergency_red_flags', [])])}
                    </ul>
                </div>
            </div>
            <div>
                <div class="section-title">13. Clinical Gaps & Uncertainties</div>
                <div class="info-card">
                    <strong>Missing Parameters:</strong>
                    <ul style="margin: 4px 0 0 16px;">{missing_list}</ul>
                    <strong>Needs Clarification:</strong>
                    <ul style="margin: 4px 0 0 16px;">{uncertain_list}</ul>
                </div>
            </div>
        </div>

        <div class="sign-box">
            <div>
                <div><strong>Patient Acknowledgment:</strong> Record reviewed and explained</div>
                <div style="font-size: 11px; color: #64748b;">Apollo MedTrust University Teaching Hospital EMR System</div>
            </div>
            <div style="text-align: right;">
                {sig_img}
                <div><strong>{approval.get('doctor_name', 'Attending Physician')}</strong></div>
                <div style="font-size: 11px;">{approval.get('department', 'Department of Medicine')}</div>
                <div style="font-size: 11px; color: #64748b;">Reg No: {approval.get('registration_no', 'TNMC-84920')}</div>
            </div>
        </div>

        {audit_badge}
    </body>
    </html>
    """
    return HTMLResponse(content=html)

# --- WebSocket for Live Consultation ---
@app.websocket("/ws/live-consultation/{consultation_id}")
async def websocket_consultation(websocket: WebSocket, consultation_id: str):
    await websocket.accept()
    if consultation_id not in active_connections:
        active_connections[consultation_id] = []
    active_connections[consultation_id].append(websocket)
    
    try:
        while True:
            data_text = await websocket.receive_text()
            data = json.loads(data_text)
            # If a new turn was sent over WebSocket, record and broadcast
            if data.get("type") == "turn":
                turn_data = data.get("data", {})
                c = get_consultation(consultation_id)
                if c:
                    if not turn_data.get("id"):
                        turn_data["id"] = f"turn-{len(c['transcript']) + 1}"
                    c["transcript"].append(turn_data)
                    save_consultation(c)
                
                # Broadcast to other participants
                for conn in active_connections.get(consultation_id, []):
                    if conn != websocket:
                        await conn.send_text(json.dumps({"type": "turn", "data": turn_data}))
                        
    except WebSocketDisconnect:
        if consultation_id in active_connections and websocket in active_connections[consultation_id]:
            active_connections[consultation_id].remove(websocket)

# --- Mount Frontend Static Files ---
frontend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend"))
if os.path.exists(frontend_path):
    app.mount("/static", StaticFiles(directory=frontend_path), name="static")

@app.get("/")
def serve_index():
    index_file = os.path.join(frontend_path, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return HTMLResponse("<h1>MedTrust AI Backend Active</h1><p>Frontend file not found.</p>")

@app.get("/{full_path:path}")
def catch_all(full_path: str):
    requested = os.path.join(frontend_path, full_path)
    if os.path.exists(requested) and not os.path.isdir(requested):
        return FileResponse(requested)
    # SPA fallback
    index_file = os.path.join(frontend_path, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    raise HTTPException(status_code=404, detail="File not found")
