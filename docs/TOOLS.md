# Tool Integration Guide

Complete guide to using and creating tools in Agent-Lab v4.0.1.

---

## 🛠️ Overview

Tools are the building blocks that give your agents real-world capabilities. They connect agents to APIs, databases, services, and systems to perform actual work beyond just text generation.

### Tool Architecture
```
Agent Request → Tool Selection → API/Service Call → Structured Response → Agent Processing
```

---

## 📦 Built-in Tools

### 💰 Financial & Market Data Tools

#### Yahoo Finance Tool
Real-time financial data and market analysis.

**ID**: `yahoo-finance`

**Capabilities**:
- Real-time stock quotes and prices
- Historical price data and charts
- Technical indicators (SMA, volatility, trends)
- Market sentiment analysis
- Financial metrics and ratios

**Usage in Agents**:
```typescript
// Input schema
{
  "symbol": {
    "type": "string", 
    "required": true,
    "description": "Stock symbol (e.g., AAPL, TSLA, WOW.AX)"
  },
  "period": {
    "type": "string",
    "required": false, 
    "description": "Time period (1d, 5d, 1mo, 3mo, 1y, max)"
  }
}
```

**Generated Code Example**:
```typescript
// Yahoo Finance integration - get real stock data
let stockData = null;
if (input.symbol) {
  try {
    stockData = await YahooFinanceTool.getStockAnalysis(input.symbol, input.period || '1mo');
    this.log("Retrieved stock data for", input.symbol);
  } catch (error: any) {
    this.error("Failed to get stock data:", error.message);
  }
}
```

**Response Format**:
```json
{
  "quote": {
    "currentPrice": 345.98,
    "priceChangePercent": -1.04,
    "volume": 45234567,
    "marketCap": 1102345678900
  },
  "technicalIndicators": {
    "sma20": 342.15,
    "volatility": 0.35,
    "trend": "bullish"
  },
  "analysis": {
    "riskLevel": "medium",
    "recommendation": "hold"
  }
}
```

**Use Cases**:
- Portfolio tracking agents
- Stock analysis and recommendations  
- Market monitoring alerts
- Financial reporting automation

---

### 🤖 AI & Language Model Tools

#### OpenAI API Tool
GPT-4 and GPT-3.5 integration for advanced AI capabilities.

**ID**: `openai-api`

**Requirements**: 
- OpenAI API key in `.env` file: `OPENAI_API_KEY=your_key`

**Capabilities**:
- Text analysis and generation
- Data interpretation and insights
- Content creation and editing
- Code analysis and generation
- Complex reasoning and problem-solving

**Generated Code Example**:
```typescript
// AI analysis of data
let aiAnalysis = null;
const openaiKey = this.getOpenAIKey();
if (openaiKey && stockData) {
  try {
    aiAnalysis = await OpenAITool.analyzeStockData(openaiKey, stockData, this.config.systemPrompt);
    this.log("Generated AI analysis with GPT-4");
  } catch (error: any) {
    this.error("OpenAI analysis failed:", error.message);
  }
}
```

**Methods Available**:
- `OpenAITool.analyzeStockData(apiKey, stockData, prompt)`: Financial analysis
- `OpenAITool.analyze(apiKey, data, prompt)`: General data analysis
- `OpenAITool.generateText(apiKey, prompt, context)`: Text generation

**Use Cases**:
- Data analysis and interpretation
- Content generation and editing
- Research and insights
- Decision support systems

#### Anthropic API Tool
Claude integration for comprehensive reasoning and analysis.

**ID**: `anthropic-api`

**Requirements**:
- Anthropic API key in `.env` file: `ANTHROPIC_API_KEY=your_key`

**Capabilities**:
- Advanced reasoning and logic
- Long-form analysis and research
- Ethical and safety considerations
- Complex document processing
- Nuanced understanding of context

**Generated Code Example**:
```typescript
// AI analysis of data  
let aiAnalysis = null;
const anthropicKey = this.getAnthropicKey();
if (anthropicKey && stockData) {
  try {
    aiAnalysis = await AnthropicTool.analyzeStockData(anthropicKey, stockData, this.config.systemPrompt);
    this.log("Generated AI analysis with Claude");
  } catch (error: any) {
    this.error("Claude analysis failed:", error.message);
  }
}
```

**Use Cases**:
- Complex analysis and research
- Ethical decision making
- Long-form content creation
- Multi-step reasoning tasks

---

### 🖥️ System & Development Tools

#### CLI Tool
Safe shell command execution with filtering and monitoring.

**ID**: `cli-tool`

**Capabilities**:
- Execute shell commands safely
- Capture stdout, stderr, and exit codes
- Working directory management
- Command timeout handling
- Security filtering (whitelist-based)

**Usage in Agents**:
```typescript
// Input schema
{
  "command": {
    "type": "string",
    "required": true,
    "description": "Shell command to execute (e.g., 'ls -la', 'ps aux')"
  },
  "commands": {
    "type": "array", 
    "required": false,
    "description": "Multiple commands to execute sequentially"
  }
}
```

**Generated Code Example**:
```typescript
// CLI Tool integration - execute shell commands
let cliResults = [];
if (input.command || input.commands) {
  const commands = Array.isArray(input.commands) ? input.commands : [input.command].filter(Boolean);
  
  for (const cmd of commands) {
    try {
      if (typeof cmd === 'string') {
        const [command, ...args] = cmd.split(' ');
        const result = await CLITool.executeCommand(command, args);
        cliResults.push({ command: cmd, ...result });
        this.log(`Executed: ${cmd}`, result.success ? '✅' : '❌');
      }
    } catch (error: any) {
      this.error("CLI command failed:", error.message);
      cliResults.push({ command: cmd, success: false, error: error.message });
    }
  }
}
```

**Response Format**:
```json
{
  "command": "ls -la",
  "success": true,
  "stdout": "total 1784\ndrwxr-xr-x  30 rob  staff   960 29 Aug 19:24 .",
  "stderr": "",
  "exitCode": 0,
  "workingDirectory": "/Users/rob/dev/agent-lab/server",
  "executionTime": 18
}
```

**Security Features**:
- Command whitelist filtering
- Working directory restrictions
- Timeout prevention
- Output size limits
- Dangerous command blocking

**Use Cases**:
- System monitoring and health checks
- File operations and management
- Development and deployment automation
- Log analysis and processing

---

### 📚 Data & Knowledge Tools

#### RAG Query Tool
Query your document knowledge base with semantic search.

**ID**: `rag-query`

**Requirements**:
- RAG server running (`POST /rag/start`)
- Documents ingested into vector database

**Capabilities**:
- Semantic document search
- Context-aware answers
- Source attribution
- Multi-document synthesis
- Relevance scoring

**Usage Example**:
```typescript
// RAG integration for document queries
const ragResponse = await fetch('http://localhost:8000/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: input.question,
    k: 5,
    model: 'gpt-4'
  })
});
```

**Use Cases**:
- Document Q&A systems
- Research and knowledge retrieval
- Support ticket automation
- Compliance and policy queries

---

## 🔧 Creating Custom Tools

### Tool Development Process

1. **Create Implementation File**
2. **Register in Tool Library** 
3. **Add to Agent Builder**
4. **Test Integration**

### Step 1: Create Tool Implementation

Create a new file in `server/tools/implementations/`:

```typescript
// server/tools/implementations/weather-tool.ts

export class WeatherTool {
  /**
   * Get weather data for a location
   */
  static async getWeatherData(location: string, apiKey: string): Promise<any> {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        location: data.name,
        temperature: data.main.temp,
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        timestamp: new Date().toISOString()
      };
      
    } catch (error: any) {
      console.error('WeatherTool error:', error.message);
      throw new Error(`Failed to get weather data: ${error.message}`);
    }
  }

  /**
   * Get weather forecast
   */
  static async getForecast(location: string, days: number = 5): Promise<any> {
    // Implementation for forecast data
    // ...
  }
}
```

### Step 2: Register in Tool Library

Add your tool to `server/tools/tool-library.ts`:

```typescript
// server/tools/tool-library.ts

export const AVAILABLE_TOOLS = {
  // ... existing tools
  
  'weather-tool': {
    id: 'weather-tool',
    name: 'Weather API',
    description: 'Get current weather and forecasts for any location',
    category: 'external-api',
    requiresApiKey: true,
    apiKeyEnvVar: 'WEATHER_API_KEY',
    implementation: 'weather-tool.ts',
    methods: [
      {
        name: 'getWeatherData',
        description: 'Get current weather for a location',
        parameters: {
          location: { type: 'string', required: true },
          apiKey: { type: 'string', required: true }
        }
      },
      {
        name: 'getForecast', 
        description: 'Get weather forecast',
        parameters: {
          location: { type: 'string', required: true },
          days: { type: 'number', required: false, default: 5 }
        }
      }
    ]
  }
};
```

### Step 3: Update Agent Template

The agent template will automatically generate integration code based on your tool registration:

```typescript
// Generated in agent template for weather-tool
import { WeatherTool } from "../server/tools/implementations/weather-tool.ts";

// In execute method:
if (hasWeatherTool) {
  logic += `      // Weather Tool integration\n`;
  logic += `      let weatherData = null;\n`;
  logic += `      if (input.location) {\n`;
  logic += `        try {\n`;
  logic += `          const apiKey = process.env.WEATHER_API_KEY;\n`;
  logic += `          if (!apiKey) throw new Error("Weather API key not configured");\n`;
  logic += `          weatherData = await WeatherTool.getWeatherData(input.location, apiKey);\n`;
  logic += `          this.log("Retrieved weather data for", input.location);\n`;
  logic += `        } catch (error: any) {\n`;
  logic += `          this.error("Weather API failed:", error.message);\n`;
  logic += `        }\n`;
  logic += `      }\n\n`;
}
```

### Step 4: Environment Setup

Add required environment variables to `.env`:

```bash
# Weather API configuration
WEATHER_API_KEY=your_weather_api_key_here
```

### Step 5: Test Your Tool

Create a test agent using the Agent Builder:

1. **Select your tool** in the tool picker
2. **Define input schema** with location field
3. **Define output schema** with weather fields
4. **Save and test** the agent

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"agent":"weather-bot","args":["New York"]}' \
  http://localhost:3001/run
```

---

## 🔍 Advanced Tool Patterns

### Async Tool with Progress Updates

```typescript
export class LongRunningTool {
  static async processLargeDataset(data: any[], callback?: (progress: number) => void): Promise<any> {
    const results = [];
    
    for (let i = 0; i < data.length; i++) {
      // Process item
      const result = await this.processItem(data[i]);
      results.push(result);
      
      // Report progress
      const progress = ((i + 1) / data.length) * 100;
      if (callback) callback(progress);
    }
    
    return results;
  }
}
```

### Tool with Caching

```typescript
export class CachedAPITool {
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static async getData(key: string): Promise<any> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.data;
    }
    
    // Fetch fresh data
    const data = await this.fetchFromAPI(key);
    
    // Update cache
    this.cache.set(key, { data, timestamp: Date.now() });
    
    return data;
  }
}
```

### Tool with Error Recovery

```typescript
export class ResilientTool {
  static async callWithRetry(operation: () => Promise<any>, maxRetries = 3): Promise<any> {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }
    
    throw new Error(`Operation failed after ${maxRetries} attempts: ${lastError.message}`);
  }
}
```

---

## 📊 Tool Performance & Monitoring

### Performance Metrics

Track tool performance in your implementations:

```typescript
export class MonitoredTool {
  static async performOperation(input: any): Promise<any> {
    const startTime = Date.now();
    
    try {
      const result = await this.doWork(input);
      
      // Log success metrics
      const duration = Date.now() - startTime;
      console.log(`Tool operation completed in ${duration}ms`);
      
      return result;
    } catch (error: any) {
      // Log error metrics
      const duration = Date.now() - startTime;
      console.error(`Tool operation failed after ${duration}ms:`, error.message);
      throw error;
    }
  }
}
```

### Error Handling Best Practices

```typescript
export class RobustTool {
  static async safeOperation(input: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Validate input
      if (!this.validateInput(input)) {
        return { success: false, error: "Invalid input parameters" };
      }
      
      // Perform operation
      const data = await this.performOperation(input);
      
      return { success: true, data };
      
    } catch (error: any) {
      // Return structured error
      return { 
        success: false, 
        error: error.message || "Unknown error occurred" 
      };
    }
  }
  
  private static validateInput(input: any): boolean {
    // Implement validation logic
    return input && typeof input === 'object';
  }
}
```

---

## 🔒 Security Considerations

### API Key Management

```typescript
export class SecureTool {
  private static getApiKey(keyName: string): string {
    const key = process.env[keyName];
    if (!key) {
      throw new Error(`API key ${keyName} not configured in environment`);
    }
    return key;
  }
  
  static async secureApiCall(endpoint: string): Promise<any> {
    const apiKey = this.getApiKey('MY_API_KEY');
    
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'Agent-Lab/4.0.1'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }
}
```

### Input Sanitization

```typescript
export class SafeTool {
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>'"&]/g, '') // Remove HTML/XML chars
      .replace(/[;|&`$(){}[\]]/g, '') // Remove shell chars
      .trim()
      .substring(0, 1000); // Limit length
  }
  
  static async processUserInput(userInput: string): Promise<any> {
    const sanitized = this.sanitizeInput(userInput);
    
    if (sanitized !== userInput) {
      console.warn('Input was sanitized for security');
    }
    
    return this.performOperation(sanitized);
  }
}
```

---

## 📚 Tool Examples

### Database Query Tool

```typescript
// server/tools/implementations/database-tool.ts
import { Pool } from 'pg';

export class DatabaseTool {
  private static pool: Pool;
  
  static async query(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.pool) {
      this.pool = new Pool({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
      });
    }
    
    try {
      const result = await this.pool.query(sql, params);
      return result.rows;
    } catch (error: any) {
      console.error('Database query failed:', error.message);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }
}
```

### Email Notification Tool

```typescript
// server/tools/implementations/email-tool.ts
import nodemailer from 'nodemailer';

export class EmailTool {
  private static transporter: any;
  
  static async sendEmail(to: string, subject: string, content: string): Promise<boolean> {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }
    
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject,
        html: content
      });
      
      return true;
    } catch (error: any) {
      console.error('Email send failed:', error.message);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}
```

### File Processing Tool

```typescript
// server/tools/implementations/file-tool.ts
import fs from 'fs/promises';
import path from 'path';

export class FileTool {
  static async readTextFile(filePath: string): Promise<string> {
    try {
      // Security: ensure file is within allowed directory
      const safePath = path.resolve(process.cwd(), filePath);
      if (!safePath.startsWith(process.cwd())) {
        throw new Error('File access outside working directory not allowed');
      }
      
      const content = await fs.readFile(safePath, 'utf-8');
      return content;
    } catch (error: any) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }
  
  static async listFiles(directory: string): Promise<string[]> {
    try {
      const files = await fs.readdir(directory);
      return files.filter(file => !file.startsWith('.'));
    } catch (error: any) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }
}
```

---

## 🚀 Next Steps

- **[API Reference](API.md)**: Full API documentation
- **[Agent Builder Guide](AGENT_BUILDER.md)**: Visual agent creation
- **[Deployment Guide](DEPLOYMENT.md)**: Production setup
- **[RAG Integration](RAG.md)**: Document knowledge systems

---

**Ready to build custom tools for your agents?** 🛠️

Start with simple API integrations and gradually add more sophisticated capabilities!