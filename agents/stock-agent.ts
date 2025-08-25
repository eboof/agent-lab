#!/usr/bin/env ts-node

import yahooFinance from "yahoo-finance2";
import yaml from "js-yaml";
import { fileURLToPath } from "url";

// --- Main logic ---
export default async function runStock(args: string[]) {
  const ticker = args[0];
  try {
    const quote = await yahooFinance.quote(ticker);

    const data = {
      ticker,
      price: quote.regularMarketPrice,
      currency: quote.currency,
      marketState: quote.marketState,
    };

    return data;
  } catch (err: any) {
    console.error(`❌ Error fetching ${ticker}:`, err.message);
    return { ticker, error: err.message };
  }
}

// --- If run directly from CLI ---
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const ticker = process.argv[2];
  if (!ticker) {
    console.error("❌ Usage: stock-agent.ts <TICKER>");
    process.exit(1);
  }

  runStock([ticker]).then((data) => {
    console.log(yaml.dump(data));
  });
}
