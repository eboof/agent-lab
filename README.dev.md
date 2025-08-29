# Agent-Lab v4.0 - Unified AI Platform

**Your AI Lego Set** - Combines agents, chatbot, and RAG functionality with local model support

## 🚀 Project Structure
```
agent-lab/
├── agents/                    # TypeScript agents (stock, research, daily-report)
├── server/                    # Express backend + Python RAG integration
│   ├── models/local/         # Local model support (GPT-2, DistilGPT-2)
│   ├── rag/                  # RAG components (vectorstore, ingestion)
│   ├── api.py                # Python RAG API server
│   └── index.ts              # Main Node.js server (port 3001)
├── ui/                       # Unified React frontend (3 tabs)
│   ├── Agents Tab            # Run TypeScript agents
│   ├── Chatbot Tab           # Chat with Claude/GPT-4o  
│   └── RAG Chat Tab          # Query documents with local/cloud models
├── docs/                     # Knowledge PDFs for RAG
└── requirements.txt          # Python dependencies
```

---

## 🔧 Quick Start

### Option 1: Automated Setup
```sh
./start-agent-lab.sh
```

### Option 2: Manual Setup

1. **Install Node.js dependencies:**
   ```sh
   pnpm install
   cd server && pnpm install
   cd ../ui && pnpm install
   ```

2. **Install Python dependencies (for RAG):**
   ```sh
   pip install -r requirements.txt
   ```

3. **Create `.env` in root:**
   ```ini
   ANTHROPIC_API_KEY=your_key_here
   OPENAI_API_KEY=your_key_here
   EMAIL_USER=your_email
   EMAIL_PASS=your_password
   ```

---

## ▶️ Running the Unified System

### Start All Services:
```sh
./start-agent-lab.sh
```

### Manual Startup:
```sh
# Terminal 1: Node.js server
cd server && pnpm run dev

# Terminal 2: React UI
cd ui && pnpm dev
```

### Access Points:
- **Main UI:** `http://localhost:5173`
- **Agent Server:** `http://localhost:3001`
- **RAG Server:** Starts on-demand via UI or `POST /rag/start`

### UI Features:
- **🤖 Agents Tab:** Run TypeScript agents (stock, daily-report, research)
- **💬 Chatbot Tab:** Chat with Claude or GPT-4o
- **🧠 RAG Chat Tab:** Query documents with local or cloud models

---

## 📚 Loading Knowledge PDFs
Place PDFs into `/docs/` then run:
```sh
npx ts-node server/loadDocs.ts
```

- Extracts text from PDFs
- Saves to `server/docs.db` (or `docs.json`)
- Search via `searchDocs(query)`

---

## 🧪 Testing Agents
```sh
# Run stock agent
npx ts-node agents/stock-agent.ts TSLA

# Run daily report
npx ts-node agents/daily-report.ts
```

---

## 🔍 Useful Notes
- Project is **full ESM** (`"type": "module"` in package.json)
- Use `.ts` extensions in imports
- `__dirname` replaced via `fileURLToPath(import.meta.url)`
