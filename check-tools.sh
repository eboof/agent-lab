#!/bin/bash
# check-tools.sh — quick integration check for tools API

echo "=== 🔎 Checking Tools API ==="

# 1. Is server running?
curl -s http://localhost:3001/health | jq .status

# 2. List available tools
echo ""
echo "=== 📋 Tool IDs ==="
curl -s http://localhost:3001/api/tools/list | jq '.[].id'

# 3. Run Prompt→YAML Tool test
echo ""
echo "=== ▶️ Prompt→YAML Test ==="
curl -s -X POST http://localhost:3001/api/tools/run/prompt-yaml \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Make a grocery list with fruits and vegetables"}' | jq

# 4. (Optional) Loop over all tools and attempt a run
#    Only works if tools have default params defined
echo ""
echo "=== 🧪 Running all tools (where supported) ==="
TOOL_IDS=$(curl -s http://localhost:3001/api/tools/list | jq -r '.[].id')

for id in $TOOL_IDS; do
  echo "→ Testing tool: $id"
  case $id in
    prompt-yaml)
      curl -s -X POST http://localhost:3001/api/tools/run/$id \
        -H "Content-Type: application/json" \
        -d '{"prompt": "hello world"}' | jq .result
      ;;
    *)
      echo "⚠️ Skipping runtime test for $id (no default input defined)"
      ;;
  esac
  echo ""
done

echo "✅ Done. If errors above, check server logs with: pnpm dev"
