@echo off
echo ========================================
echo  Deteniendo servicios BAD...
echo ========================================
echo.

echo Deteniendo procesos dotnet...
taskkill /F /IM dotnet.exe 2>nul
if %errorlevel%==0 (
    echo   - Procesos dotnet detenidos
) else (
    echo   - No hay procesos dotnet corriendo
)

echo.
echo Deteniendo procesos node...
taskkill /F /IM node.exe 2>nul
if %errorlevel%==0 (
    echo   - Procesos node detenidos
) else (
    echo   - No hay procesos node corriendo
)

echo.
echo ========================================
echo  Servicios detenidos
echo ========================================
pause
