#!/usr/bin/env ts-node

import Anthropic from "@anthropic-ai/sdk";
import yaml from "js-yaml";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { config } from "dotenv";

config();

// ✅ Fix __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ✅ Load Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function run(args: string[]) {
  const query = args.join(" ");

  if (!query) {
    return { error: "No research query provided" };
  }

  console.log(`🔍 Researching: ${query}`);

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514", // Latest Claude 4 Sonnet model
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Provide a structured research summary about "${query}" in clean YAML format with keys: summary, key_points, sources.`,
        },
      ],
    });

    // Extract text from response
    const text = response.content
      .map((c: any) => (typeof c.text === "string" ? c.text : c))
      .join("\n");

    let parsed: any;
    try {
      parsed = yaml.load(text);
    } catch {
      parsed = { error: "Failed to parse YAML", raw: text };
    }

    return parsed;
  } catch (err: any) {
    console.error("❌ Research agent failed:", err.message);
    return { error: err.message };
  }
}

// --- If run directly from CLI ---
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const query = process.argv.slice(2).join(" ");
  if (!query) {
    console.error("❌ No research query provided");
    process.exit(1);
  }
  
  run([query]).then((result) => {
    console.log(yaml.dump(result));
  }).catch((err) => {
    console.error("❌ Research agent failed:", err.message);
    process.exit(1);
  });
}
