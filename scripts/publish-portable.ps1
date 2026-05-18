# Genera ejecutable self-contained (win-x64) con el SPA de Vite embebido en wwwroot.
# Requisitos en la máquina de build: Node.js + npm, .NET 8 SDK.
# En la máquina destino (Windows x64): no hace falta .NET ni Node.

$ErrorActionPreference = 'Stop'

$scriptsDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$root = (Resolve-Path (Join-Path $scriptsDir '..')).Path
$frontend = Join-Path $root 'frontend'
$apiProj = Join-Path $root 'backend\src\BAD.API\BAD.API.csproj'
$wwwroot = Join-Path $root 'backend\src\BAD.API\wwwroot'
$outDir = Join-Path $root 'dist\portable\BAD-portable-win-x64'

Write-Host '== BAD portable: build frontend ==' -ForegroundColor Cyan
Push-Location $frontend
npm ci
npm run build
Pop-Location

Write-Host '== BAD portable: copiar dist -> wwwroot ==' -ForegroundColor Cyan
if (-not (Test-Path $wwwroot)) {
    New-Item -ItemType Directory -Path $wwwroot | Out-Null
}
Get-ChildItem -Path $wwwroot -Force | Where-Object { $_.Name -ne '.gitkeep' } | Remove-Item -Recurse -Force
Copy-Item -Path (Join-Path $frontend 'dist\*') -Destination $wwwroot -Recurse -Force

Write-Host '== BAD portable: dotnet publish (self-contained, single file) ==' -ForegroundColor Cyan
dotnet publish $apiProj `
    -c Release `
    -r win-x64 `
    --self-contained true `
    -p:PublishSingleFile=true `
    -p:IncludeNativeLibrariesForSelfExtract=true `
    -o $outDir

Write-Host ""
Write-Host "Publicado en: $outDir" -ForegroundColor Green
Write-Host "Ejecutar: $(Join-Path $outDir 'BAD.API.exe') y abrir http://localhost:5013" -ForegroundColor Green
Write-Host "Swagger de prueba: en appsettings junto al exe, poner Portable:ShowSwagger = true (o env Portable__ShowSwagger=true)" -ForegroundColor Yellow
