@echo off
echo ========================================
echo  BAD Development Server
echo  Iniciando Backend y Frontend...
echo ========================================
echo.

REM Iniciar backend en nueva ventana
start "BAD Backend - Puerto 5013" cmd /k "cd /d %~dp0backend\src\BAD.API && dotnet run"

REM Esperar 3 segundos para que el backend inicie
timeout /t 3 /nobreak > nul

REM Iniciar frontend en nueva ventana
start "BAD Frontend - Puerto 5012" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Servicios iniciados en ventanas separadas:
echo   - Backend: http://localhost:5013
echo   - Frontend: http://localhost:5012
echo.
echo Cierra cada ventana con Ctrl+C o cierra la ventana directamente.
echo.
