# 🛠️ Tool Development Guide
## Complete Reference for Creating Agent-Lab Tools

**Version**: 2.0  
**Date**: 2025-09-01  
**Audience**: Tool Developers

---

## 📋 Tool Definition Standard

### TypeScript Interface
```typescript
interface ToolDefinition {
  id: string;                    // Unique identifier (kebab-case)
  name: string;                  // Human-readable name
  description: string;           // Brief tool description
  params: ToolParameter[];       // Input parameters
  call: (params: any) => Promise<any>; // Execution function
  
  // Optional metadata
  version?: string;              // Semantic version
  author?: string;               // Creator information
  category?: string;             // Tool classification
  tags?: string[];               // Searchable keywords
  dependencies?: string[];       // Required npm packages
}

interface ToolParameter {
  name: string;                  // Parameter name
  type: ParameterType;           // Data type
  required: boolean;             // Is parameter mandatory
  description: string;           // Parameter explanation
  default?: any;                 // Default value
  options?: string[];            // Allowed values (for enums)
  pattern?: string;              // Validation regex
  minimum?: number;              // Min value (numbers)
  maximum?: number;              // Max value (numbers)
}

type ParameterType = "string" | "number" | "boolean" | "array" | "object";
```

## 🎯 Tool Implementation Template

### Basic Tool Structure
```typescript
// tools/implementations/example-tool.ts
import type { ToolDefinition } from "../tool-types.ts";

export const ExampleTool: ToolDefinition = {
  id: "example-tool",
  name: "Example Tool",
  description: "Template for creating new tools",
  params: [
    {
      name: "input",
      type: "string",
      required: true,
      description: "Primary input parameter"
    },
    {
      name: "options",
      type: "string",
      required: false,
      default: "default",
      options: ["option1", "option2", "option3"],
      description: "Configuration options"
    }
  ],

  async call({ input, options = "default" }) {
    // Validate required parameters
    if (!input) {
      throw new Error("Missing required parameter: input");
    }

    try {
      // Tool implementation logic
      const result = await processInput(input, options);
      
      // Return standardized response
      return {
        success: true,
        data: result,
        metadata: {
          tool: "example-tool",
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime
        }
      };
    } catch (error: any) {
      throw new Error(`Example Tool failed: ${error.message}`);
    }
  }
};
```

## 📖 Existing Tool Documentation

### 1. Yahoo Finance Tool
**Purpose**: Fetch real-time stock market data  
**Category**: Finance & Trading  
**Status**: ✅ Production Ready

```yaml
Tool ID: yahoo-finance
Parameters:
  symbol:     string  ✅ Required  # Stock ticker (e.g., TSLA, AAPL)
  module:     string  ❌ Optional  # "quote" or "chart" 
  range:      string  ❌ Optional  # Time range for charts
  interval:   string  ❌ Optional  # Chart interval

Example Usage:
  symbol: "TSLA"
  module: "quote"

Example Response:
  {
    "symbol": "TSLA",
    "price": 349.60,
    "change": -3.50,
    "percentChange": -0.99,
    "marketState": "REGULAR",
    "currency": "USD"
  }

Rate Limits: 100 requests/minute
Dependencies: yahoo-finance2 npm package
```

### 2. Send Email Tool  
**Purpose**: Send emails via SMTP server  
**Category**: Communication  
**Status**: ✅ Production Ready

```yaml
Tool ID: send-email
Parameters:
  to:      string  ✅ Required  # Recipient email address
  subject: string  ✅ Required  # Email subject line
  body:    string  ✅ Required  # Plain text email body
  html:    string  ❌ Optional  # HTML email body (overrides body)
  from:    string  ❌ Optional  # Custom sender (uses SMTP_FROM default)
  cc:      string  ❌ Optional  # CC recipients (comma-separated)
  bcc:     string  ❌ Optional  # BCC recipients (comma-separated)

Example Usage:
  to: "user@example.com"
  subject: "Daily Stock Report"
  body: "Your daily stock analysis is attached."
  html: "<h1>Daily Report</h1><p>Analysis attached.</p>"

Example Response:
  {
    "success": true,
    "messageId": "<abc123@domain.com>",
    "response": "250 OK: queued as 12345"
  }

Environment Variables Required:
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
```

### 3. CLI Tool
**Purpose**: Execute safe shell commands  
**Category**: System Utilities  
**Status**: ✅ Production Ready

```yaml
Tool ID: cli-tool
Parameters:
  command: string  ✅ Required  # Shell command to execute
  args:    array   ❌ Optional  # Command arguments
  timeout: number  ❌ Optional  # Execution timeout (seconds)

Allowed Commands: ls, cat, curl, grep, find, ps, df, date
Blocked Commands: rm, sudo, chmod, passwd, ssh

Example Usage:
  command: "curl"
  args: ["https://api.example.com/data"]
  timeout: 30

Example Response:
  {
    "success": true,
    "stdout": "API response data...",
    "stderr": "",
    "exitCode": 0,
    "executionTime": 1.23
  }
```

## 🚀 Tool Development Workflow

### 1. Planning Phase
```
Define Purpose → Identify Parameters → Research APIs/Libraries → 
Design Error Handling → Plan Testing Strategy
```

### 2. Implementation Phase
```
Create Tool File → Implement Logic → Add Error Handling → 
Write Tests → Update Tool Registry → Document Usage
```

### 3. Integration Phase
```
Register in tool-library.ts → Test in Playground → 
Create Example Agent → Write Documentation → 
Submit for Review
```

### 4. Maintenance Phase
```
Monitor Usage → Handle Bug Reports → Update Dependencies → 
Version Management → Performance Optimization
```

## 🧪 Testing Guidelines

### Unit Testing
```typescript
// tests/tools/example-tool.test.ts
import { ExampleTool } from "../../tools/implementations/example-tool.ts";

describe("ExampleTool", () => {
  test("processes valid input correctly", async () => {
    const result = await ExampleTool.call({
      input: "test data",
      options: "option1"
    });
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  test("handles missing required parameters", async () => {
    await expect(ExampleTool.call({})).rejects.toThrow(
      "Missing required parameter: input"
    );
  });
});
```

### Integration Testing
```typescript
// Test tool within agent context
const agent = new TestAgent({
  tools: ["example-tool"]
});

const result = await agent.run({
  task: "Process test data with example tool"
});

expect(result.toolCalls).toContain("example-tool");
```

## 🔒 Security Best Practices

### Input Validation
```typescript
// Always validate and sanitize inputs
async call({ input, options }) {
  // Type checking
  if (typeof input !== 'string') {
    throw new Error("Input must be a string");
  }
  
  // Length limits
  if (input.length > 10000) {
    throw new Error("Input exceeds maximum length");
  }
  
  // Pattern validation
  if (options && !['option1', 'option2'].includes(options)) {
    throw new Error("Invalid option value");
  }
  
  // Sanitization
  const sanitizedInput = input.replace(/<script.*?>/gi, '');
  
  // Continue with validated input...
}
```

### Credential Management
```typescript
// Use environment variables for secrets
const apiKey = process.env.EXAMPLE_API_KEY;
if (!apiKey) {
  throw new Error("EXAMPLE_API_KEY environment variable required");
}

// Never log or return sensitive data
console.log("API call succeeded"); // ✅ Good
console.log(`API key: ${apiKey}`); // ❌ Never do this

return {
  success: true,
  data: results,
  // apiKey: apiKey  // ❌ Never include credentials in response
};
```

### Error Handling
```typescript
async call(params) {
  try {
    const result = await externalApiCall(params);
    return { success: true, data: result };
  } catch (error: any) {
    // Log error for debugging (without sensitive data)
    console.error(`Tool ${this.id} failed:`, error.message);
    
    // Return user-friendly error
    throw new Error(`${this.name} failed: ${error.message}`);
  }
}
```

## 📊 Tool Categories & Standards

### Finance & Trading
- **Naming**: Use financial terminology
- **Data Format**: Consistent currency, decimal precision
- **Rate Limits**: Respect API quotas
- **Examples**: yahoo-finance, crypto-tracker, fx-rates

### Communication
- **Protocols**: SMTP, HTTP APIs, WebSockets
- **Validation**: Email format, phone numbers
- **Privacy**: No logging of message content
- **Examples**: send-email, slack-notify, teams-webhook

### Web & Data
- **Scraping**: Respect robots.txt, rate limits
- **Parsing**: Handle various formats (JSON, XML, HTML)
- **Caching**: Implement intelligent caching
- **Examples**: web-scraper, api-client, data-parser

### System & Utilities
- **Safety**: Whitelist allowed commands
- **Isolation**: No file system access outside project
- **Monitoring**: Log command execution
- **Examples**: cli-tool, file-reader, process-monitor

## 🔄 Tool Lifecycle Management

### Version Management
```yaml
# Tool versioning in metadata
metadata:
  version: "2.1.0"    # Semantic versioning
  changelog:
    - "2.1.0: Added batch processing support"
    - "2.0.0: Breaking change - new parameter format"
    - "1.5.2: Fixed rate limiting bug"
  
  compatibility:
    minAgentLabVersion: "4.0.0"
    maxAgentLabVersion: "5.x.x"
```

### Deprecation Process
1. **Notice Period**: 30 days advance warning
2. **Migration Guide**: Provide upgrade instructions
3. **Backward Compatibility**: Support old format during transition
4. **Removal**: Clean removal with clear error messages

### Tool Discovery
```typescript
// Tools are auto-discovered from /tools/implementations/
// Must export as: export const ToolNameTool: ToolDefinition
// Must be registered in: /tools/tool-library.ts

import { YahooFinanceTool } from "./implementations/yahoo-finance.ts";
import { SendEmailTool } from "./implementations/send-email.ts";
import { NewExampleTool } from "./implementations/new-example.ts";

const tools: ToolDefinition[] = [
  YahooFinanceTool,
  SendEmailTool,
  NewExampleTool,  // Add new tools here
];
```

## 🎉 Quick Start Checklist

### Creating Your First Tool
- [ ] Copy template from `tools/implementations/example-tool.ts`
- [ ] Update `id`, `name`, `description` 
- [ ] Define `params` array with proper types
- [ ] Implement `call()` function with error handling
- [ ] Add tool to `tools/tool-library.ts` registry
- [ ] Test in Tools Playground UI
- [ ] Create example agent that uses the tool
- [ ] Write documentation following this guide

### Tool Review Criteria
- [ ] Follows TypeScript interface exactly
- [ ] All parameters properly validated
- [ ] Error messages are user-friendly
- [ ] No sensitive data in logs/responses
- [ ] Includes usage examples
- [ ] Performance acceptable (<30s execution)
- [ ] Dependencies documented
- [ ] Rate limits respected

---

*This guide ensures all Agent-Lab tools maintain high quality, security, and usability standards while providing developers with clear implementation patterns.*