import sqlite3
import json
import os
from datetime import datetime, date
from typing import List, Optional, Dict, Any

try:
    from .models import (
        User, Patient, Consultation, CaseSheet17Sections,
        DoctorApproval, MultilingualSummary, Role
    )
except ImportError:
    from backend.app.models import (
        User, Patient, Consultation, CaseSheet17Sections,
        DoctorApproval, MultilingualSummary, Role
    )

def get_db_path() -> str:
    """Resolve database path safely for local, containerized, and serverless (Vercel/AWS Lambda) environments."""
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        return "/tmp/medtrust.db"
    
    env_path = os.environ.get("DB_PATH")
    if env_path:
        return env_path
        
    local_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
    try:
        os.makedirs(local_dir, exist_ok=True)
        return os.path.join(local_dir, "medtrust.db")
    except (OSError, PermissionError):
        return "/tmp/medtrust.db"

DB_PATH = get_db_path()

def calculate_age(dob_str: str) -> int:
    """Calculate age accurately from DOB in YYYY-MM-DD or DD/MM/YYYY format."""
    try:
        if "/" in dob_str:
            parts = dob_str.strip().split("/")
            if len(parts[0]) == 4:
                birth_date = date(int(parts[0]), int(parts[1]), int(parts[2]))
            else:
                birth_date = date(int(parts[2]), int(parts[1]), int(parts[0]))
        else:
            birth_date = datetime.strptime(dob_str.strip(), "%Y-%m-%d").date()
        
        today = date.today()
        age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
        return max(0, age)
    except Exception:
        return 0

def get_db_connection():
    db_path = get_db_path()
    try:
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
    except Exception:
        pass
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        email TEXT NOT NULL,
        credentials TEXT,
        department TEXT,
        avatar TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        mrn TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        dob TEXT NOT NULL,
        age INTEGER NOT NULL,
        gender TEXT NOT NULL,
        blood_group TEXT NOT NULL,
        contact TEXT NOT NULL,
        allergies TEXT NOT NULL,
        chronic_conditions TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS consultations (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        patient_name TEXT NOT NULL,
        doctor_id TEXT NOT NULL,
        doctor_name TEXT NOT NULL,
        student_id TEXT,
        student_name TEXT,
        meet_space TEXT NOT NULL,
        meet_code TEXT NOT NULL,
        meet_url TEXT NOT NULL,
        calendar_link TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        transcript TEXT NOT NULL,
        case_sheet TEXT,
        doctor_approval TEXT,
        multilingual_summary TEXT
    )
    """)

    conn.commit()
    seed_initial_data(cursor, conn)
    conn.close()

def seed_initial_data(cursor, conn):
    # Check if users already seeded
    cursor.execute("SELECT count(*) as count FROM users")
    if cursor.fetchone()["count"] == 0:
        users = [
            ("doc-1", "Dr. Rajesh Sharma, MD", Role.DOCTOR, "dr.sharma@medtrust.org", "TNMC-84920 (Senior Consultant Physician)", "Cardiology & Internal Medicine", "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150"),
            ("stu-1", "Sneha Patel", Role.STUDENT, "sneha.patel@student.medtrust.org", "MBBS Intern (Class of 2026)", "Clinical Telehealth Observership", "https://images.unsplash.com/photo-1594824813681-364e03102fb2?w=150"),
            ("pat-1", "K. Sundaram", Role.PATIENT, "sundaram58@gmail.com", "Patient (MRN: MT-2026-0841)", "General Outpatient", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150")
        ]
        cursor.executemany("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)", users)

    # Check if patients already seeded
    cursor.execute("SELECT count(*) as count FROM patients")
    if cursor.fetchone()["count"] == 0:
        patients = [
            (
                "pat-1", "MT-2026-0841", "K. Sundaram", "1968-04-12", calculate_age("1968-04-12"),
                "Male", "O+", "+91 98401 23456",
                json.dumps(["Penicillin (Rash, Urticaria)"]),
                json.dumps(["Hypertension (8 yrs)", "Type 2 Diabetes (5 yrs)"]),
                datetime.now().isoformat()
            ),
            (
                "pat-2", "MT-2026-0842", "Ananya Sen", "1992-08-23", calculate_age("1992-08-23"),
                "Female", "B+", "+91 98200 45678",
                json.dumps(["Sulfa drugs (Facial edema)"]),
                json.dumps(["Bronchial Asthma (Since childhood)"]),
                datetime.now().isoformat()
            ),
            (
                "pat-3", "MT-2026-0843", "Master Aarav Sharma", "2020-02-14", calculate_age("2020-02-14"),
                "Male", "A+", "+91 97111 88990",
                json.dumps(["No known drug allergies"]),
                json.dumps(["Recurrent wheezing bronchitis"]),
                datetime.now().isoformat()
            ),
            (
                "pat-4", "MT-2026-0844", "Rameshwar Rao", "1955-11-05", calculate_age("1955-11-05"),
                "Male", "AB+", "+91 94440 11223",
                json.dumps(["Aspirin / NSAIDs (Severe epigastric pain)"]),
                json.dumps(["GERD", "Osteoarthritis of knees"]),
                datetime.now().isoformat()
            )
        ]
        cursor.executemany("INSERT INTO patients VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", patients)

    conn.commit()

# --- Patient Operations ---
def list_patients(search: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    if search:
        term = f"%{search}%"
        cursor.execute("SELECT * FROM patients WHERE name LIKE ? OR mrn LIKE ? OR contact LIKE ? ORDER BY name ASC", (term, term, term))
    else:
        cursor.execute("SELECT * FROM patients ORDER BY name ASC")
    rows = cursor.fetchall()
    conn.close()
    
    result = []
    for r in rows:
        d = dict(r)
        d["allergies"] = json.loads(d["allergies"])
        d["chronic_conditions"] = json.loads(d["chronic_conditions"])
        result.append(d)
    return result

def get_patient_by_id(patient_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM patients WHERE id = ? OR mrn = ?", (patient_id, patient_id))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d["allergies"] = json.loads(d["allergies"])
    d["chronic_conditions"] = json.loads(d["chronic_conditions"])
    return d

def create_patient(data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT count(*) as cnt FROM patients")
    count = cursor.fetchone()["cnt"] + 1
    mrn = f"MT-2026-{count:04d}"
    pid = f"pat-{count}"
    
    dob = data["dob"]
    age = calculate_age(dob)
    now = datetime.now().isoformat()
    allergies = json.dumps(data.get("allergies", []))
    chronic = json.dumps(data.get("chronic_conditions", []))
    
    cursor.execute("""
    INSERT INTO patients (id, mrn, name, dob, age, gender, blood_group, contact, allergies, chronic_conditions, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (pid, mrn, data["name"], dob, age, data["gender"], data["blood_group"], data["contact"], allergies, chronic, now))
    
    conn.commit()
    conn.close()
    return get_patient_by_id(pid)

# --- Consultation Operations ---
def get_consultation(consultation_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM consultations WHERE id = ?", (consultation_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d["transcript"] = json.loads(d["transcript"]) if d["transcript"] else []
    d["case_sheet"] = json.loads(d["case_sheet"]) if d["case_sheet"] else None
    d["doctor_approval"] = json.loads(d["doctor_approval"]) if d["doctor_approval"] else None
    d["multilingual_summary"] = json.loads(d["multilingual_summary"]) if d["multilingual_summary"] else None
    return d

def list_consultations() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM consultations ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    
    result = []
    for r in rows:
        d = dict(r)
        d["transcript"] = json.loads(d["transcript"]) if d["transcript"] else []
        d["case_sheet"] = json.loads(d["case_sheet"]) if d["case_sheet"] else None
        d["doctor_approval"] = json.loads(d["doctor_approval"]) if d["doctor_approval"] else None
        d["multilingual_summary"] = json.loads(d["multilingual_summary"]) if d["multilingual_summary"] else None
        result.append(d)
    return result

def save_consultation(c: Dict[str, Any]):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO consultations
    (id, patient_id, patient_name, doctor_id, doctor_name, student_id, student_name,
     meet_space, meet_code, meet_url, calendar_link, status, created_at,
     transcript, case_sheet, doctor_approval, multilingual_summary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        c["id"], c["patient_id"], c["patient_name"], c["doctor_id"], c["doctor_name"],
        c.get("student_id"), c.get("student_name"),
        c["meet_space"], c["meet_code"], c["meet_url"], c["calendar_link"],
        c["status"], c["created_at"],
        json.dumps(c.get("transcript", [])),
        json.dumps(c.get("case_sheet")) if c.get("case_sheet") else None,
        json.dumps(c.get("doctor_approval")) if c.get("doctor_approval") else None,
        json.dumps(c.get("multilingual_summary")) if c.get("multilingual_summary") else None,
    ))
    conn.commit()
    conn.close()

# --- Users ---
def get_user(user_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def list_users() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]
