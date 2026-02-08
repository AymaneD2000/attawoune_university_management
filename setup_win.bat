@echo off
echo ==========================================
echo   University Management System - Setup
echo ==========================================

echo.
echo [1/3] Setting up Backend...
cd backend
if not exist venv (
    python -m venv venv
)
call venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
echo Backend setup complete.

echo.
echo [2/3] Setting up Frontend...
cd ..\frontend
call npm install
echo Frontend setup complete.

echo.
echo [3/3] Creating Superuser...
cd ..\backend
echo You will now be prompted to create an administrator account.
python manage.py createsuperuser

echo.
echo ==========================================
echo   Setup Complete! Use run_win.bat to start.
echo ==========================================
pause
