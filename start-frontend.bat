@echo off
echo ========================================
echo  BAD Frontend - Puerto 5012
echo  Presiona Ctrl+C para detener
echo ========================================
echo.

cd /d "%~dp0frontend"
npm run dev
