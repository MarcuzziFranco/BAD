@echo off
REM Libera puertos 5013 (backend) y 5012 (frontend).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop.ps1"
exit /b %ERRORLEVEL%
