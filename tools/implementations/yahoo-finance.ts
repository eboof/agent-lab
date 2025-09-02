// yahoo-finance.ts
// Updated tool - supports both "quote" and "chart" modules

import type { ToolDefinition } from "../tool-types.ts";
import yahooFinance from "yahoo-finance2";

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
    },
    {
      name: "range",
      type: "string",
      required: false,
      description: "For chart: time range (e.g. 1d, 5d, 1y)"
    },
    {
      name: "interval",
      type: "string",
      required: false,
      description: "For chart: interval between points (e.g. 1m, 1d, 1wk)"
    }
  ],

  async call({ symbol, module = "quote", range = "5d", interval = "1d" }) {
    if (!symbol) throw new Error("Missing required param: symbol");

    try {
      if (module === "quote") {
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

      if (module === "chart") {
        return {
          error: "Chart module temporarily disabled - Yahoo Finance API parameter issues",
          supportedModules: ["quote"],
          symbol,
          range,
          interval
        };
      }

      return { error: `Unsupported module: ${module}` };
    } catch (err: any) {
      throw new Error(`Yahoo Finance API error: ${err.message}`);
    }
  }
};
