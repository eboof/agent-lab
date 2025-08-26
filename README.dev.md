# Agent-Lab Developer Guide

## 🚀 Project Structure
```
agent-lab/
├── agents/         # Stock, research, daily-report, demo agents
├── server/         # Express backend (index.ts, mailer.ts, vectorStore.ts, cron)
├── ui/             # Vite + React frontend
├── docs/           # Knowledge PDFs (blog posts, research papers, etc.)
├── server/docs.db  # Vector store (SQLite or JSON depending on config)
└── README.dev.md   # This file
```

---

## 🔧 Setup

1. Install dependencies:
   ```sh
   pnpm install
   ```

2. Create `.env` in root:
   ```ini
   ANTHROPIC_API_KEY=your_key_here
   OPENAI_API_KEY=your_key_here
   EMAIL_USER=your_email
   EMAIL_PASS=your_password
   ```

---

## ▶️ Running the Server
From repo root:
```sh
cd server
pnpm run dev
```

- Runs Express on `http://localhost:3001`
- Agents live in `/agents`
- Cron job runs `daily-report` at **midnight AEST**
- Manual trigger: `POST /run-now/daily-report`

---

## 🎨 Running the UI
From repo root:
```sh
cd ui
pnpm dev
```

- Dev server on `http://localhost:5173`
- Tabs: **Agents**, **Chatbot**, **Reports**
- Reports tab shows schedule + manual run button

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
