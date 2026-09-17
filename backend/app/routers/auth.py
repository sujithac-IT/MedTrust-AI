from fastapi import APIRouter

router = APIRouter()

@router.get("/status")
def status():
    return {"router": "auth", "status": "ok"}
