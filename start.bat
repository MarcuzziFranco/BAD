@echo off
echo ========================================
echo   BAD - Brutality API Destroyed
echo ========================================
echo.
echo Iniciando Backend en http://localhost:5013
echo Iniciando Frontend en http://localhost:5012
echo.
echo Swagger UI: http://localhost:5013/swagger
echo.

:: Iniciar backend en una nueva ventana
start "BAD Backend" cmd /k "cd /d %~dp0backend\src\BAD.API && dotnet run"

:: Esperar 3 segundos para que el backend inicie
timeout /t 3 /nobreak > nul

:: Iniciar frontend en una nueva ventana
start "BAD Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Ambos servicios iniciados!
echo Presiona cualquier tecla para cerrar esta ventana...
pause > nul
