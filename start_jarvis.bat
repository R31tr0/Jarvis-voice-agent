@echo off
setlocal
echo ========================================
echo   J.A.R.V.I.S. MARK 3: SYSTEM STARTUP
echo ========================================

:: 1. Запуск Python сервера (Бэкенд)
echo [1/2] Инициализация нейронного интерфейса...
start "Jarvis Backend" cmd /k "cd /d jarvis-voice-server && .\venv\Scripts\python.exe main.py"

:: 2. Запуск Vite (Фронтенд)
echo [2/2] Развертывание визуальной оболочки...
start "Jarvis Frontend" cmd /k "cd /d mark-2 && npm run dev -- --host"

echo ----------------------------------------
echo ВСЕ СИСТЕМЫ ЗАПУЩЕНЫ УСПЕШНО.
echo ----------------------------------------
pause