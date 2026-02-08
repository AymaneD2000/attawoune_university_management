@echo off
echo ==========================================
echo   University Management System - Runner
echo ==========================================

echo Starting Backend...
start cmd /k "cd backend && venv\Scripts\activate && python manage.py runserver"

echo Starting Frontend...
start cmd /k "cd frontend && npm start"

echo.
echo System is starting!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Close this window to stop (servers will keep running in their own windows).
pause
