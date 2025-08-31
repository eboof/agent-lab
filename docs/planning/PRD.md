# Product Requirements Document (PRD) – Agent-Lab v4.0

## Overview
Agent-Lab is an experimental AI “Lego Set” that unifies:
- Modular agents
- RAG (retrieval-augmented generation)
- Local & cloud models
- A clean React/TypeScript UI

The goal is to provide a flexible sandbox for building and orchestrating AI agents with tools and workflows.

## Objectives
- Provide a unified environment for experimentation with AI agents
- Support both cloud models (OpenAI, Anthropic) and local models (GPT-2, MLX)
- Offer a visual Agent Builder UI for assembling agents from tools, schemas, and workflows
- Enable consistent agent structure via templates and a registry system
- Ensure safety when exposing system tools (CLI, web, etc.)

## Target Users
- Developers experimenting with multi-agent systems
- Researchers testing RAG/document Q&A setups
- Builders who want to visually compose AI workflows

## Key Features
- 3-tab UI: Agents, Chatbot, RAG Chat
- Agent Builder with metadata, tools, schemas, workflows
- Tool library (stock APIs, web scraping, CLI, etc.)
- Secure execution layer (filtered CLI tool)
- Persistent RAG vector store with ingestion + querying
- Extensible model layer (local/cloud/MLX-ready)

## Success Criteria
- Agents can be created via the UI and saved consistently
- Registry automatically detects and exposes new agents
- End-to-end workflow: query documents → analyze → output via agent
- Clear developer experience: modular, documented, reproducible

## System Flow Diagrams

### Document Ingestion Flow
```mermaid
flowchart TD
    A[Upload Documents] --> B[LoadDocs API]
    B --> C[Process PDFs]
    C --> D[Split into Chunks]
    D --> E[Generate Embeddings]
    E --> F[Store in Vector DB]
    F --> G[Move to processed_docs/]
    G --> H[RAG Chat Ready]
    H --> I[Agent Builder Can Use RAG]
```

### Tool Development & Testing Flow
```mermaid
flowchart TD
    A[Tools Playground] --> B[Create New Tool]
    B --> C[Define Parameters]
    C --> D[Test Implementation]
    D --> E{Test Pass?}
    E -->|No| D
    E -->|Yes| F[Export to Agent Builder]
    F --> G[Select in Agent Builder]
    G --> H[Deploy Agent]
    H --> I[Run Agents with Tool]
```

### Agent Lifecycle Flow
```mermaid
flowchart TD
    A[Agent Builder UI] --> B[Select Tools]
    B --> C[Configure Schema]
    C --> D[Set System Prompt]
    D --> E[Save as .agent.ts]
    E --> F[Auto-Discovery]
    F --> G[Run Agents Tab]
    G --> H[Execute with Environment]
    H --> I[Results & Logs]
```
