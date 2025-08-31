# Agent-Lab v4.0.1
## Your AI Agent Development Platform

Agent-Lab is a comprehensive platform for building, testing, and deploying AI agents with integrated Retrieval-Augmented Generation (RAG) capabilities. Create powerful agents that can leverage real-world APIs, execute shell commands, and provide AI-powered insights.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** 
- **Python 3.8+**
- **pnpm** (recommended) or npm
- **API Keys** (optional): OpenAI, Anthropic

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd agent-lab

# Install dependencies
pnpm install
cd server && pnpm install && cd ..
cd ui && pnpm install && cd ..

# Install Python dependencies (for RAG system)
pip install -r requirements.txt
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```bash
# AI API Keys (optional - some tools require these)
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here

# Email configuration (optional)
SMTP_HOST=your_smtp_host
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

### 3. Start Agent-Lab

```bash
# Start all services with one command
./start-agent-lab.sh
```

This will start:
- 🎨 **UI Interface**: http://localhost:5173
- 🚀 **Agent Server**: http://localhost:3001  
- 📊 **RAG System**: http://localhost:8000 (auto-started)

### 4. Build Your First Agent

1. **Open the UI**: Navigate to http://localhost:5173
2. **Go to Agent Builder**: Click the "Agents" tab
3. **Create New Agent**: Fill in the form:
   - **Name**: "My Stock Bot"
   - **Description**: "Analyzes stock prices"
   - **System Prompt**: "You are a stock analysis expert"
   - **Tools**: Select "yahoo-finance" and "openai-api"
   - **Input Schema**: Add field "symbol" (string, required)
   - **Output Schema**: Add fields "price" (number) and "analysis" (string)
4. **Save Agent**: Your agent is generated and ready to use!

### 5. Test Your Agent

```bash
# Via API
curl -X POST -H "Content-Type: application/json" \
  -d '{"agent":"my-stock-bot","args":["TSLA"]}' \
  http://localhost:3001/run

# Via CLI
pnpm run agent-cli my-stock-bot TSLA
```

---

## 🏗️ Architecture

### Core Components

```
agent-lab/
├── agents/                 # Generated and custom agents
├── server/                 # Backend API and services  
│   ├── agent-builder/      # Agent generation system
│   ├── tools/              # Tool integrations (APIs, CLI, etc.)
│   ├── rag/                # RAG document processing
│   └── models/             # AI model integrations
├── ui/                     # React frontend
└── docs/                   # Documentation
```

### Agent Lifecycle

1. **Design** → Use Agent Builder UI to define agent capabilities
2. **Generate** → System creates TypeScript agent class with tool integrations
3. **Deploy** → Agent is automatically registered and available via API
4. **Execute** → Run agents via UI, API, or CLI with structured inputs/outputs

---

## 🛠️ Available Tools

### Financial & Market Data
- **Yahoo Finance**: Real-time stock prices, charts, financial data
- **Stock Analysis**: Technical indicators, price trends, market sentiment

### AI & Language Models  
- **OpenAI**: GPT-4 analysis, text generation, data insights
- **Anthropic**: Claude analysis for comprehensive reasoning

### System & Development
- **CLI Tool**: Safe shell command execution with filtering
- **Web Scraping**: Extract data from websites
- **Email Integration**: Send notifications and reports

### Data & RAG
- **Document Ingestion**: PDF, text, and document processing
- **Vector Search**: Semantic search across your knowledge base
- **RAG Queries**: Context-aware AI responses using your documents

---

## 📊 Example Agents

### Stock Analysis Agent
```typescript
// Analyzes stock performance with AI insights
Tools: Yahoo Finance + OpenAI
Input: { symbol: "TSLA", period: "1mo" }  
Output: { price: 345.98, analysis: "Bullish trend...", recommendation: "BUY" }
```

### System Explorer Agent  
```typescript
// Safely executes shell commands
Tools: CLI Tool
Input: { command: "ls -la" }
Output: { results: [...], summary: "Executed 1 commands successfully" }
```

### Research Agent
```typescript
// Queries your document knowledge base  
Tools: RAG System + OpenAI
Input: { question: "What are the key findings?" }
Output: { answer: "...", sources: ["doc1.pdf", "doc2.pdf"] }
```

---

## 🔧 Development

### Creating Custom Tools

1. **Create Tool Implementation**:
```typescript
// server/tools/implementations/my-tool.ts
export class MyTool {
  static async process(input: any): Promise<any> {
    // Your tool logic here
    return { result: "processed" };
  }
}
```

2. **Register in Tool Library**:
```typescript
// server/tools/tool-library.ts
export const AVAILABLE_TOOLS = {
  'my-tool': {
    name: 'My Custom Tool',
    description: 'Does something awesome',
    implementation: 'my-tool.ts'
  }
};
```

3. **Use in Agent Builder**: Your tool will appear in the UI tool selector

### Agent Development Patterns

**BaseAgent Extension**:
```typescript
import { BaseAgent } from "../server/agent-builder/agent.ts";

export class MyAgent extends BaseAgent {
  constructor() {
    super({
      name: "My Agent",
      tools: ["my-tool"],
      inputSchema: { query: { type: "string", required: true } },
      outputSchema: { result: { type: "string", required: true } }
    });
  }

  protected async execute(input: Record<string, any>): Promise<any> {
    // Your agent logic
    return { result: "success" };
  }
}
```

---

## 🌐 API Reference

### Agent Execution
```http
POST /run
Content-Type: application/json

{
  "agent": "my-agent",
  "args": ["param1", "param2"]
}
```

### Agent Management  
```http
GET /agents                    # List all agents
GET /api/agents/list          # Detailed agent metadata
POST /api/agents/create       # Generate new agent
GET /api/agents/load/:filename # Load agent for editing
```

### RAG System
```http
GET /rag/status               # Check RAG system status  
POST /rag/start              # Start RAG server
POST /rag/query              # Query documents
```

---

## 📁 File Structure

### Generated Agents
```typescript
// agents/my-agent.agent.ts
export class MyAgentAgent extends BaseAgent {
  // Auto-generated with your specifications
}
export default async function run(args: string[]) {
  // Runner compatibility  
}
```

### Configuration
```typescript
interface AgentConfig {
  name: string;
  description: string; 
  tools: string[];
  inputSchema: Record<string, SchemaField>;
  outputSchema: Record<string, SchemaField>;
}
```

---

## 🚀 Deployment

### Development
```bash
./start-agent-lab.sh
```

### Production
```bash
# Build frontend
cd ui && pnpm build

# Start services  
pm2 start server/index.ts --name agent-server
pm2 start server/api.py --name rag-server
```

### Docker (Coming Soon)
```bash
docker-compose up -d
```

---

## 🎯 Use Cases

### Business Intelligence
- **Market Analysis**: Real-time stock monitoring with AI insights
- **Report Generation**: Automated business reports from data sources
- **Trend Analysis**: Pattern detection across multiple data streams

### Development Operations
- **System Monitoring**: Automated health checks and diagnostics  
- **Deployment Automation**: Custom deployment workflows
- **Log Analysis**: Intelligent parsing and alerting

### Research & Analysis
- **Document Q&A**: Query large document collections
- **Data Synthesis**: Combine multiple sources into insights
- **Competitive Analysis**: Monitor and analyze market competitors

---

## 🔒 Security

- **API Key Management**: Secure environment variable storage
- **Command Filtering**: Safe shell command execution with whitelist
- **Input Validation**: Schema-based input sanitization
- **Tool Sandboxing**: Isolated tool execution environments

---

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow existing patterns**: Check `/docs/planning/` for architecture guidelines
4. **Add tests**: Ensure your changes work with existing agents
5. **Submit PR**: Include description of changes and test results

---

## 📚 Documentation

- **[Planning Documents](docs/planning/)**: PRD, ADR, Architecture decisions
- **[API Documentation](docs/api.md)**: Detailed API reference
- **[Tool Development](docs/tools.md)**: Creating custom tools
- **[Deployment Guide](docs/deployment.md)**: Production setup
- **[Troubleshooting](TROUBLESHOOTING.md)**: Common issues and solutions

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🎉 What's New in v4.0.1

- ✅ **Complete Agent Builder UI**: Visual agent creation with real-time preview
- ✅ **Full Tool Integration**: Yahoo Finance, OpenAI, Anthropic, CLI tools working
- ✅ **Production-Ready Templates**: Generated agents execute real API calls
- ✅ **Enhanced RAG System**: Improved document processing and query handling
- ✅ **Comprehensive API**: Complete CRUD operations for agent management
- ✅ **Better Error Handling**: Detailed error messages and validation
- ✅ **Schema Validation**: Robust input/output validation system

---

**Ready to build the next generation of AI agents?** 🚀

Start with `./start-agent-lab.sh` and create your first agent in minutes!