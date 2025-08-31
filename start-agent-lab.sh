#!/bin/bash
# start-agent-lab.sh
# Agent-Lab Unified Startup Script with auto-kill, logging, and RAG

echo "🧪 Starting Agent-Lab - Your AI Lego Set"
echo "========================================"

# Ensure we're in repo root
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the agent-lab root directory"
    exit 1
fi

# Kill old processes
echo "🔪 Killing old Agent-Lab processes..."
pkill -f "node.*server/index.ts" 2>/dev/null
pkill -f "vite" 2>/dev/null
pkill -f "uvicorn" 2>/dev/null
sleep 2

# Install dependencies if missing
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root Node.js dependencies..."
    pnpm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing server dependencies..."
    (cd server && pnpm install)
fi

if [ ! -d "ui/node_modules" ]; then
    echo "📦 Installing UI dependencies..."
    (cd ui && pnpm install)
fi

PROJECT_ROOT=$(pwd)

# Start backend
echo "🚀 Starting Agent-Lab Server (port 3001)..."
cd "$PROJECT_ROOT/server"
nohup pnpm ts-node index.ts > "$PROJECT_ROOT/main-server.log" 2>&1 &
SERVER_PID=$!

# Start frontend
echo "🎨 Starting UI Dev Server (port 5173)..."
cd "$PROJECT_ROOT/ui"
nohup pnpm vite > "$PROJECT_ROOT/ui/ui-server.log" 2>&1 &
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

# Stop everything cleanly on Ctrl+C
trap "echo '🛑 Stopping servers...'; kill $SERVER_PID $UI_PID $RAG_PID 2>/dev/null; exit" INT
wait
