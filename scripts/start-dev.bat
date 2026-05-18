@echo off
call "%~dp0stop.bat"
echo ========================================
echo  BAD Development Server
echo  Iniciando Backend y Frontend...
echo ========================================
echo.

start "BAD Backend - Puerto 5013" cmd /k "cd /d %~dp0..\backend\src\BAD.API && dotnet run"

timeout /t 3 /nobreak > nul

start "BAD Frontend - Puerto 5012" cmd /k "cd /d %~dp0..\frontend && npm run dev"

echo.
echo Servicios iniciados en ventanas separadas:
echo   - Backend: http://localhost:5013
echo   - Frontend: http://localhost:5012
echo.
echo Cierra cada ventana con Ctrl+C o cierra la ventana directamente.
echo.
