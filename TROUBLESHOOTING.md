# 🔧 Agent-Lab Troubleshooting Guide

## Issue: Can't See Navigation Tabs or Can't Switch Between Tabs

### Quick Fixes:

1. **Restart the UI Server:**
   ```bash
   cd /Users/rob/dev/agent-lab
   
   # Stop any running UI server (Ctrl+C)
   # Then restart:
   cd ui && pnpm dev
   ```

2. **Clear Browser Cache:**
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Or open DevTools (F12) → Network tab → check "Disable cache"
   - Or try incognito/private browsing mode

3. **Check Browser Console:**
   - Open DevTools (F12) → Console tab
   - Look for any JavaScript errors
   - Common issues: module loading failures, syntax errors

4. **Verify Files Were Updated:**
   ```bash
   cd /Users/rob/dev/agent-lab
   head -5 ui/src/App.tsx
   ```
   Should show: `// Agent-Lab v4.0 - Unified AI Platform`

5. **Test Tab Navigation:**
   Open browser console and run:
   ```javascript
   // Check if React app loaded
   console.log(document.querySelector('.nav-tabs'));
   
   // Manually trigger tab click
   document.querySelector('.nav-tab').click();
   ```

### Expected UI Behavior:

✅ **What You Should See:**
```
┌─────────────────────────────────────────┐
│ 🧪 Agent Lab                           │
│ Your AI Lego Set - Agents, Chat & RAG  │
│ 🤖 Agents  💬 Chatbot  🧠 RAG Chat     │ ← Three clickable tabs
├─────────────────────────────────────────┤
│ [Content changes based on active tab]  │
└─────────────────────────────────────────┘
```

✅ **Tab Switching Should:**
- Highlight the active tab (white background)
- Show different content in main area
- Work with mouse clicks
- Preserve state when switching back

❌ **Problems:**
- Only seeing one interface (no tabs)
- Tabs visible but not clickable
- Clicking tabs doesn't change content
- Interface looks like old version

### Advanced Debugging:

1. **Check Port Conflicts:**
   ```bash
   lsof -i :5173  # Check if UI port is in use
   lsof -i :3001  # Check if server port is in use
   ```

2. **Restart Everything:**
   ```bash
   cd /Users/rob/dev/agent-lab
   
   # Kill any existing processes
   pkill -f "pnpm dev"
   pkill -f "vite"
   
   # Fresh start
   ./start-agent-lab.sh
   ```

3. **Check Dependencies:**
   ```bash
   cd ui
   pnpm install  # Reinstall if needed
   ```

### Still Having Issues?

**Create a minimal test:**
```bash
cd /Users/rob/dev/agent-lab/ui
echo "Testing App.tsx..."
grep -n "nav-tab" src/App.tsx
```

If you see navigation tab code but it's not working in browser, the issue is likely browser caching or the dev server not reloading properly.

**Nuclear option (clean slate):**
```bash
cd /Users/rob/dev/agent-lab
rm -rf ui/node_modules ui/.vite
cd ui && pnpm install && pnpm dev
```