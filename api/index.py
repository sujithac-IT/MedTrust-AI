import os
import sys

# Add root and backend directories to sys.path so all imports work smoothly
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

backend_dir = os.path.join(root_dir, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

backend_app_dir = os.path.join(root_dir, "backend", "app")
if backend_app_dir not in sys.path:
    sys.path.insert(0, backend_app_dir)

# Import the FastAPI application
from backend.app.main import app
