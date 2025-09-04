# 🗂 Agent-Lab Sprint Plan + Development Protocol

**Version**: v2.0  
**Date**: 2025-09-04  
**Status**: Phase 1 Complete → Preparing Phase 2  

---

## ✅ Sprint Roadmap (Phases 1–3)

### Phase 1: Agent System Foundation (✅ Complete)
- Agent CRUD APIs (`/api/agents/*`)
- Agent Runner for YAML agents
- Schema validation with Ajv
- Gmail toolset (get, send, delete, label)
- Smart Inbox Agent (analysis + execution)
- Execution Monitor (WebSocket + portals)

### Phase 2: Orchestration Engine (🚀 Next)
- Message Bus for agent-to-agent communication
- Swarm Coordinator for workflows
- Execution Monitor upgrades (interactive portals)
- Error handling + recovery
- Cross-agent data passing

### Phase 3: Advanced Features
- Visual Swarm Designer UI
- Agent Library + Marketplace
- Analytics dashboard
- Extended integrations (Google Calendar, Drive, Sheets, external APIs)
- Performance + scaling optimizations

---

## 🔧 Development Protocol (Living Document)

### 1. Core Practices
- **Incremental Development**: Build/test small pieces, commit often
- **Consistent Naming**: Keep parameter names uniform across tools & agents
- **Error Handling**: All APIs return structured JSON errors (no HTML)
- **Server Restarts**: Restart after adding new endpoints or routes
- **Testing**: Always `curl` test APIs before UI integration

### 2. Module & Imports
- Always use `.ts` extensions in imports
- Avoid mismatched default vs named imports
- Restart server if "Cannot find module" appears

### 3. WebSockets
- Handle connect/disconnect/reconnect gracefully
- Persist execution state (`execution-store.ts`)
- Clean up sockets on client unmount

### 4. React & UI
- Consistent styling (CSS modules or inline, not mixed)
- Always show loading/error states
- Use prop interfaces for type safety
- Avoid over-complicated routing (simple router is fine)

### 5. Security
- Redact sensitive fields (`***`) in logs
- `.gitignore` OAuth tokens, secrets, logs, and DB files
- Timeouts: All tools capped at 30s execution

### 6. Git Workflow
- Feature branches for complex changes
- Descriptive commits tied to sprint tasks
- Update documentation in the same commit

---

## 📝 Lessons Learned
1. Start simple — avoid over-engineering
2. Test early and often
3. Plan for failure (timeouts, retries, errors)
4. User feedback first (loading, error, success states)
5. Keep documentation live and up to date

---

📌 **This document is the single source of truth for Agent-Lab development.**  
It unites the **roadmap** (tasks.md) with the **protocol** (DEVELOPMENT_PROTOCOL.md) so that every sprint delivers features while following the same engineering discipline.  

Would you like me to also add it to your repo's git workflow (commit + push under /docs/tasks+protocol.md) so Claude automatically sees it on his side?