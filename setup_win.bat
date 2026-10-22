@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title University Management System - Setup

echo ==========================================
echo   University Management System - Setup
echo ==========================================
echo.

:: 1. Check Prerequisites
echo [1/4] Checking Prerequisites...

python --version >nul 2>&1
if !errorlevel! neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    goto prerequisites_fail
)
:: Check Python Version (>= 3.10)
python -c "import sys; sys.exit(0 if sys.version_info >= (3,10) else 1)"
if !errorlevel! neq 0 (
    echo [WARNING] Python version might be older than 3.10. Recommended: 3.10+
)
echo   - Python found.

node --version >nul 2>&1
if !errorlevel! neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    goto prerequisites_fail
)
node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 24 ? 0 : 1)"
if !errorlevel! neq 0 (
    echo [ERROR] Node.js 24 or newer is required.
    goto prerequisites_fail
)
echo   - Node.js 24+ found.

:: 2. Backend Setup
echo.
echo [2/4] Setting up Backend...
if not exist backend (
    echo [ERROR] 'backend' folder not found! Are you in the right directory?
    goto fail
)
cd backend

if not exist venv (
    echo   - Creating virtual environment...
    python -m venv venv
    if !errorlevel! neq 0 goto fail
)

echo   - Activating virtual environment...
call venv\Scripts\activate

echo   - Installing dependencies (this may take a while)...
pip install -r requirements.txt
if !errorlevel! neq 0 goto fail

echo   - Running database migrations...
python manage.py migrate
if !errorlevel! neq 0 goto fail

echo   - Backend setup successful.

:: 3. Frontend Setup
echo.
echo [3/4] Setting up Frontend...
cd ..\frontend
echo   - Installing Node modules (this may take a while)...
call npm install
if !errorlevel! neq 0 goto fail
echo   - Frontend setup successful.

:: 4. Superuser Creation
echo.
echo [4/4] Finalizing Setup...
cd ..\backend
echo.
echo Do you want to create a superuser (admin) account now? (Y/N)
set /p create_admin="> "
if /i "%create_admin%"=="Y" (
    python manage.py createsuperuser
)

echo.
echo ==========================================
echo   Setup Complete!
echo.
echo   You can now start the application using:
echo   run_win.bat
echo ==========================================
pause
exit /b 0

:prerequisites_fail
echo.
echo Please install:
echo - Python 3.10+ (https://www.python.org/downloads/) - Check "Add Python to PATH"
echo - Node.js 24+ (https://nodejs.org/)
pause
exit /b 1

:fail
echo.
echo [ERROR] Setup failed! See error messages above.
pause
exit /b 1
