from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any, List, Optional
from .. import database
from ..models import Consultation, TranscriptTurn, CaseSheetUpdateRequest, DoctorSignRequest

router = APIRouter()

@router.get("/", response_model=List[Dict[str, Any]], tags=["consultations"], summary="List all consultations")
def list_consultations():
    return database.list_consultations()

@router.get("/{consultation_id}", response_model=Dict[str, Any], tags=["consultations"], summary="Get consultation details")
def get_consultation(consultation_id: str):
    c = database.get_consultation(consultation_id)
    if not c:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return c

@router.post("/", response_model=Dict[str, Any], tags=["consultations"], summary="Create a new consultation")
def create_consultation(payload: Dict[str, Any] = Body(...)):
    # Minimal placeholder: forward to main logic could be replicated here if needed
    raise HTTPException(status_code=501, detail="Not implemented yet")
