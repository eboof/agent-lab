#!/usr/bin/env ts-node

import yahooFinance from "yahoo-finance2";
import fs from "fs";
import path from "path";

// List of tickers
const tickers = ["CDA.AX", "NCK.AX", "FMG.AX", "VAS.AX"];

// Helper: format date YYYYMMDD
function getDateString() {
  const d = new Date();
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

async function main() {
  try {
    const results: string[] = [];
    const today = getDateString();

    for (const ticker of tickers) {
      const quote = await yahooFinance.quote(ticker);
      results.push(
        `${ticker}: close=${quote.regularMarketPrice}, change=${quote.regularMarketChangePercent?.toFixed(
          2
        )}%, volume=${quote.regularMarketVolume}`
      );
    }

    const fileName = `stocks${today}.txt`;
    const filePath = path.join(process.cwd(), fileName);

    fs.writeFileSync(filePath, results.join("\n"), "utf8");
    console.log(`✅ Saved stock data to ${filePath}`);
  } catch (err) {
    console.error("❌ Error fetching stock data:", err);
  }
}

main();
}
