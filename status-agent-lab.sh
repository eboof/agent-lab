#!/bin/bash
# status-agent-lab.sh – Show running Agent-Lab processes
# v2 – with health checks + log tail fallback

PORTS=(3001 5173 8000)
NAMES=("Agent Server" "UI Interface" "RAG Server")
LOGS=("main-server.log" "ui/ui-server.log" "server/rag-server.log")
HEALTH_URLS=("http://localhost:3001/health" "http://localhost:5173" "http://localhost:8000")

echo "📊 Agent-Lab Service Status"
echo "==========================="

for i in "${!PORTS[@]}"; do
  PORT=${PORTS[$i]}
  NAME=${NAMES[$i]}
  LOG=${LOGS[$i]}
  URL=${HEALTH_URLS[$i]}

  PID=$(lsof -ti :$PORT)

  if [ -n "$PID" ]; then
    if curl -fs "$URL" >/dev/null 2>&1; then
      echo "✅ $NAME is healthy (PID: $PID, Port: $PORT)"
    else
      echo "⚠️  $NAME is running (PID: $PID) but not responding on $URL"
      echo "   Last 10 log lines from $LOG:"
      tail -n 10 "$LOG"
    fi
  else
    echo "❌ $NAME is NOT running (Port: $PORT free)"
    if [ -f "$LOG" ]; then
      echo "   Last 10 log lines from $LOG:"
      tail -n 10 "$LOG"
    fi
  fi
done

echo "==========================="
