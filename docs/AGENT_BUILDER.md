# Agent Builder UI Documentation

Complete guide to using the visual Agent Builder interface in Agent-Lab v4.0.1.

---

## 🎯 Overview

The Agent Builder is a visual interface that lets you create powerful AI agents without writing code. It provides a step-by-step wizard to define your agent's capabilities, tools, and behavior.

### Key Features
- **Visual Interface**: No coding required
- **Real-time Preview**: See generated code as you build
- **Tool Integration**: Connect to APIs, databases, and services
- **Schema Validation**: Define input/output structures  
- **Instant Deployment**: Agents are ready to use immediately

---

## 🚀 Getting Started

### 1. Access the Agent Builder

1. **Start Agent-Lab**: Run `./start-agent-lab.sh`
2. **Open UI**: Navigate to http://localhost:5173
3. **Go to Agents Tab**: Click "Agents" in the top navigation
4. **Start Building**: Click "Create New Agent"

### 2. Agent Builder Interface

The interface consists of several main sections:

```
┌─────────────────────────────────────────────────────┐
│  Agent Builder                    [Load] [Save]      │
├─────────────────────┬───────────────────────────────┤
│                     │                               │
│   Builder Form      │     Live Code Preview         │
│                     │                               │
│   • Metadata        │   Generated TypeScript agent  │
│   • Tools           │   code with real-time updates │
│   • Input Schema    │                               │
│   • Output Schema   │                               │
│                     │                               │
└─────────────────────┴───────────────────────────────┘
```

---

## 📝 Step-by-Step Guide

### Step 1: Agent Metadata

Define the basic properties of your agent:

**Name** *(required)*
- Short, descriptive name (e.g., "Stock Analyzer", "System Monitor")
- Used for API calls and file generation
- Should be unique across your agents

**Description** *(required)*  
- Brief explanation of what the agent does
- Helps with organization and documentation
- Example: "Analyzes stock prices and provides investment recommendations"

**Version** *(required)*
- Semantic versioning (e.g., "1.0", "2.1.3")
- Used for tracking agent evolution
- Start with "1.0" for new agents

**System Prompt** *(optional)*
- Instructions for the AI model behavior
- Defines personality, expertise, and response style
- Example: "You are a financial expert. Provide detailed analysis with risk assessments."

### Step 2: Tool Selection

Choose the tools your agent can use:

#### Available Tools

**Financial & Market Data**
- **Yahoo Finance**: Real-time stock data, financial metrics
  - Use for: Stock analysis, market research, portfolio tracking
  - Requires: Stock symbols (e.g., AAPL, TSLA)

**AI & Language Models**
- **OpenAI API**: GPT-4 for analysis and text generation
  - Use for: Data analysis, content generation, reasoning
  - Requires: OpenAI API key in environment
  
- **Anthropic API**: Claude for comprehensive reasoning
  - Use for: Complex analysis, research, content creation
  - Requires: Anthropic API key in environment

**System & Development**  
- **CLI Tool**: Safe shell command execution
  - Use for: System monitoring, file operations, automation
  - Built-in command filtering for security

**Data & Knowledge**
- **RAG Query**: Search your document knowledge base
  - Use for: Document Q&A, research, information retrieval
  - Requires: Documents ingested into RAG system

#### Tool Selection Tips
- **Start Simple**: Begin with 1-2 tools for focused functionality
- **Combine Wisely**: Yahoo Finance + OpenAI = Stock analysis with AI insights
- **Consider Dependencies**: Some tools require API keys or setup

### Step 3: Input Schema Definition

Define what data your agent expects:

#### Schema Fields
Each input field needs:
- **Key**: Field name (e.g., "symbol", "query", "command")
- **Type**: Data type (string, number, boolean, array, object)
- **Required**: Whether the field is mandatory
- **Description**: Help text for users

#### Common Input Patterns

**Stock Analysis Agent**
```json
{
  "symbol": {
    "type": "string",
    "required": true, 
    "description": "Stock symbol (e.g., AAPL, TSLA)"
  },
  "period": {
    "type": "string",
    "required": false,
    "description": "Analysis period (1d, 1mo, 1y)"
  }
}
```

**System Explorer Agent**
```json
{
  "command": {
    "type": "string",
    "required": true,
    "description": "Shell command to execute"
  }
}
```

**Research Agent**
```json
{
  "question": {
    "type": "string", 
    "required": true,
    "description": "Research question"
  },
  "sources": {
    "type": "array",
    "required": false,
    "description": "Specific documents to search"
  }
}
```

### Step 4: Output Schema Definition  

Define the structure of your agent's response:

#### Output Design Principles
- **Consistent Structure**: Always return the same fields
- **Rich Data**: Include metadata, timestamps, confidence scores
- **User-Friendly**: Make outputs easy to understand and use

#### Common Output Patterns

**Stock Analysis Output**
```json
{
  "current_price": {
    "type": "number",
    "required": true,
    "description": "Current stock price"
  },
  "price_change": {
    "type": "number", 
    "required": true,
    "description": "Price change percentage"
  },
  "analysis": {
    "type": "string",
    "required": true,
    "description": "AI-generated analysis"
  },
  "recommendation": {
    "type": "string",
    "required": true, 
    "description": "Buy/Hold/Sell recommendation"
  },
  "risk_level": {
    "type": "string",
    "required": true,
    "description": "Risk assessment (Low/Medium/High)"
  }
}
```

**System Command Output**
```json
{
  "task_completed": {
    "type": "string",
    "required": true,
    "description": "Summary of completed task"
  },
  "commands_executed": {
    "type": "array", 
    "required": true,
    "description": "List of executed commands"
  },
  "results": {
    "type": "array",
    "required": true,
    "description": "Detailed command results"
  }
}
```

---

## 🔍 Live Code Preview

The right panel shows the generated TypeScript code in real-time:

### Generated Code Structure
```typescript
// Auto-generated agent class
export class MyAgentAgent extends BaseAgent {
  constructor() {
    super({
      name: "My Agent",
      description: "My agent description",
      tools: ["selected-tools"],
      inputSchema: { /* your input schema */ },
      outputSchema: { /* your output schema */ }
    });
  }

  protected async execute(input: Record<string, any>): Promise<any> {
    // Generated tool integration logic
    // - API calls to selected tools
    // - Data processing and analysis
    // - Structured output generation
    
    return {
      // Structured response matching your output schema
    };
  }
}
```

### Code Preview Features
- **Syntax Highlighting**: Easy-to-read TypeScript code
- **Real-time Updates**: Changes reflect immediately
- **Tool Integration**: See actual API calls being generated
- **Error Detection**: Spot issues before saving

---

## 💾 Saving and Managing Agents

### Save New Agent

1. **Complete the Form**: Fill all required fields
2. **Review Preview**: Check generated code looks correct
3. **Click Save**: Agent is generated and deployed
4. **Success Message**: Confirmation with file path

### Load Existing Agent

1. **Click Load Button**: Opens agent selector
2. **Choose Agent**: Pick from list of existing agents
3. **Form Populates**: All fields filled from agent file
4. **Edit and Save**: Make changes and save updated version

### Agent Files

Generated agents are saved as:
```
agents/my-agent-name.agent.ts
```

**File Contents:**
- Complete TypeScript class
- Tool imports and integrations
- Input/output validation
- Execution logic
- Export statements for compatibility

---

## 🧪 Testing Your Agent

### Via UI (Coming Soon)
- Built-in test interface
- Input form based on schema
- Real-time execution
- Output visualization

### Via API
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"agent":"my-agent","args":["param1","param2"]}' \
  http://localhost:3001/run
```

### Via CLI
```bash
pnpm run agent-cli my-agent param1 param2
```

---

## 🎨 Best Practices

### Agent Design
1. **Single Purpose**: Each agent should have one clear function
2. **Clear Naming**: Use descriptive names that explain functionality
3. **Comprehensive Prompts**: Detailed system prompts improve AI behavior
4. **Robust Schemas**: Define all expected inputs and outputs

### Tool Selection
1. **Minimal Set**: Only include tools you actually need
2. **Logical Combinations**: Yahoo Finance + OpenAI for financial analysis
3. **Consider Costs**: API tools may have usage costs
4. **Test Thoroughly**: Verify all tool integrations work

### Schema Design
1. **Required Fields**: Mark essential inputs as required
2. **Clear Descriptions**: Help users understand each field
3. **Appropriate Types**: Choose correct data types for validation
4. **Rich Outputs**: Include metadata and context in responses

---

## 🔧 Advanced Features

### Custom Tool Integration

Want to add your own tools? 

1. **Create Tool Implementation**:
```typescript
// server/tools/implementations/my-tool.ts
export class MyTool {
  static async process(data: any): Promise<any> {
    // Your tool logic
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
    description: 'Does something awesome'
  }
};
```

3. **Appears in UI**: Your tool will show up in the tool selector

### Agent Templates

Create reusable templates for common agent patterns:

```typescript
// Save common configurations
const stockAgentTemplate = {
  tools: ["yahoo-finance", "openai-api"],
  inputSchema: {
    symbol: { type: "string", required: true }
  },
  outputSchema: {
    price: { type: "number", required: true },
    analysis: { type: "string", required: true }
  }
};
```

### Environment Configuration

Set up different configurations for development vs production:

```bash
# .env.development
OPENAI_API_KEY=dev_key
DEBUG=true

# .env.production  
OPENAI_API_KEY=prod_key
RATE_LIMIT=1000
```

---

## ❌ Common Issues & Solutions

### Agent Not Appearing
- **Problem**: Created agent doesn't show up in lists
- **Solution**: Check server logs, restart server, verify file permissions

### Tool Errors
- **Problem**: Tools failing during execution
- **Solution**: Verify API keys in `.env`, check network connectivity

### Schema Validation Errors  
- **Problem**: Agent rejects inputs that should be valid
- **Solution**: Review schema definitions, check required fields

### Code Generation Issues
- **Problem**: Generated code has syntax errors
- **Solution**: Check for special characters in names/descriptions

### Performance Issues
- **Problem**: Agents running slowly
- **Solution**: Reduce tool complexity, optimize prompts, check API limits

---

## 📊 Example Workflows

### Create a Stock Analysis Bot

1. **Metadata**:
   - Name: "Stock Analyzer Pro"
   - Description: "Professional stock analysis with AI insights"
   - System Prompt: "You are a financial analyst. Provide detailed analysis with risk assessments."

2. **Tools**: Select "yahoo-finance" and "openai-api"

3. **Input Schema**:
   ```json
   {
     "symbol": {
       "type": "string",
       "required": true,
       "description": "Stock symbol (e.g., AAPL)"
     }
   }
   ```

4. **Output Schema**:
   ```json
   {
     "current_price": {"type": "number", "required": true},
     "analysis": {"type": "string", "required": true},
     "recommendation": {"type": "string", "required": true}
   }
   ```

5. **Save and Test**: Agent ready for stock analysis!

### Create a System Monitor

1. **Metadata**:
   - Name: "System Monitor"
   - Description: "Monitors system health and performance"
   - System Prompt: "You are a system administrator. Provide clear, actionable insights."

2. **Tools**: Select "cli-tool"

3. **Input Schema**:
   ```json
   {
     "check_type": {
       "type": "string", 
       "required": true,
       "description": "Type of check (disk, memory, cpu)"
     }
   }
   ```

4. **Output Schema**:
   ```json
   {
     "status": {"type": "string", "required": true},
     "details": {"type": "object", "required": true},
     "recommendations": {"type": "array", "required": false}
   }
   ```

5. **Save and Deploy**: System monitoring agent ready!

---

## 📚 Next Steps

- **[Tool Development Guide](TOOLS.md)**: Create custom tools
- **[API Reference](API.md)**: Integrate with external systems
- **[Deployment Guide](DEPLOYMENT.md)**: Production setup
- **[RAG Integration](RAG.md)**: Add document knowledge

---

**Ready to build powerful AI agents visually?** 🎨

Start with simple agents and gradually add more sophisticated capabilities as you learn the platform!