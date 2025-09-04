# 🛠 Tool Definition Style Guide

All tools in Agent-Lab must follow the same `ToolDefinition` contract.  
This ensures consistency across Playground, Agent Builder, and automated orchestration.

---

## ✅ Required Structure
```ts
import type { ToolDefinition } from "../tool-types.ts";

export const ExampleTool: ToolDefinition = {
  id: "example-tool",
  name: "Example Tool",
  description: "What the tool does",
  params: [
    { 
      name: "input", 
      type: "string", 
      required: true, 
      description: "The input value" 
    }
  ],
  async call({ input }) {
    if (!input) throw new Error("Missing required param: input");
    return { result: `Processed: ${input}` };
  }
};
```

---

## 🎯 Conventions

### Basic Properties
- **id**: lowercase-kebab-case (e.g., `yahoo-finance`, `send-email`)
- **name**: Human-readable, emoji prefix optional (e.g., `Yahoo Finance API`)
- **description**: Clear one-liner describing purpose

### Parameters (params array)
- **Format**: Array of ToolParam objects
- **Fields**: `name`, `type`, `required`, `description`
- **Types**: `"string"` | `"number"` | `"boolean"` | `"object"`

### Validation & Defaults
- **Required params**: Must be checked inside `call()` function
- **Default values**: Apply inside `call()` function (e.g., `currency = "usd"`)
- **Parameter validation**: Use descriptive error messages

### Error Handling
- **Always**: `throw new Error("Message")`
- **Never**: `console.log` inside return values
- **Format**: Consistent error message pattern

### Return Values
- **JSON-serializable** objects only
- **Structured data** preferred over raw strings
- **Consistent field naming** across similar tools

---

## 📌 Example: Yahoo Finance Tool (Current Standard)

```ts
export const YahooFinanceTool: ToolDefinition = {
  id: "yahoo-finance",
  name: "Yahoo Finance API",
  description: "Get stock quotes and chart data from Yahoo Finance",
  params: [
    { 
      name: "symbol", 
      type: "string", 
      required: true, 
      description: "Ticker symbol (e.g. AAPL, TSLA, VAS.AX)" 
    },
    { 
      name: "module", 
      type: "string", 
      required: false, 
      description: "Type of data to fetch: 'quote' (default) or 'chart'" 
    }
  ],

  async call({ symbol, module = "quote" }) {
    if (!symbol) throw new Error("Missing required param: symbol");

    const quote = await yahooFinance.quote(symbol);
    return {
      symbol: quote.symbol,
      shortName: quote.shortName,
      currency: quote.currency,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      percentChange: quote.regularMarketChangePercent,
      marketTime: quote.regularMarketTime?.toISOString(),
      exchange: quote.fullExchangeName,
    };
  }
};
```

---

## 🧭 Implementation Notes

### File Structure
- Each tool must live under `/tools/implementations/`
- All tools are registered in `/tools/tool-library.ts`
- Documentation for each tool lives in `/docs/tools/<tool-id>.md`

### UI Integration
- The UI automatically converts `params` to form fields
- Type mapping: `string` → text input, `number` → number input, `boolean` → checkbox
- The `toConfigSchema()` function handles this conversion

### Testing
- Use the Tools Playground to test tools interactively
- Test via API: `POST /api/tools/run/:id` with JSON body
- Verify tools work in Agent Builder tool selection

---

## 🔒 Purpose

This style guide ensures:
- Agents can discover and use tools consistently
- Playground generates correct forms for testing
- Contributors know exactly how to build compliant tools
- Tool ecosystem grows cleanly without technical debt

---

## ✅ Current Tool Inventory

All these tools follow the standard:
- **yahoo-finance**: Stock quotes and market data
- **send-email**: SMTP email sending
- **api-caller**: Generic REST API client
- **crypto-price**: Cryptocurrency prices (CoinGecko)
- **weather**: Current weather data (Open-Meteo)

Future tools (Gmail, Calendar, Drive, ffmpeg, yt-dlp, etc.) must follow this style.