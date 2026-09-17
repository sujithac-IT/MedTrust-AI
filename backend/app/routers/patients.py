from fastapi import APIRouter, HTTPException, Body
from typing import Optional, List, Dict, Any
from . import database
from ..models import PatientCreate

router = APIRouter()

@router.get("/",
    response_model=List[Dict[str, Any]],
    tags=["patients"],
    summary="List patients with optional search"
)
def list_patients(search: Optional[str] = None):
    return database.list_patients(search)

@router.get("/{patient_id}",
    response_model=Dict[str, Any],
    tags=["patients"],
    summary="Get patient details by ID or MRN"
)
def get_patient(patient_id: str):
    p = database.get_patient_by_id(patient_id)
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    return p

@router.post("/",
    response_model=Dict[str, Any],
    tags=["patients"],
    summary="Register a new patient"
)
def register_patient(payload: PatientCreate = Body(...)):
    return database.create_patient(payload.model_dump())
