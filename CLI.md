# 🚀 Agent-Lab CLI Tool

Fast agent generation from the command line for power users.

## 🎯 **Quick Usage**

### **Interactive Mode** (Recommended for beginners)
```bash
pnpm run agent-cli
```

Follow the prompts to build your agent step-by-step.

### **Command Line Mode** (Fast for power users)
```bash
pnpm run agent-cli "Weather Bot" "Gets weather information" yahoo-finance openai-api
```

## 📋 **Examples**

### **Stock Analysis Agent**
```bash
pnpm run agent-cli "Stock Analyzer" "Analyzes stock performance with AI insights" yahoo-finance openai-api
```

### **Email Assistant Agent** 
```bash
pnpm run agent-cli "Email Bot" "Automated email responses and management" email-sender anthropic-api
```

### **Web Research Agent**
```bash
pnpm run agent-cli "Research Assistant" "Scrapes web data and provides summaries" web-scraper openai-api json-processor
```

### **Simple Data Agent**
```bash
pnpm run agent-cli "Data Parser" "Processes JSON and CSV files" json-processor file-system
```

## 🛠️ **Available Tools**

- `yahoo-finance` - Stock prices and market data
- `openai-api` - GPT models for text generation  
- `anthropic-api` - Claude models for reasoning
- `email-sender` - SMTP email functionality
- `web-scraper` - Website data extraction
- `json-processor` - JSON parsing and transformation
- `file-system` - File read/write operations

## 🎨 **Interactive Mode Walkthrough**

```bash
pnpm run agent-cli

🧪 Agent-Lab CLI - Fast Agent Generator
=====================================

Agent name: My Stock Bot
Description: Analyzes stock performance and trends
Version (0.1): 0.1
System prompt: You are a stock analysis expert. Provide detailed market insights.

Available tools:
  1. yahoo-finance
  2. openai-api
  3. anthropic-api
  4. email-sender
  5. web-scraper
  6. json-processor
  7. file-system

Select tools (comma-separated numbers): 1,2

Input fields (comma-separated): symbol:string,period:string
Output fields (comma-separated): analysis:string,price:number,recommendation:string

✅ Agent generated successfully!
📁 File: /agents/my-stock-bot.agent.ts
🚀 Tools: yahoo-finance, openai-api
```

## ✅ **After Generation**

1. **Restart the Agent-Lab server** (if running)
2. **Go to** `http://localhost:5173`
3. **Click** Agents → ▶️ Run Agents  
4. **Find your new agent** in the list
5. **Test it** with sample inputs!

## 🔄 **Development Workflow**

```bash
# Create agent quickly
pnpm run agent-cli "Test Bot" "My test agent" openai-api

# Start servers
./start-agent-lab.sh

# Test in browser
# http://localhost:5173

# Iterate and refine
# Edit the generated .agent.ts file as needed
```

## 🎯 **Why Use the CLI?**

- **⚡ Speed**: Generate agents in 30 seconds
- **🔧 Power User Friendly**: Scriptable and automatable  
- **🛠️ Early Development**: Perfect for rapid prototyping
- **📝 Consistent**: Uses the same template system as the UI
- **🔄 Reproducible**: Easy to version control your agent configs

Perfect for the early days when you want to create many test agents quickly! 🚀