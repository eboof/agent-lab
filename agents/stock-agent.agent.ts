// agents/stock-agent.agent.ts
// Stock price agent using BaseAgent architecture

import { BaseAgent } from "../server/agent-builder/agent.ts";

export default class StockAgent extends BaseAgent {
  constructor() {
    super({
      name: "Stock Agent",
      description: "Get real-time stock prices and market data",
      version: "1.0",
      systemPrompt: "You are a stock analysis agent. Use Yahoo Finance to get stock data and provide insights.",
      tools: [
        {
          "id": "yahoo-finance",
          "name": "yahoo-finance",
          "type": "tool"
        }
      ],
      inputSchema: {
        "ticker": {
          "type": "string",
          "required": true,
          "description": "Stock ticker symbol (e.g., AAPL, MSFT)"
        }
      },
      outputSchema: {
        "price": {
          "type": "number",
          "required": true,
          "description": "Current stock price"
        },
        "change": {
          "type": "number", 
          "required": false,
          "description": "Price change"
        }
      }
    });
  }

  protected async execute(input: Record<string, any>): Promise<any> {
    this.log("Stock agent starting with ticker:", input.ticker);
    
    const ticker = input.ticker;
    if (!ticker) {
      throw new Error("Ticker symbol is required");
    }

    try {
      // Use Yahoo Finance tool to get stock data
      const result = await this.runTool("yahoo-finance", { symbol: ticker });
      
      this.log("Stock data retrieved:", result);
      return {
        ticker,
        price: result.regularMarketPrice,
        change: result.regularMarketChange,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      this.log("Error getting stock data:", error.message);
      return {
        ticker,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}