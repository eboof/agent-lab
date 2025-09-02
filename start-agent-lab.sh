#!/bin/bash
# start-agent-lab.sh – Agent-Lab Unified Startup
# v2 – with .env check, JSON validation, log rotation
# 2025-09-01

echo "🧪 Starting Agent-Lab - Your AI Lego Set"
echo "========================================"

PROJECT_ROOT="$(pwd)"

# Ensure repo root
if [ ! -f "$PROJECT_ROOT/package.json" ]; then
    echo "❌ Please run this script from the agent-lab root directory"
    exit 1
fi

# Ensure .env exists
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo "❌ Missing .env file at repo root"
    exit 1
fi

# Kill old processes
echo "🔪 Killing old Agent-Lab processes..."
pkill -f "ts-node index.ts" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "uvicorn" 2>/dev/null || true
sleep 2

# Validate JSON package files
check_json () {
    FILE=$1
    if ! jq empty "$FILE" >/dev/null 2>&1; then
        echo "❌ Invalid JSON: $FILE"
        exit 1
    fi
}
check_json "$PROJECT_ROOT/server/package.json"
check_json "$PROJECT_ROOT/ui/package.json"

# Rotate logs
> "$PROJECT_ROOT/main-server.log"
> "$PROJECT_ROOT/ui/ui-server.log"
> "$PROJECT_ROOT/server/rag-server.log"

# Start backend
echo "🚀 Starting Agent-Lab Server (port 3001)..."
cd "$PROJECT_ROOT/server"
NODE_OPTIONS="--dns-result-order=ipv4first" nohup pnpm dev > "$PROJECT_ROOT/main-server.log" 2>&1 &
SERVER_PID=$!

# Start frontend
echo "🎨 Starting UI Dev Server (port 5173)..."
cd "$PROJECT_ROOT/ui"
nohup pnpm dev > "$PROJECT_ROOT/ui/ui-server.log" 2>&1 &
UI_PID=$!

# Start RAG (Python)
echo "🧠 Starting RAG Server (port 8000)..."
cd "$PROJECT_ROOT/server"
nohup uvicorn api:app --port 8000 > "$PROJECT_ROOT/server/rag-server.log" 2>&1 &
RAG_PID=$!

cd "$PROJECT_ROOT"

echo ""
echo "✅ Agent-Lab started!"
echo ""
echo "📊 Services:"
echo "   • Agent Server: http://localhost:3001"
echo "   • UI Interface: http://localhost:5173"
echo "   • RAG System:   http://localhost:8000"
echo ""
echo "📜 Logs:"
echo "   • main-server.log"
echo "   • ui/ui-server.log"
echo "   • server/rag-server.log"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Stop cleanly on Ctrl+C
trap "echo '🛑 Stopping servers...'; kill $SERVER_PID $UI_PID $RAG_PID 2>/dev/null; exit" INT
wait
