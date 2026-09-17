from fastapi import APIRouter, HTTPException
from typing import Dict, Any

router = APIRouter()

@router.get("/status")
def status():
    return {"router": "casesheets", "status": "ok"}

# Placeholder for case sheet related endpoints can be added here.
