# Windows Deployment Guide

Welcome to the **University Management System**! This guide will help you set up and run the application on your Windows machine easily.

## 🚀 The Easy Way (Automated)

We have included automated scripts to handle everything for you.

### 1. Prerequisites

Before starting, ensure you have the following installed:

- **Python 3.10+**: [Download Here](https://www.python.org/downloads/)
  ⚠️ **Important**: Check the box **"Add Python to PATH"** during installation.
- **Node.js 24+**: [Download Here](https://nodejs.org/) (LTS version recommended)

### 2. Setup (Run Once)

1.  Open the project folder.
2.  Double-click **`setup_win.bat`**.
3.  The script will:
    - Create a virtual environment.
    - Install all dependencies.
    - Set up the database.
    - Ask if you want to create an admin account (Type `Y` and follow prompts).

### 3. Run the App

1.  Double-click **`run_win.bat`**.
2.  Wait a few seconds.
3.  Your browser will open automatically at `http://localhost:5173`.
4.  Two black terminal windows will open in the background (Backend and Frontend). **Do not close these windows** while using the app.

---

## 📦 How to Transfer to Another Machine

If you are sending this project to someone else:

1.  **Zip the entire project folder**, BUT...
2.  **Exclude/Delete** these hefty folders first (they will be recreated by the setup script):
    - `backend/venv`
    - `backend/__pycache__`
    - `frontend/node_modules`
3.  Send the zip file.
4.  The recipient should extract it and follow the **"The Easy Way"** instructions above.

---

## 🛠 Manual Setup (If scripts fail)

<details>
<summary>Click to view manual instructions</summary>

### 1. Backend

Open Command Prompt in `backend` folder:

```cmd
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
set DJANGO_ENV=development
python manage.py runserver
```

### 2. Frontend

Open Command Prompt in `frontend` folder:

```cmd
npm install
npm run dev
```

</details>

## ❓ Troubleshooting

- **"Python is not recognized..."**
  Reinstall Python and make sure to check **"Add Python to PATH"**.

- **"npm is not recognized..."**
  Install Node.js from the link above.

- **"Script closes immediately with error"**
  Right-click the `.bat` file and select "Run as Administrator" if you suspect permission issues, but usually standard double-click works.

- **Browser shows "Site can't be reached"**
  Wait a few more seconds. The servers take a moment to start up initially.
