import uvicorn
import os
import sys

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"============================================================")
    print(f"  MedTrust AI Telehealth & 17-Section Case Sheet Platform  ")
    print(f"============================================================")
    print(f"  Web Application:   http://localhost:{port}")
    print(f"  API Documentation: http://localhost:{port}/docs")
    print(f"  Health Check:      http://localhost:{port}/health")
    print(f"============================================================")
    uvicorn.run("backend.app.main:app", host=host, port=port, reload=False)
