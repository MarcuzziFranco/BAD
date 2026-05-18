# Libera puertos usados por BAD (backend / frontend) matando el proceso que escucha.
param(
    [Parameter(Mandatory = $false)]
    [int[]] $Ports = @(5013, 5012)
)

$ErrorActionPreference = 'SilentlyContinue'
$portsUnique = $Ports | Select-Object -Unique

foreach ($port in $portsUnique) {
    $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($listener in $listeners) {
        $owningPid = $listener.OwningProcess
        if (-not $owningPid -or $owningPid -eq 0) { continue }
        try {
            $proc = Get-Process -Id $owningPid -ErrorAction SilentlyContinue
            $name = if ($proc) { $proc.ProcessName } else { '?' }
            Write-Host "[stop] Puerto ${port}: finalizando PID $owningPid ($name)"
            Stop-Process -Id $owningPid -Force -ErrorAction Stop
        }
        catch {
            Write-Host "[stop] No se pudo finalizar PID $owningPid en puerto ${port}: $_"
        }
    }
}

Write-Host "[stop] Listo. Puertos comprobados: $($portsUnique -join ', ')"
