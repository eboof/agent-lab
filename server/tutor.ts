#!/usr/bin/env ts-node

import fs from "fs";
import path from "path";
import { searchDocs } from "./vectorStore.ts";
import OpenAI from "openai";

const docsPath = path.resolve("server", "docs.json");
const docs = JSON.parse(fs.readFileSync(docsPath, "utf-8"));

const [,, cmd, ...args] = process.argv;

// 📋 List docs
function listDocs() {
  console.log("📚 Available Articles:\n");
  docs.forEach((doc: any, i: number) => {
    const snippet = doc.content.replace(/\s+/g, " ").slice(0, 120);
    console.log(`${i + 1}. [${doc.date}] ${doc.title}`);
    console.log(`   Snippet: ${snippet}...\n`);
  });
}

// 🔍 Search
function searchDocsCLI(query: string) {
  console.log(`🔎 Searching for "${query}"...\n`);
  const results = searchDocs(query);
  results.forEach((r: any, i: number) => {
    const snippet = r.content.replace(/\s+/g, " ").slice(0, 120);
    console.log(`${i + 1}. [${r.date}] ${r.title}`);
    console.log(`   Snippet: ${snippet}...\n`);
  });
}

// ✂️ TL;DR
async function tldrDoc(index: number) {
  const doc = docs[index - 1];
  if (!doc) return console.error(`❌ No doc at index ${index}`);

  if (!process.env.OPENAI_API_KEY) {
    return console.error("❌ OPENAI_API_KEY not set. Skipping TL;DR.");
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  console.log(`🤖 Summarizing: ${doc.filename} (${doc.title})`);

  const resp = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a helpful tutor summarizing AI blogs." },
      { role: "user", content: `Summarize this blog into a TL;DR:\n\n${doc.content}` }
    ],
    max_tokens: 300
  });

  console.log("\n--- TL;DR ---\n");
  console.log(resp.choices[0].message.content);
}

// 🚀 CLI
(async () => {
  switch (cmd) {
    case "list": listDocs(); break;
    case "search":
      if (!args[0]) return console.error("❌ Usage: tutor search <keyword>");
      searchDocsCLI(args.join(" "));
      break;
    case "tldr":
      if (!args[0]) return console.error("❌ Usage: tutor tldr <index>");
      await tldrDoc(Number(args[0]));
      break;
    default:
      console.log("Usage:");
      console.log("  tutor list            → list all docs with date + title");
      console.log("  tutor search <term>   → search docs");
      console.log("  tutor tldr <index>    → summarize doc with LLM");
  }
})();
