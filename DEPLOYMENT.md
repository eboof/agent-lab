# Agent-Lab Deployment Guide

## Environment Setup

### 1. Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
# Edit .env with your actual API keys and configuration
```

Required variables:
- `OPENAI_API_KEY` - OpenAI API key for LLM functionality
- `ANTHROPIC_API_KEY` - Anthropic API key for Claude integration

Optional variables:
- `SMTP_USER`, `SMTP_PASS` - Email configuration
- `PORT` - Main server port (default: 3001)
- `RAG_PORT` - RAG server port (default: 8000)
- `UI_PORT` - UI development port (default: 5173)

### 2. Dependencies

#### Node.js Dependencies
```bash
# Root dependencies
pnpm install

# Server dependencies
cd server && pnpm install

# UI dependencies  
cd ui && pnpm install
```

#### Python Dependencies
```bash
cd server
pip install -r requirements.txt
# Or with conda:
conda install fastapi uvicorn langchain openai python-dotenv
```

## Development Deployment

### Quick Start
```bash
./start-agent-lab.sh
```

This script:
- Kills any existing processes
- Installs missing dependencies
- Starts all three services:
  - Node.js server (port 3001)
  - React UI (port 5173)
  - Python RAG API (port 8000)

### Manual Start
```bash
# Terminal 1: Node.js Server
cd server
pnpm ts-node index.ts

# Terminal 2: React UI
cd ui  
pnpm vite

# Terminal 3: Python RAG API
cd server
uvicorn api:app --port 8000
```

## Production Deployment

### Environment Configuration
1. Set `NODE_ENV=production` in .env
2. Set `DEBUG=false` in .env
3. Configure proper CORS origins
4. Use production database paths

### Build Process
```bash
# Build UI for production
cd ui
pnpm build

# Server runs directly from TypeScript
cd server
pnpm ts-node index.ts
```

### Process Management
Use PM2 or similar for production process management:

```bash
# Install PM2
npm install -g pm2

# Start services
pm2 start ecosystem.config.js

# Monitor
pm2 monit
```

## Architecture

### Service Structure
```
Agent-Lab/
├── server/           # Node.js + Python servers
│   ├── index.ts     # Main Node.js server (port 3001)
│   ├── api.py       # Python RAG API (port 8000)
│   └── package.json
├── ui/              # React frontend (port 5173)
├── tools/           # Tool implementations
├── agents/          # Agent definitions
├── data/            # Upload and processed documents
└── .env            # Environment variables (repo root)
```

### API Endpoints
- **Node.js Server (3001)**:
  - `/api/tools/*` - Tool management
  - `/api/agents/*` - Agent management  
  - `/rag/*` - RAG proxy endpoints
  - `/health` - Health check

- **Python RAG API (8000)**:
  - `/query` - Document queries
  - `/load-docs` - Document ingestion
  - `/models` - Available models
  - `/health` - Health check

## Troubleshooting

### Common Issues
1. **Port conflicts**: Kill existing processes with `pkill -f "node\|vite\|uvicorn"`
2. **Missing dependencies**: Run installation commands above
3. **API key errors**: Verify .env file is in repo root with correct keys
4. **CORS errors**: Check frontend/backend URLs match deployment configuration

### Logs
- Main server: `main-server.log`
- UI server: `ui/ui-server.log` 
- RAG server: `server/rag-server.log`

### Health Checks
```bash
# Check all services
curl http://localhost:3001/health
curl http://localhost:8000/health
curl http://localhost:5173  # Should show UI
```