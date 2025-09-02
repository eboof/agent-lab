#!/bin/bash
# stop-agent-lab.sh – Cleanly stop all Agent-Lab processes
# v2 – kills by process name + port

echo "🛑 Stopping Agent-Lab..."

# Kill by process name
pkill -f "ts-node index.ts" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "uvicorn" 2>/dev/null || true

# Kill by port as fallback
for PORT in 3001 5173 8000; do
  PID=$(lsof -ti :$PORT)
  if [ -n "$PID" ]; then
    echo "   • Killing process on port $PORT (PID: $PID)"
    kill -9 $PID || true
  else
    echo "   • No process found on port $PORT"
  fi
done

echo "✅ Agent-Lab stopped."
