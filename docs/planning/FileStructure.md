# File Structure – Agent-Lab v4.0
agent-lab/
├── agents/                     # Agent definitions (hand-built + generated)
│   ├── TEMPLATE.agent.ts
│   ├── cli-test-bot.agent.ts
│   ├── daily-report.ts
│   ├── demo-agent.ts
│   ├── myagent.agent.ts
│   ├── myfirstagent.agent.ts
│   ├── newstockagent.agent.ts
│   ├── perfect-stock-bot.agent.ts
│   ├── registry.ts
│   ├── research-agent.ts
│   ├── stock-agent.ts
│   ├── super-stock-bot.agent.ts
│   ├── system-explorer.agent.ts
│   └── working-stock-bot.agent.ts
│
├── cli/                        # CLI runner
│   └── agent-cli.ts
│
├── docs/                       # Documentation
│   ├── planning/               # Arseny 4-file planning stack
│   │   ├── ADR.md
│   │   ├── FileStructure.md
│   │   ├── PRD.md
│   │   └── Workflow.md
│   ├── PocketBlog*.pdf         # Reference PDFs (various)
│
├── server/                     # Backend services
│   ├── agent-builder/          # Agent runtime + generator
│   │   ├── agent-template.ts
│   │   ├── agent.ts
│   │   └── agents.ts
│   ├── api.py                  # Python FastAPI RAG server
│   ├── daily-report.yaml       # Report config
│   ├── db/                     # Chroma/SQLite storage
│   │   ├── chroma.sqlite3
│   │   └── (other IDs)
│   ├── index.ts                # Express backend entrypoint
│   ├── local_llm.py            # Local model runner (Python)
│   ├── mailer.ts               # Email integration
│   ├── models/                 # Model backends
│   │   ├── cloud/
│   │   ├── local/
│   │   └── mlx/
│   ├── orchestration/          # (future) multi-agent orchestration
│   ├── rag/                    # Retrieval-Augmented Generation
│   │   ├── embeddings/
│   │   ├── ingest.py
│   │   ├── query/
│   │   └── vectorstore/
│   ├── rag-bridge.ts           # Express → Python bridge
│   ├── reports/                # Generated reports
│   ├── tools/                  # Tool library
│   │   ├── implementations/
│   │   ├── mcp/
│   │   ├── tool-library.ts
│   │   ├── web/
│   │   └── youtube/
│   ├── tutor.ts                # Tutor agent
│   └── vectorStore.ts          # Vector store connector
│
├── ui/                         # Frontend React/TypeScript app
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── App.tsx             # Main app with 3-tab UI
│   │   ├── App.css
│   │   ├── pages/
│   │   │   ├── agents/
│   │   │   │   └── Builder.tsx # Agent Builder UI (metadata + prompt)
│   │   └── components/         # (future) reusable UI blocks
│   └── index.html
│
├── copy_rag_data.sh            # Helper script
├── start-agent-lab.sh          # Unified startup script
├── package.json
├── pnpm-lock.yaml
├── project-meta.yaml
├── requirements.txt            # Python deps for RAG
├── README.dev.md
└── tsconfig.json
