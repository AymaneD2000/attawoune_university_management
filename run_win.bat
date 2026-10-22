@echo off
setlocal
cd /d "%~dp0"
title University Management System - Runner

echo ==========================================
echo   University Management System - Runner
echo ==========================================
echo.

:: Check environment
if not exist backend\venv (
    echo [ERROR] Virtual environment not found!
    echo Please run 'setup_win.bat' first.
    pause
    exit /b 1
)

echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && venv\Scripts\activate && set DJANGO_ENV=development && python manage.py runserver"

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm run dev -- --host 0.0.0.0"

echo.
echo Waiting for servers to initialize...
timeout /t 5 >nul

echo.
echo System is starting!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Opening browser...
start http://localhost:5173

echo.
echo ==========================================
echo   Servers are running in background windows.
echo   Type 'exit' to close this window (servers will keep running).
echo ==========================================
pause
