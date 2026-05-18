#!/bin/bash
# Libera puertos BAD. En Git Bash / Windows usa PowerShell; en Linux/macOS, lsof o fuser.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if command -v powershell.exe &>/dev/null; then
  exec powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$SCRIPT_DIR/stop.ps1"
fi

PORTS=(5013 5012)
for port in "${PORTS[@]}"; do
  if command -v lsof &>/dev/null; then
    PIDS=$(lsof -ti:"$port" -sTCP:LISTEN 2>/dev/null || true)
    for pid in $PIDS; do
      echo "[stop] Puerto ${port}: finalizando PID $pid"
      kill -9 "$pid" 2>/dev/null || true
    done
  elif command -v fuser &>/dev/null; then
    fuser -k "${port}/tcp" 2>/dev/null || true
  else
    echo "[stop] Instala lsof/fuser o ejecuta scripts/stop.bat." >&2
    exit 1
  fi
done
echo "[stop] Listo. Puertos: ${PORTS[*]}"
