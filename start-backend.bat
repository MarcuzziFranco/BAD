@echo off
echo ========================================
echo  BAD Backend - Puerto 5013
echo  Presiona Ctrl+C para detener
echo ========================================
echo.

cd /d "%~dp0backend\src\BAD.API"
dotnet run
