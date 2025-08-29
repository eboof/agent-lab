#!/usr/bin/env bash
#
# Copy Agent-Lab docs + JSON DB into rag-lab sandbox
# Safe: does NOT overwrite existing rag-lab files
#

set -euo pipefail

SRC_AGENT_LAB=~/dev/agent-lab
DEST_RAG_LAB=~/dev/rag-lab

# Create dirs if missing
mkdir -p $DEST_RAG_LAB/data
mkdir -p $DEST_RAG_LAB/db

echo "📂 Copying PDF docs..."
if [ -d "$SRC_AGENT_LAB/docs" ]; then
  rsync -av --ignore-existing $SRC_AGENT_LAB/docs/ $DEST_RAG_LAB/data/
else
  echo "⚠️ No docs/ folder found in $SRC_AGENT_LAB"
fi

echo "📦 Copying JSON doc store..."
if [ -f "$SRC_AGENT_LAB/server/docs.json" ]; then
  rsync -av --ignore-existing $SRC_AGENT_LAB/server/docs.json $DEST_RAG_LAB/db/
else
  echo "⚠️ No docs.json found in $SRC_AGENT_LAB/server"
fi

echo "🔍 Validating copied JSON..."
if [ -f "$DEST_RAG_LAB/db/docs.json" ]; then
  head -n 20 $DEST_RAG_LAB/db/docs.json | jq '.' >/dev/null 2>&1 && \
    echo "✅ JSON DB is valid." || echo "❌ JSON DB appears corrupted."
else
  echo "⚠️ No JSON DB to validate."
fi

echo "🎉 Migration complete."
echo "   Data at: $DEST_RAG_LAB/data/"
echo "   DB at:   $DEST_RAG_LAB/db/docs.json"
