# Agent-Lab API Documentation

Complete reference for Agent-Lab v4.0.1 API endpoints.

## Base URL

All API endpoints are available at: `http://localhost:3001`

---

## 🤖 Agent Operations

### List All Agents

Get a list of all available agents.

```http
GET /agents
```

**Response:**
```json
[
  "demo-agent",
  "newstockagent", 
  "system-explorer",
  "test-stock-bot",
  "working-stock-bot"
]
```

**Example:**
```bash
curl http://localhost:3001/agents
```

---

### Get Agent Details

Get detailed metadata for all agents including file paths and modification times.

```http
GET /api/agents/list
```

**Response:**
```json
{
  "agents": [
    {
      "filename": "test-stock-bot.agent.ts",
      "name": "test-stock-bot", 
      "path": "/Users/rob/dev/agent-lab/agents/test-stock-bot.agent.ts",
      "lastModified": "2025-08-29T09:46:32.123Z"
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:3001/api/agents/list
```

---

### Execute Agent

Run an agent with specified parameters.

```http
POST /run
Content-Type: application/json

{
  "agent": "agent-name",
  "args": ["param1", "param2"]
}
```

**Parameters:**
- `agent` (string, required): Name of the agent to execute
- `args` (array, required): Array of parameters to pass to the agent

**Response:**
```json
{
  "output": {
    "result": "Agent execution result",
    "timestamp": "2025-08-29T09:46:00.779Z",
    "agent": "Agent Name"
  }
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "agent": "Agent Name",
  "timestamp": "2025-08-29T09:46:00.779Z"
}
```

**Examples:**

Stock Analysis:
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"agent":"test-stock-bot","args":["TSLA"]}' \
  http://localhost:3001/run
```

CLI Command:
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"agent":"test-cli-bot","args":["ls -la"]}' \
  http://localhost:3001/run
```

Demo Agent:
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"agent":"demo-agent","args":["Hello World"]}' \
  http://localhost:3001/run
```

---

### Create New Agent

Generate a new agent using the Agent Builder.

```http
POST /api/agents/create
Content-Type: application/json

{
  "name": "My Agent",
  "description": "Agent description",
  "version": "1.0",
  "systemPrompt": "System prompt for the agent",
  "selectedTools": ["tool1", "tool2"],
  "inputSchema": [
    {
      "key": "field1",
      "type": "string",
      "required": true,
      "description": "Field description"
    }
  ],
  "outputSchema": [
    {
      "key": "result",
      "type": "string", 
      "required": true,
      "description": "Output description"
    }
  ]
}
```

**Parameters:**
- `name` (string, required): Agent name
- `description` (string, required): Agent description
- `version` (string, required): Agent version
- `systemPrompt` (string, optional): AI system prompt
- `selectedTools` (array, optional): Array of tool names
- `inputSchema` (array, optional): Input field definitions
- `outputSchema` (array, optional): Output field definitions

**Schema Field Format:**
```typescript
{
  key: string;           // Field name
  type: "string" | "number" | "boolean" | "array" | "object";
  required: boolean;     // Whether field is required
  description: string;   // Field description
}
```

**Response:**
```json
{
  "success": true,
  "filename": "my-agent.agent.ts",
  "path": "/Users/rob/dev/agent-lab/agents/my-agent.agent.ts", 
  "message": "Agent generated successfully!"
}
```

**Example:**
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{
    "name": "Weather Bot",
    "description": "Gets weather information", 
    "version": "1.0",
    "systemPrompt": "You are a weather expert",
    "selectedTools": ["openai-api"],
    "inputSchema": [
      {"key": "city", "type": "string", "required": true, "description": "City name"}
    ],
    "outputSchema": [
      {"key": "weather", "type": "string", "required": true, "description": "Weather info"}
    ]
  }' \
  http://localhost:3001/api/agents/create
```

---

### Load Agent for Editing

Load an existing agent's configuration for editing in the Agent Builder.

```http
GET /api/agents/load/:filename
```

**Parameters:**
- `filename` (string, required): Agent filename (e.g., "my-agent.agent.ts")

**Response:**
```json
{
  "filename": "my-agent.agent.ts",
  "content": "// Full agent source code...",
  "parsed": {
    "name": "My Agent",
    "description": "Agent description", 
    "version": "1.0",
    "systemPrompt": "System prompt",
    "selectedTools": ["tool1", "tool2"],
    "inputSchema": [...],
    "outputSchema": [...]
  },
  "lastModified": "2025-08-29T09:46:32.123Z"
}
```

**Example:**
```bash
curl http://localhost:3001/api/agents/load/test-stock-bot.agent.ts
```

---

## 💬 Chat Operations

### Chat with AI Model

Direct chat interface with AI models.

```http
POST /chat
Content-Type: application/json

{
  "message": "Your message here",
  "model": "gpt-4"
}
```

**Parameters:**
- `message` (string, required): Message to send to AI
- `model` (string, optional): AI model to use (default: "gpt-4")

**Supported Models:**
- `gpt-4` (OpenAI GPT-4)
- `gpt-3.5-turbo` (OpenAI GPT-3.5)
- `claude-3-sonnet` (Anthropic Claude)
- `local-gpt2` (Local model)

**Response:**
```json
{
  "response": "AI response here",
  "model": "gpt-4",
  "timestamp": "2025-08-29T09:46:00.779Z"
}
```

**Example:**
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"message":"Explain quantum computing","model":"gpt-4"}' \
  http://localhost:3001/chat
```

---

## 📊 RAG System

### RAG Status

Check the status of the RAG (Retrieval-Augmented Generation) system.

```http
GET /rag/status
```

**Response:**
```json
{
  "ready": true,
  "process": "running",
  "port": 8000
}
```

**Example:**
```bash
curl http://localhost:3001/rag/status
```

---

### Start RAG Server

Start the RAG server if it's not running.

```http
POST /rag/start
```

**Response:**
```json
{
  "success": true,
  "message": "RAG server starting...",
  "status": "starting"
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/rag/start
```

---

### Query RAG System

Query your document knowledge base using RAG.

```http
POST /rag/query
Content-Type: application/json

{
  "question": "Your question here",
  "model": "gpt-4",
  "k": 5
}
```

**Parameters:**
- `question` (string, required): Question to ask the documents
- `model` (string, optional): AI model for analysis (default: "gpt-4")
- `k` (number, optional): Number of relevant documents to retrieve (default: 5)

**Response:**
```json
{
  "answer": "Answer based on your documents...",
  "sources": [
    "document1.pdf",
    "document2.pdf"
  ]
}
```

**Example:**
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"question":"What are the key findings?","model":"gpt-4","k":3}' \
  http://localhost:3001/rag/query
```

---

### Get Available Models

Get list of available AI models for RAG queries.

```http
GET /rag/models
```

**Response:**
```json
{
  "models": [
    {
      "id": "gpt-4",
      "name": "OpenAI GPT-4",
      "type": "cloud"
    },
    {
      "id": "local-gpt2", 
      "name": "Local GPT-2",
      "type": "local"
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:3001/rag/models
```

---

## 📋 System Operations

### Get Project Metadata

Get project configuration and metadata.

```http
GET /meta
```

**Response:**
```json
{
  "project": "agent-lab",
  "version": "4.0.1",
  "description": "AI Agent Development Platform",
  "agents_count": 12,
  "tools_available": ["yahoo-finance", "openai-api", "cli-tool", "anthropic-api"]
}
```

**Example:**
```bash
curl http://localhost:3001/meta
```

---

## 🔧 Available Tools

The following tools can be used when creating agents:

### Financial Tools
- **`yahoo-finance`**: Real-time stock data, financial metrics, market analysis
- **`stock-analysis`**: Technical indicators, trend analysis, recommendations

### AI Tools  
- **`openai-api`**: GPT-4 analysis, text generation, data processing
- **`anthropic-api`**: Claude reasoning, analysis, content generation

### System Tools
- **`cli-tool`**: Safe shell command execution with output capture
- **`web-scraper`**: Extract data from web pages
- **`email-tool`**: Send notifications and reports

### Data Tools
- **`rag-query`**: Query document knowledge base
- **`file-processor`**: Read and process various file formats

---

## 📝 Schema Types

### Agent Configuration
```typescript
interface AgentConfig {
  name: string;
  description: string;
  version: string;
  systemPrompt?: string;
  tools: string[];
  inputSchema: Record<string, SchemaField>;
  outputSchema: Record<string, SchemaField>;
  dependencies?: string[];
  environmentVars?: string[];
  timeout?: number;
  retries?: number;
  memory?: boolean;
}
```

### Schema Field Definition
```typescript
interface SchemaField {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
}
```

---

## ❌ Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message description",
  "message": "Additional context",
  "timestamp": "2025-08-29T09:46:00.779Z"
}
```

### Common HTTP Status Codes

- **200**: Success
- **400**: Bad Request (invalid parameters)
- **404**: Not Found (agent/resource doesn't exist)
- **500**: Internal Server Error
- **503**: Service Unavailable (RAG server not ready)

---

## 🔗 CORS Configuration

The API supports Cross-Origin Resource Sharing (CORS) with the following headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

---

## 📊 Rate Limiting

Currently no rate limiting is implemented. For production deployment, consider implementing rate limiting based on your requirements.

---

## 🔒 Authentication

The current version does not require authentication. For production deployment:

1. Add API key authentication
2. Implement JWT tokens for session management
3. Set up role-based access control (RBAC)
4. Enable HTTPS for secure communication

---

## 🐛 Debugging

### Enable Debug Mode

Set environment variable for detailed logging:

```bash
export DEBUG=agent-lab:*
```

### Check Logs

Server logs are available in:
- Console output during development
- `/tmp/server.log` (if redirected)
- `server/rag-server.log` (RAG system logs)

### Common Issues

1. **Agent not found**: Check agent name spelling and ensure it's in `/agents/` directory
2. **Tool errors**: Verify API keys are set in `.env` file
3. **RAG not ready**: Wait for RAG server startup or call `/rag/start`
4. **Permission denied**: Check file permissions and working directory

---

**Next:** [Agent Builder UI Documentation](AGENT_BUILDER.md)