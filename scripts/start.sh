#!/bin/bash

echo "========================================"
echo "  BAD - Brutality API Destroyed"
echo "========================================"
echo ""
echo "Iniciando Backend en http://localhost:5013"
echo "Iniciando Frontend en http://localhost:5012"
echo ""
echo "Swagger UI: http://localhost:5013/swagger"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

"$SCRIPT_DIR/stop.sh" || true

cd "$REPO_ROOT/backend/src/BAD.API"
dotnet run &
BACKEND_PID=$!

sleep 3

cd "$REPO_ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Ambos servicios iniciados!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Presiona Ctrl+C para detener ambos servicios..."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

wait
