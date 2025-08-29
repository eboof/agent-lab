# Architecture Decision Record (ADR) – Agent-Lab v4.0

## Context
Agent-Lab merges RAG-Lab’s experimental local models & UI with Agent-Lab’s production-ready TypeScript/React foundation. A consistent architecture is needed for extensibility.

## Decisions

1. **ESM TypeScript Everywhere**
   - Use native ES Modules
   - No CommonJS mixing

2. **Agents in Root /agents/**
   - Each agent is a `.agent.ts` file generated from templates
   - Registered via `registry.ts`

3. **Agent Builder in /server/agent-builder/**
   - Contains:
     - `agent.ts` (BaseAgent runtime class)
     - `agent-template.ts` (generator function)

4. **UI: /ui/src/pages/agents/**
   - `Builder.tsx` for visual agent builder
   - Components under `/ui/src/components/`

5. **Tool Library in /server/tools/**
   - Each tool is a modular TS file
   - Tools implement `Tool` interface
   - Selected via Agent Builder UI

6. **RAG Layer**
   - `server/rag/` for ingestion, vector store, querying
   - Python FastAPI backend with ChromaDB
   - Express bridge (`rag-bridge.ts`)

7. **Security**
   - CLI tool filtered for safe command execution
   - Tools validated via schema before being exposed

## Status
- Adopted for Agent-Lab v4.0
