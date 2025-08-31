# File Structure – Agent-Lab v4.0

```
/agent-lab
│
├── /agents/                 # agent definitions
│   ├── stock-bot.json
│   ├── research-bot.yaml
│   └── ...
│
├── /docs/                   # reference docs (source material, markdown, specs)
│   ├── planning/            # PRD, ADR, workflows
│   │   ├── PRD.md
│   │   ├── ADR.md
│   │   ├── FileStructure.md
│   │   └── Workflow.md
│   ├── API.md
│   ├── RAG.md
│   ├── TOOLS.md
│   └── AGENT_BUILDER.md
│
├── /data/
│   ├── /processed_docs/     # ingested documents for RAG
│   │   ├── 2025-08-31_PocketBlog250304.pdf
│   │   └── ...
│   └── /uploads/            # temporary holding for new docs before vectorization
│
├── /server/
│   ├── /db/
│   │   └── chroma.sqlite    # vector store
│   ├── api.py               # Python FastAPI RAG server
│   ├── index.ts             # Express backend entrypoint
│   ├── rag-bridge.ts        # Express → Python bridge
│   ├── local_llm.py         # Local model runner
│   ├── /models/             # Model backends
│   │   ├── /cloud/
│   │   ├── /local/
│   │   └── /mlx/
│   └── /agent-builder/      # Agent runtime + generator
│       ├── agent-template.ts
│       └── agents.ts
│
├── /tools/                  # reusable tools
│   ├── /implementations/
│   │   ├── yahoo-finance.ts
│   │   ├── openai-api.ts
│   │   └── ...
│   ├── tool-library.ts
│   └── tool-types.ts
│
├── /playground/             # interactive testing area for tools
│   └── ...
│
├── /ui/                     # Frontend React/TypeScript app
│   ├── /src/
│   │   ├── App.tsx          # Main app with 3-tab UI
│   │   └── /pages/
│   │       ├── /agents/     # Agent Builder UI
│   │       ├── /tools/      # Tools Playground UI
│   │       └── /rag/        # RAG Chat UI
│   └── index.html
│
├── .env                     # root config
├── package.json
├── requirements.txt         # Python deps
├── start-agent-lab.sh       # Unified startup script
└── README.md
```

## Key Improvements in v4.0 Structure

1. **Clean Separation**: `/data/` for dynamic content, `/docs/` for static reference material
2. **Logical Grouping**: Tools, agents, and playground are top-level concerns
3. **Clear Data Flow**: `uploads/` → `processed_docs/` → vector store → RAG
4. **Consistent Formats**: Agents support both JSON and YAML for flexibility
5. **Root Configuration**: Single `.env` file for all services
