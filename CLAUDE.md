# Claude Coding Instructions for Agent-Lab

## Context
This repo has **two main parts**:
- `server/` → Express backend + cron + vectorStore
- `ui/` → React frontend (Vite + Tailwind)
- `agents/` → Individual TypeScript scripts (daily-report, stock-agent, research-agent, etc.)
- `docs/` → PDF knowledge sources

## Rules for Code Changes
1. Always respect **ESM imports** (e.g. `import x from "../server/mailer.ts";`)
2. Never use `require` or `__dirname` directly.
   - Use:  
     ```ts
     import { fileURLToPath } from "url";
     import { dirname } from "path";
     const __filename = fileURLToPath(import.meta.url);
     const __dirname = dirname(__filename);
     ```
3. When editing agents:
   - Must export as:
     ```ts
     export default async function run(args: string[]) { ... }
     ```
4. Server executes agents via **dynamic import**:
   ```ts
   const mod = await import(`../agents/${agent}.ts`);
   await mod.default(args);
   ```

## How to Run
- **Backend**: `cd server && pnpm run dev`
- **Frontend**: `cd ui && pnpm dev`
- **Load PDFs**: `npx ts-node server/loadDocs.ts`

## Conventions
- All imports must include `.ts`
- Shared utilities (like mailer) live in `server/`
- UI communicates with backend via Express endpoints

## Goals
- Help add new agents quickly
- Keep backend + UI consistent
- Avoid mixing CJS/ESM
- Always explain where a file lives before editing it
