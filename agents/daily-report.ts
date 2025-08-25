#!/usr/bin/env ts-node

import yaml from "js-yaml";
import { writeFileSync } from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { sendMail } from "../server/mailer.ts"; // ✅ direct ESM import

// --- Fix __dirname for ESM ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Stocks to track ---
const US_TICKERS = ["TSLA", "NVDA", "PLTR", "BABA"];
const ASX_TICKERS = ["CDA.AX", "NCK.AX", "FMG.AX", "VAS.AX"];

// --- Run any agent dynamically ---
async function runAgent(agent: string, ...args: string[]): Promise<any> {
  try {
    // Dynamically import agent (e.g., stock-agent.ts)
    const mod = await import(`./${agent}.ts`);
    if (!mod.default) throw new Error(`Agent ${agent} has no default export`);
    return await mod.default([...args]);
  } catch (err: any) {
    console.error(`❌ Error running ${agent}:`, err.message);
    return { error: err.message };
  }
}

// --- Generate full report ---
async function generateReport() {
  console.log("📊 Generating daily report...");

  const results: any = {
    us: [],
    asx: [],
  };

  // US stocks
  for (const t of US_TICKERS) {
    const data = await runAgent("stock-agent", t);
    results.us.push(data);
  }

  // ASX stocks
  for (const t of ASX_TICKERS) {
    const data = await runAgent("stock-agent", t);
    results.asx.push(data);
  }

  const report = {
    date: new Date().toISOString(),
    ...results,
  };

  // Save YAML
  const yamlOutput = yaml.dump(report);
  const outPath = path.join(process.cwd(), "daily-report.yaml");
  writeFileSync(outPath, yamlOutput, "utf-8");
  console.log(`✅ Report saved to ${outPath}`);

  return report;
}

// --- Markdown formatting ---
function formatMarkdown(report: any): string {
  let md = `# 📈 Daily Stock Report\n\nGenerated: ${report.date}\n\n`;

  md += `## 🇺🇸 US Stocks\n\n`;
  report.us.forEach((s: any) => {
    if (!s || s.error) {
      md += `- Error fetching data: ${s?.error}\n`;
      return;
    }
    md += `- **${s.ticker}**: $${s.price} (${s.currency}) | Market: ${s.marketState}\n`;
  });

  md += `\n## 🇦🇺 ASX Stocks\n\n`;
  report.asx.forEach((s: any) => {
    if (!s || s.error) {
      md += `- Error fetching data: ${s?.error}\n`;
      return;
    }
    md += `- **${s.ticker}**: $${s.price} (${s.currency}) | Market: ${s.marketState}\n`;
  });

  return md;
}

// --- Main ---
async function main() {
  const report = await generateReport();
  const markdown = formatMarkdown(report);

  // Send email
  const subject = `Daily Stock Report - ${new Date().toLocaleDateString("en-AU")}`;
  await sendMail("rob@jalwax.com", subject, `<pre>${markdown}</pre>`);

  console.log("📧 Report emailed successfully!");
  return report;
}

// --- Default export for server import ---
export default async function run(args: string[]) {
  return await main();
}

// --- If run directly from CLI ---
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => console.error("❌ Daily report failed:", err));
}
