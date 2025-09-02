# 🤖 Agent Schema Documentation
## Complete Guide to Agent Definition & Configuration

**Version**: 2.0  
**Date**: 2025-09-01  
**Audience**: Developers & Advanced Users

---

## 📋 Agent Definition Structure

### YAML Schema
```yaml
# Required fields
name: string                 # Human-readable agent name
role: string                 # Agent's primary function/specialty  
tools: string[]             # Array of tool IDs from tool library
model: string               # LLM model identifier

# Core configuration
systemPrompt: string        # Instructions defining agent behavior
inputSchema: object         # Expected input parameters
outputSchema: object        # Expected output format

# Optional metadata
metadata:
  version: string           # Semantic versioning (e.g., "1.2.0")
  author: string            # Creator name/email
  created: string           # ISO timestamp
  updated: string           # Last modification timestamp
  description: string       # Detailed agent description
  tags: string[]           # Searchable keywords
  category: string         # Agent classification

# Advanced configuration (optional)
config:
  timeout: number          # Max execution time (seconds)
  retries: number          # Failed execution retry attempts
  temperature: number      # LLM creativity (0.0-1.0)
  maxTokens: number        # Maximum response length
  
# Execution constraints (optional)
constraints:
  maxToolCalls: number     # Limit tool usage per execution
  allowedDomains: string[] # Web scraping domain whitelist
  rateLimits:              # Tool-specific rate limiting
    yahoo-finance: "10/minute"
    send-email: "5/minute"
```

## 🏗️ Schema Definitions

### Input/Output Schema Format
```yaml
inputSchema:
  query:
    type: "string"
    required: true
    description: "User question or task"
    example: "Analyze TSLA stock performance"
  
  timeframe:
    type: "string" 
    required: false
    default: "1d"
    options: ["1d", "5d", "1mo", "3mo", "1y"]
    description: "Analysis time period"

outputSchema:
  analysis:
    type: "string"
    required: true
    description: "Detailed stock analysis"
    
  recommendation:
    type: "string"
    required: true
    enum: ["buy", "hold", "sell"]
    description: "Investment recommendation"
    
  confidence:
    type: "number"
    required: true
    minimum: 0
    maximum: 100
    description: "Confidence percentage"
    
  data:
    type: "object"
    required: false
    description: "Raw data used in analysis"
```

## 📚 Complete Examples

### Example 1: Stock Analysis Agent
```yaml
# /agents/stock-analyst.agent.yaml
name: "Stock Market Analyst"
role: "Professional financial analyst specializing in equity research"
tools: ["yahoo-finance", "send-email", "web-scraper"]
model: "claude-3-5-sonnet-20241022"

systemPrompt: |
  You are a professional stock analyst with 10+ years of experience.
  
  Your responsibilities:
  1. Fetch current stock data using Yahoo Finance
  2. Analyze price trends, volume, and market indicators
  3. Research recent news and company developments
  4. Provide clear buy/hold/sell recommendations
  5. Include risk assessment and disclaimers
  6. Email formatted reports when requested
  
  Guidelines:
  - Always include confidence levels (0-100%)
  - Provide both technical and fundamental analysis
  - Use clear, professional language
  - Include relevant market context
  - Never give financial advice, only analysis

inputSchema:
  symbol:
    type: "string"
    required: true
    description: "Stock ticker symbol (e.g., TSLA, AAPL)"
    pattern: "^[A-Z]{1,5}(\\.AX)?$"
  
  analysisType:
    type: "string"
    required: false
    default: "full"
    options: ["quick", "full", "technical", "fundamental"]
    description: "Type of analysis to perform"
  
  emailReport:
    type: "boolean"
    required: false
    default: false
    description: "Email the analysis report"
  
  recipient:
    type: "string"
    required: false
    description: "Email recipient (required if emailReport=true)"

outputSchema:
  symbol:
    type: "string"
    description: "Analyzed stock symbol"
  
  currentPrice:
    type: "number"
    description: "Current stock price"
  
  priceChange:
    type: "number" 
    description: "Price change from previous close"
    
  analysis:
    type: "string"
    description: "Detailed analysis report"
  
  recommendation:
    type: "string"
    enum: ["buy", "hold", "sell"]
    description: "Investment recommendation"
  
  confidence:
    type: "number"
    minimum: 0
    maximum: 100
    description: "Confidence in recommendation (%)"
  
  riskFactors:
    type: "array"
    items: "string"
    description: "Identified risk factors"
  
  emailSent:
    type: "boolean"
    description: "Whether email report was sent"

metadata:
  version: "1.2.0"
  author: "Agent-Lab Team"
  created: "2025-09-01T00:00:00Z"
  description: "Comprehensive stock analysis with optional email reporting"
  tags: ["finance", "stocks", "analysis", "email"]
  category: "financial"

config:
  timeout: 120
  retries: 2
  temperature: 0.3
  maxTokens: 2000

constraints:
  maxToolCalls: 10
  rateLimits:
    yahoo-finance: "20/minute"
    send-email: "3/minute"
```

### Example 2: Research Assistant Agent
```yaml
# /agents/research-assistant.agent.yaml
name: "Research Assistant"
role: "Academic and business research specialist"
tools: ["web-scraper", "rag-query", "send-email"]
model: "gpt-4o-mini"

systemPrompt: |
  You are a research assistant helping users gather, analyze, and 
  synthesize information from multiple sources.
  
  Your process:
  1. Break down research questions into searchable components
  2. Gather information from web sources and documents
  3. Cross-reference and validate findings
  4. Synthesize insights into clear, actionable reports
  5. Cite all sources properly
  
  Quality standards:
  - Verify information from multiple sources
  - Flag conflicting or uncertain information
  - Use academic citation format
  - Provide confidence ratings for findings

inputSchema:
  topic:
    type: "string"
    required: true
    description: "Research topic or question"
  
  sources:
    type: "array"
    items: "string"
    required: false
    description: "Specific sources to prioritize"
  
  depth:
    type: "string"
    required: false
    default: "standard"
    options: ["quick", "standard", "comprehensive"]
    description: "Research depth level"

outputSchema:
  summary:
    type: "string"
    description: "Executive summary of findings"
  
  keyFindings:
    type: "array"
    items: "string" 
    description: "Main insights discovered"
  
  sources:
    type: "array"
    items: "object"
    description: "Source citations with confidence ratings"
  
  recommendations:
    type: "array"
    items: "string"
    description: "Actionable next steps"
  
  confidence:
    type: "number"
    minimum: 0
    maximum: 100
    description: "Overall confidence in research quality"

metadata:
  version: "1.0.0"
  author: "Agent-Lab Team"
  created: "2025-09-01T00:00:00Z"
  tags: ["research", "analysis", "web", "documents"]
  category: "research"
```

### Example 3: Simple Email Bot
```yaml
# /agents/email-bot.agent.yaml
name: "Email Bot"
role: "Simple email sending assistant"
tools: ["send-email"]
model: "gpt-4o-mini"

systemPrompt: |
  You are an email assistant. Help users send well-formatted emails.
  Always be professional and courteous in tone.

inputSchema:
  recipient:
    type: "string"
    required: true
    description: "Email recipient address"
  
  subject:
    type: "string"
    required: true
    description: "Email subject line"
  
  message:
    type: "string"
    required: true
    description: "Email content"
  
  format:
    type: "string"
    required: false
    default: "professional"
    options: ["casual", "professional", "formal"]
    description: "Email tone and formatting"

outputSchema:
  sent:
    type: "boolean"
    description: "Whether email was successfully sent"
  
  messageId:
    type: "string"
    description: "Email message ID from server"

metadata:
  version: "1.0.0"
  category: "communication"
  tags: ["email", "communication", "simple"]
```

## 🔧 Tool Integration

### Tool Attachment Process
1. Agent YAML lists tool IDs in `tools: []` array
2. At runtime, Agent Runner validates tool availability
3. Tools are loaded from `/tools/implementations/`
4. configSchema provides UI parameter forms
5. Agent can call tools via standardized interface

### Tool Calling Syntax (in Agent execution)
```typescript
// Agent can call tools like this:
const stockData = await this.callTool('yahoo-finance', {
  symbol: 'TSLA',
  module: 'quote'
});

const emailResult = await this.callTool('send-email', {
  to: 'user@example.com',
  subject: 'Stock Analysis Report',
  body: `Analysis for ${stockData.symbol}: ${stockData.price}`
});
```

## 🔍 Validation Rules

### Required Field Validation
- `name`: Must be 1-100 characters, alphanumeric + spaces
- `role`: Must be 10-500 characters, descriptive text
- `tools`: Must be array of valid tool IDs from registry
- `model`: Must be supported LLM model identifier
- `systemPrompt`: Must be 50-5000 characters

### Schema Validation
- `inputSchema`/`outputSchema`: Must follow JSON Schema spec
- Field types: "string", "number", "boolean", "array", "object"
- Required fields must be explicitly marked
- Default values must match field types

### Tool Validation
- All tools in `tools: []` must exist in tool registry
- Tool parameters must match expected configSchema
- Circular dependencies are not allowed
- Maximum 20 tools per agent (performance limit)

## 🎬 Execution Lifecycle

### 1. Agent Loading
```
Load YAML → Validate Schema → Load Tools → Initialize Runtime
```

### 2. Agent Execution
```
Receive Input → Validate Input → Execute SystemPrompt → 
Call Tools → Process Results → Format Output → Return Response
```

### 3. Error Handling
```
Error Occurs → Log Details → Check Retry Policy → 
Retry or Fail → Notify User → Update Status
```

### 4. Result Processing
```
Agent Completes → Validate Output → Save Results → 
Send Notifications → Update Analytics → Clean Up Resources
```

## 🛡️ Security Considerations

### Input Sanitization
- All user inputs validated against schema
- No code execution in configuration files
- Tool parameters sanitized before execution

### Tool Access Control
- Tools declare required permissions
- Agents can only access explicitly granted tools
- Environment variables isolated per tool

### Data Privacy
- No sensitive data in agent configurations
- Execution logs exclude credential information
- Results can be configured as private/public

---

*This schema documentation ensures consistent, secure, and maintainable agent definitions across the Agent-Lab platform.*