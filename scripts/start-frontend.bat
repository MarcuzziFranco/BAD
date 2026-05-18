@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop.ps1" -Ports 5012
echo ========================================
echo  BAD Frontend - Puerto 5012
echo  Presiona Ctrl+C para detener
echo ========================================
echo.

cd /d "%~dp0..\frontend"
npm run dev
