@echo off
echo =========================================================
echo   Starting TeleCare Telemedicine Platform
echo =========================================================
echo.
echo 1. Launching Backend Server on http://localhost:8000
start "TeleCare Backend" cmd /k "python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload"

echo 2. Launching Frontend Server on http://localhost:5173
start "TeleCare Frontend" cmd /k "cd frontend && npm run dev -- --host 0.0.0.0 --port 5173"

echo.
echo Both servers launched in separate windows!
echo Open your browser at: http://localhost:5173
echo API Documentation at: http://localhost:8000/docs
echo.
pause

