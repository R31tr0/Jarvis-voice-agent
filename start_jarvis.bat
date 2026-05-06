@echo off
setlocal enabledelayedexpansion

:: Определяем корень (папка Jarvis-voice-agent-main)
set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

echo ========================================
echo   J.A.R.V.I.S. MARK 3.6: FIXED PATHS
echo ========================================

:: 1. BACKEND STARTUP
echo [1/2] Checking Server...

:: Проверяем наличие .venv в корне
if not exist ".venv" (
    echo [!] .venv not found in root. Creating...
    python -m venv .venv
)

:: Установка зависимостей через .venv в корне
echo [*] Installing requirements into root .venv...
".venv\Scripts\pip.exe" install uvicorn fastapi pydantic psutil wmi pyautogui pyperclip AppOpener telethon requests httpx piper-tts

:: Запуск сервера из подпапки, используя .venv из корня
if exist "jarvis-voice-server" (
    echo [*] Launching Jarvis Backend...
    :: Мы используем интерпретатор из корня, но запускаем файл из папки сервера
    start "Jarvis Backend" cmd /k "cd /d %ROOT_DIR%jarvis-voice-server && ..\.venv\Scripts\python.exe main.py"
) else (
    echo [!] ERROR: jarvis-voice-server folder not found!
)

:: 2. FRONTEND STARTUP
cd /d "%ROOT_DIR%"
echo [2/2] Checking Frontend...
if exist "mark-2" (
    cd /d "%ROOT_DIR%mark-2"
    if not exist "node_modules" (
        echo [!] Running npm install...
        call npm install
    )
    echo [*] Launching Vite...
    start "Jarvis Frontend" cmd /k "cd /d %ROOT_DIR%mark-2 && npm run dev -- --host"
)

echo ----------------------------------------
echo All systems operational.
echo ----------------------------------------
pause
