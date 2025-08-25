import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { config } from "dotenv";
import cron from "node-cron";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

config({ path: "../.env" });

// --- Fix __dirname for ESM ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Initialize AI clients ---
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

// --- Express app ---
const app = express();
app.use(bodyParser.json());

const PORT = 3001;
const agentsDir = path.join(__dirname, "../agents");

//
// GET /agents → list all available agents
//
app.get("/agents", (req, res) => {
  try {
    const files = fs
      .readdirSync(agentsDir)
      .filter((f) => f.endsWith(".ts"))
      .map((f) => f.replace(".ts", ""));

    console.log(`📋 Listing agents: ${files.join(", ")}`);
    res.json(files);
  } catch (err) {
    console.error("❌ Error reading agents:", err);
    res.status(500).json({ error: "Error reading agents folder" });
  }
});

//
// POST /run → run an agent dynamically
//
app.post("/run", async (req, res) => {
  const { agent, args = [] } = req.body;

  if (!agent) {
    return res.status(400).json({ error: "Agent name is required" });
  }

  try {
    const mod = await import(`../agents/${agent}.ts`);
    if (!mod.default) {
      throw new Error(`Agent '${agent}' has no default export`);
    }
    const output = await mod.default(args);

    console.log(`✅ Agent '${agent}' finished successfully`);
    res.json({ output });
  } catch (err: any) {
    console.error(`❌ Error running agent '${agent}':`, err.message);
    res.status(500).json({ error: err.message });
  }
});

//
// POST /chat → chatbot with memory
//
let chatHistory: { role: string; content: string }[] = [];

app.post("/chat", async (req, res) => {
  const { message, model = "anthropic" } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  chatHistory.push({ role: "user", content: message });

  try {
    let reply: string;

    if (model === "openai") {
      if (!openai) {
        reply = "OpenAI is not configured. Please set OPENAI_API_KEY environment variable.";
      } else {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            ...chatHistory.map(msg => ({
              role: msg.role === "user" ? "user" as const : "assistant" as const,
              content: msg.content
            }))
          ],
          max_tokens: 1000,
        });
        reply = response.choices[0]?.message?.content || "No response from OpenAI";
      }
    } else {
      // Use Anthropic (default) with retry logic for overloaded errors
      let retries = 3;
      let lastError;
      
      while (retries > 0) {
        try {
          const response = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514", // Latest Claude 4 Sonnet model
            max_tokens: 1000,
            messages: chatHistory.map(msg => ({
              role: msg.role as "user" | "assistant",
              content: msg.content
            })),
          });
          
          const textContent = response.content.find(c => c.type === "text");
          reply = textContent?.text || "No response from Anthropic";
          break; // Success, exit retry loop
          
        } catch (retryErr: any) {
          lastError = retryErr;
          retries--;
          
          // If it's an overloaded error and we have retries left, wait and try again
          if (retryErr.message?.includes("overloaded") && retries > 0) {
            console.log(`💤 Anthropic overloaded, retrying in 2s... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          
          // If not overloaded error or no retries left, break
          throw retryErr;
        }
      }
      
      // If we exhausted all retries
      if (retries === 0 && lastError) {
        throw lastError;
      }
    }

    chatHistory.push({ role: "assistant", content: reply });
    
    console.log(`💬 Chat message received: "${message}" (${model})`);
    res.json({ reply, history: chatHistory });

  } catch (err: any) {
    console.error(`❌ Error with ${model}:`, err.message);
    
    // Fallback response
    const reply = `Sorry, I encountered an error with ${model}: ${err.message}`;
    chatHistory.push({ role: "assistant", content: reply });
    
    res.json({ reply, history: chatHistory });
  }
});

//
// Example CRON: Run daily-report at midnight AEST
//
cron.schedule("0 0 * * *", async () => {
  console.log("⏰ Midnight cron triggered → running daily-report");
  try {
    const mod = await import("../agents/daily-report.ts");
    if (mod.default) {
      await mod.default([]);
    } else {
      await mod.main?.(); // if daily-report exports main()
    }
    console.log("✅ Daily report completed from cron");
  } catch (err) {
    console.error("❌ Cron daily-report failed:", err);
  }
}, { timezone: "Australia/Brisbane" });

//
// Start the server
//
app.listen(PORT, () => {
  console.log("===================================");
  console.log(`✅ Agent server running on http://localhost:${PORT}`);
  console.log(`📂 Agents directory: ${agentsDir}`);
  console.log("===================================");
});
