# File Structure – Agent-Lab v4.0
agent-lab/
├── agents/                 # Agent files (generated)
│   ├── TEMPLATE.agent.ts
│   ├── stock.agent.ts
│   └── registry.ts
├── docs/
│   └── planning/           # Planning docs (PRD, ADR, etc.)
├── server/
│   ├── agent-builder/      # Agent generator + runtime
│   │   ├── agent.ts
│   │   └── agent-template.ts
│   ├── models/             # Local/Cloud/MLX models
│   ├── rag/                # RAG pipeline
│   ├── tools/              # Modular tools
│   ├── orchestration/      # Agent workflow manager
│   ├── index.ts            # Express entrypoint
│   └── api.py              # Python RAG API
└── ui/
└── src/
├── pages/
│   ├── agents/
│   │   └── Builder.tsx
└── components/
└── AgentForm.tsx
