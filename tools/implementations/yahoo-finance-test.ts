// yahoo-finance-test.ts
// Cloned tool - 2025-08-31T12:58:04.339Z (cloned from yahoo-finance)

import type { ToolDefinition } from "../tool-types.ts";

// server/tools/implementations/yahoo-finance.ts
// Unified ToolDefinition for Yahoo Finance price lookup

import type { ToolDefinition } from "../tool-types.ts";
import yahooFinance from "yahoo-finance2";

export const YahooFinanceTool: ToolDefinition = {
  id: "yahoo-finance",
  name: "Yahoo Finance API",
  description: "Get real-time stock prices and market data from Yahoo Finance",
  params: [
    { name: "symbol", type: "string", required: true, description: "Ticker symbol (e.g. AAPL, TSLA, VAS.AX)" }
  ],

  async call({ symbol }) {
    if (!symbol) throw new Error("Missing required param: symbol");

    try {
      const quote = await yahooFinance.quote(symbol);
      return {
        symbol: quote.symbol,
        shortName: quote.shortName,
        currency: quote.currency,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        percentChange: quote.regularMarketChangePercent,
        marketTime: quote.regularMarketTime,
        exchange: quote.fullExchangeName,
      };
    } catch (err: any) {
      throw new Error(`Yahoo Finance API error: ${err.message}`);
    }
  }
};
