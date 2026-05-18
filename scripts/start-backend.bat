@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop.ps1" -Ports 5013
echo ========================================
echo  BAD Backend - Puerto 5013
echo  Presiona Ctrl+C para detener
echo ========================================
echo.

cd /d "%~dp0..\backend\src\BAD.API"
dotnet run
