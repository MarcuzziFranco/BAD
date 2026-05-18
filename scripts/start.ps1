# BAD - Brutality API Destroyed - Start Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BAD - Brutality API Destroyed" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Iniciando Backend en " -NoNewline
Write-Host "http://localhost:5013" -ForegroundColor Green
Write-Host "Iniciando Frontend en " -NoNewline
Write-Host "http://localhost:5012" -ForegroundColor Green
Write-Host ""
Write-Host "Swagger UI: " -NoNewline
Write-Host "http://localhost:5013/swagger" -ForegroundColor Yellow
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptPath '..')).Path

& (Join-Path $scriptPath "stop.ps1")

$backendPath = Join-Path $repoRoot "backend\src\BAD.API"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; dotnet run" -WindowStyle Normal

Start-Sleep -Seconds 3

$frontendPath = Join-Path $repoRoot "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "Ambos servicios iniciados!" -ForegroundColor Green
Write-Host ""
Write-Host "Para detener los servicios, cierra las ventanas de PowerShell correspondientes."
