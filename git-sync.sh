#!/bin/bash
set -e

# Ensure we’re in repo root
cd "$(dirname "$0")"

echo "🔄 Pulling latest changes..."
git pull origin master

echo "➕ Adding changes..."
git add .

echo "✍️ Commit message (press enter for auto timestamp): "
read msg
if [ -z "$msg" ]; then
  msg="Update on $(date)"
fi

echo "💾 Committing..."
git commit -m "$msg"

echo "⬆️ Pushing to GitHub..."
git push origin master

echo "✅ Sync complete!"
