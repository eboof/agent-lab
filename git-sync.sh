#!/bin/bash
# git-sync.sh – Always sync master branch

set -e  # exit on error

echo "🔄 Syncing repo: $(pwd)"

# Ensure we’re in repo root
cd "$(dirname "$0")"

# Always check out master
git checkout master

# Pull latest from GitHub
git pull origin master --no-rebase

# Stage all changes (respects .gitignore)
git add -A

# Commit with timestamp if nothing staged manually
if git diff --cached --quiet; then
  echo "✅ Nothing new to commit."
else
  git commit -m "sync: update on $(date '+%Y-%m-%d %H:%M:%S %Z')"
fi

# Push master explicitly
git push origin master

echo "🚀 Master branch synced successfully!"
