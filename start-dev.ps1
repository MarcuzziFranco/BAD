# Script para iniciar Backend y Frontend simultáneamente
# Presiona Ctrl+C para detener ambos procesos

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BAD Development Server" -ForegroundColor Cyan  
Write-Host "  Backend: http://localhost:5013" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:5012" -ForegroundColor Green
Write-Host "  Presiona Ctrl+C para detener todo" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $scriptPath "backend\src\BAD.API"
$frontendPath = Join-Path $scriptPath "frontend"

# Iniciar backend
Write-Host "[Backend] Iniciando..." -ForegroundColor Magenta
$backend = Start-Process -FilePath "dotnet" -ArgumentList "run" -WorkingDirectory $backendPath -PassThru -NoNewWindow

# Esperar un poco para que el backend inicie
Start-Sleep -Seconds 3

# Iniciar frontend
Write-Host "[Frontend] Iniciando..." -ForegroundColor Magenta
$frontend = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory $frontendPath -PassThru -NoNewWindow

Write-Host ""
Write-Host "Ambos servicios iniciados. PIDs: Backend=$($backend.Id), Frontend=$($frontend.Id)" -ForegroundColor Green
Write-Host ""

# Función para limpiar procesos
function Cleanup {
    Write-Host ""
    Write-Host "Deteniendo servicios..." -ForegroundColor Yellow
    
    if (-not $backend.HasExited) {
        Write-Host "[Backend] Deteniendo PID $($backend.Id)..." -ForegroundColor Magenta
        Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
    }
    
    if (-not $frontend.HasExited) {
        Write-Host "[Frontend] Deteniendo PID $($frontend.Id)..." -ForegroundColor Magenta
        Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue
    }
    
    # También matar procesos hijos de node
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Write-Host "Servicios detenidos." -ForegroundColor Green
}

# Registrar handler para Ctrl+C
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action { Cleanup }

try {
    # Mantener el script corriendo
    while ($true) {
        if ($backend.HasExited -and $frontend.HasExited) {
            Write-Host "Ambos procesos terminaron." -ForegroundColor Yellow
            break
        }
        Start-Sleep -Seconds 1
    }
}
finally {
    Cleanup
}
