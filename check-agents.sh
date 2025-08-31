#!/bin/bash
# Quick diagnostics for Agent-Lab
# Run from repo root: ./check-agents.sh

echo "=== 📂 Agents in /agents directory ==="
ls -al ./agents/*.ts 2>/dev/null || echo "⚠️ No .ts files in /agents"

echo
echo "=== 📋 Server /api/agents/list ==="
curl -s http://localhost:3001/api/agents/list | jq || echo "⚠️ Server not responding"

echo
echo "=== 🔎 Try loading system-explorer.agent.ts ==="
curl -s http://localhost:3001/api/agents/load/system-explorer.agent.ts | jq || echo "⚠️ Could not load agent"

echo
echo "=== ▶️ Run system-explorer with 'pwd' ==="
curl -s -X POST http://localhost:3001/run \
  -H "Content-Type: application/json" \
  -d '{"agent": "system-explorer", "args": ["pwd"]}' | jq || echo "⚠️ Could not run agent"

echo
echo "=== 🛠 Tool IDs registered ==="
grep "id:" ./server/tools/tool-library.ts | sed 's/^[ \t]*//'

echo
echo "✅ Done. If errors above, check server logs: pnpm dev"
