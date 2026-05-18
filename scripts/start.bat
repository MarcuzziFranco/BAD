@echo off
call "%~dp0stop.bat"
echo ========================================
echo   BAD - Brutality API Destroyed
echo ========================================
echo.
echo Iniciando Backend en http://localhost:5013
echo Iniciando Frontend en http://localhost:5012
echo.
echo Swagger UI: http://localhost:5013/swagger
echo.

start "BAD Backend" cmd /k "cd /d %~dp0..\backend\src\BAD.API && dotnet run"

timeout /t 3 /nobreak > nul

start "BAD Frontend" cmd /k "cd /d %~dp0..\frontend && npm run dev"

echo.
echo Ambos servicios iniciados!
echo Presiona cualquier tecla para cerrar esta ventana...
pause > nul
