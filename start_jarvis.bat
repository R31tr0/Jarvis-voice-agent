@echo off
setlocal enabledelayedexpansion

:: Определяем корень (папка Jarvis-voice-agent-main)
set "ROOT_DIR=%~dp0"
set "VENV_DIR=%ROOT_DIR%.venv"
set "SERVER_DIR=%ROOT_DIR%jarvis-voice-server"
set "FRONTEND_DIR=%ROOT_DIR%mark-2"
cd /d "%ROOT_DIR%"

echo ========================================
echo   J.A.R.V.I.S. MARK 3.6: FIXED PATHS
echo ========================================

:: 1. BACKEND STARTUP
echo [1/2] Checking Server...

:: Find a real Python installation. The Windows Store alias is not sufficient.
set "PYTHON_CMD="
where py >nul 2>&1
if not errorlevel 1 (
    py -3 -c "import sys" >nul 2>&1
    if not errorlevel 1 set "PYTHON_CMD=py -3"
) else (
    where python >nul 2>&1
    if not errorlevel 1 (
        python -c "import sys" >nul 2>&1
        if not errorlevel 1 set "PYTHON_CMD=python"
    )
)

if not defined PYTHON_CMD (
    echo [!] Python 3 was not found. Installing it automatically...
    where winget >nul 2>&1
    if errorlevel 1 (
        echo [!] winget is not available. Install Python 3 manually and run this file again.
        pause
        exit /b 1
    )
    winget install --id Python.Python.3.12 --exact --source winget --silent --accept-source-agreements --accept-package-agreements
    if errorlevel 1 (
        echo [!] Python installation failed or was cancelled.
        pause
        exit /b 1
    )

    :: Locate the newly installed interpreter even if PATH was not refreshed.
    for /f "usebackq delims=" %%P in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$roots=@($env:LOCALAPPDATA + '\Programs\Python',(Join-Path $env:ProgramFiles 'Python*')); $p=Get-ChildItem -Path $roots -Filter python.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName; if ($p) { $p }"`) do set PYTHON_CMD="%%P"
    if not defined PYTHON_CMD (
        echo [!] Python was installed but could not be located. Restart Windows and run this file again.
        pause
        exit /b 1
    )
)

:: Проверяем наличие .venv в корне
if not exist "%VENV_DIR%\Scripts\python.exe" (
    echo [!] .venv not found in root. Creating...
    %PYTHON_CMD% -m venv "%VENV_DIR%"
    if errorlevel 1 (
        echo [!] Failed to create the virtual environment.
        pause
        exit /b 1
    )
)

:: Установка зависимостей через .venv в корне
echo [*] Installing requirements into root .venv...
"%VENV_DIR%\Scripts\python.exe" -m pip install uvicorn fastapi pydantic psutil wmi pyautogui pyperclip AppOpener telethon requests httpx piper-tts Pillow sounddevice faster-whisper numpy soundcard
if errorlevel 1 (
    echo [!] Failed to install backend dependencies.
    pause
    exit /b 1
)

:: Запуск сервера из подпапки, используя .venv из корня
if exist "%SERVER_DIR%\main.py" (
    echo [*] Launching Jarvis Backend...
    start "Jarvis Backend" /D "%SERVER_DIR%" cmd /k ""%VENV_DIR%\Scripts\python.exe" main.py"
) else (
    echo [!] ERROR: Backend entry point not found: "%SERVER_DIR%\main.py"
    pause
    exit /b 1
)

:: 2. FRONTEND STARTUP
cd /d "%ROOT_DIR%"
echo [2/2] Checking Frontend...
if exist "%FRONTEND_DIR%\package.json" (
    if not exist "%FRONTEND_DIR%\node_modules" (
        echo [!] Running npm install...
        cd /d "%FRONTEND_DIR%"
        call npm install
        if errorlevel 1 (
            echo [!] Failed to install frontend dependencies.
            pause
            exit /b 1
        )
    )
    echo [*] Launching Vite...
    start "Jarvis Frontend" /D "%FRONTEND_DIR%" cmd /k "npm run dev -- --host"
) else (
    echo [!] ERROR: Frontend package file not found: "%FRONTEND_DIR%\package.json"
    pause
    exit /b 1
)

echo ----------------------------------------
timeout /t 5 > nul
start http://localhost:5173
echo All systems operational.
echo ----------------------------------------
pause
