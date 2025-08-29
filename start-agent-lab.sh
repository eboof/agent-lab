#!/bin/bash

# Agent-Lab Unified Startup Script
# Starts both the Node.js Agent server and optional Python RAG server

echo "🧪 Starting Agent-Lab - Your AI Lego Set"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the agent-lab root directory"
    exit 1
fi

# Install Node dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    pnpm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing server dependencies..."
    cd server && pnpm install && cd ..
fi

if [ ! -d "ui/node_modules" ]; then
    echo "📦 Installing UI dependencies..."
    cd ui && pnpm install && cd ..
fi

# Start servers in background
echo ""
echo "🚀 Starting Agent-Lab Server (port 3001)..."
cd server && pnpm run dev &
SERVER_PID=$!
cd ..

echo "🎨 Starting UI Dev Server (port 5173)..."
cd ui && pnpm dev &
UI_PID=$!
cd ..

echo ""
echo "✅ Agent-Lab is starting up!"
echo ""
echo "📊 Available Services:"
echo "   • Agent Server: http://localhost:3001"
echo "   • UI Interface: http://localhost:5173"
echo "   • RAG System: Start from UI or via POST /rag/start"
echo ""
echo "🔧 Optional Python Setup for RAG:"
echo "   pip install -r requirements.txt"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for interrupt
trap "echo '🛑 Stopping servers...'; kill $SERVER_PID $UI_PID 2>/dev/null; exit" INT
wait