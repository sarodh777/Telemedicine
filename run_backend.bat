@echo off
echo Starting TeleCare FastAPI Backend Server on port 8000...
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
pause

