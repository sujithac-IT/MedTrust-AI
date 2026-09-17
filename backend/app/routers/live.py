from fastapi import APIRouter

router = APIRouter()

@router.get("/status")
def status():
    return {"router": "live", "status": "ok"}

# Placeholder for live consultation WebSocket routes can be added here if needed.
