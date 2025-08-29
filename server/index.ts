// server/index.ts
// v20250826-0835 — unified server with /meta endpoint

import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import cron from "node-cron";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import yaml from "js-yaml";
import { spawn, ChildProcess } from "child_process";

// Simple fetch polyfill for Node.js
async function fetch(url: string, options?: any) {
  const https = await import('https');
  const http = await import('http');
  const { URL } = await import('url');
  
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options?.method || 'GET',
      headers: options?.headers || {},
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const response = {
          ok: res.statusCode! >= 200 && res.statusCode! < 300,
          status: res.statusCode!,
          statusText: res.statusMessage!,
          json: () => Promise.resolve(JSON.parse(data)),
        };
        resolve(response as any);
      });
    });

    req.on('error', reject);
    
    if (options?.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

config({ path: "../.env" });

// --- Fix __dirname for ESM ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Initialize AI clients ---
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// --- RAG System Integration ---
let ragProcess: ChildProcess | null = null;
let ragReady = false;

async function startRAGServer() {
  if (ragProcess) return;
  
  console.log("🚀 Starting Python RAG server...");
  
  const ragScript = path.join(__dirname, "api.py");
  ragProcess = spawn("python", [ragScript], {
    cwd: __dirname,
    stdio: ["pipe", "pipe", "pipe"],
  });

  ragProcess.stdout?.on("data", (data) => {
    const output = data.toString().trim();
    if (output.includes("Application startup complete")) {
      ragReady = true;
      console.log("✅ Python RAG server ready on port 8000");
    }
    if (output.includes("uvicorn")) {
      console.log(`🐍 RAG: ${output}`);
    }
  });

  ragProcess.stderr?.on("data", (data) => {
    console.error(`❌ RAG Error: ${data.toString()}`);
  });

  ragProcess.on("close", (code) => {
    console.log(`📴 RAG server exited with code ${code}`);
    ragProcess = null;
    ragReady = false;
  });
}

// Start RAG server on startup (optional - can be started on demand)
// Uncomment the line below to auto-start RAG server
// startRAGServer().catch(err => console.error("Failed to start RAG server:", err));

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
            ...chatHistory.map((msg) => ({
              role: msg.role === "user" ? "user" : "assistant",
              content: msg.content,
            })),
          ],
          max_tokens: 1000,
        });
        reply = response.choices[0]?.message?.content || "No response from OpenAI";
      }
    } else {
      // Anthropic with retry logic
      let retries = 3;
      let lastError;

      while (retries > 0) {
        try {
          const response = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: chatHistory.map((msg) => ({
              role: msg.role as "user" | "assistant",
              content: msg.content,
            })),
          });

          const textContent = response.content.find((c) => c.type === "text");
          reply = textContent?.text || "No response from Anthropic";
          break;
        } catch (retryErr: any) {
          lastError = retryErr;
          retries--;

          if (retryErr.message?.includes("overloaded") && retries > 0) {
            console.log(`💤 Anthropic overloaded, retrying in 2s... (${retries} retries left)`);
            await new Promise((resolve) => setTimeout(resolve, 2000));
            continue;
          }
          throw retryErr;
        }
      }

      if (retries === 0 && lastError) throw lastError;
    }

    chatHistory.push({ role: "assistant", content: reply });
    res.json({ reply, history: chatHistory });
  } catch (err: any) {
    console.error(`❌ Error with ${model}:`, err.message);
    const reply = `Sorry, I encountered an error with ${model}: ${err.message}`;
    chatHistory.push({ role: "assistant", content: reply });
    res.json({ reply, history: chatHistory });
  }
});

//
// RAG Endpoints (proxy to Python RAG server)
//

// GET /rag/status → check RAG server status
app.get("/rag/status", (req, res) => {
  res.json({ 
    ready: ragReady, 
    process: ragProcess ? "running" : "stopped",
    port: 8000 
  });
});

// POST /rag/start → start RAG server
app.post("/rag/start", async (req, res) => {
  try {
    await startRAGServer();
    res.json({ message: "RAG server starting...", status: "starting" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// RAG proxy endpoints (forward to Python server)
app.post("/rag/query", async (req, res) => {
  if (!ragReady) {
    return res.status(503).json({ 
      error: "RAG server not ready", 
      message: "Use POST /rag/start to start the RAG server" 
    });
  }

  try {
    const response = await fetch("http://127.0.0.1:8000/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: "RAG query failed", message: err.message });
  }
});

app.get("/rag/models", async (req, res) => {
  if (!ragReady) {
    return res.json({ 
      openai_models: ["gpt-4o-mini", "gpt-4o"], 
      local_models: ["local-gpt2", "local-distilgpt2"] 
    });
  }

  try {
    const response = await fetch("http://127.0.0.1:8000/models");
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to get models", message: err.message });
  }
});

//
// NEW: GET /meta → show project-meta.yaml
//
app.get("/meta", (req, res) => {
  const metaPath = path.resolve(__dirname, "../project-meta.yaml");
  try {
    if (!fs.existsSync(metaPath)) {
      return res.status(404).json({ error: "project-meta.yaml not found" });
    }
    const raw = fs.readFileSync(metaPath, "utf-8");
    const data = yaml.load(raw);
    res.json(data);
  } catch (err: any) {
    console.error("❌ Failed to load project-meta.yaml:", err.message);
    res.status(500).json({ error: "Failed to load metadata" });
  }
});

//
// CRON: Run daily-report at midnight AEST
//
cron.schedule("0 0 * * *", async () => {
  console.log("⏰ Midnight cron triggered → running daily-report");
  try {
    const mod = await import("../agents/daily-report.ts");
    if (mod.default) {
      await mod.default([]);
    } else if (mod.main) {
      await mod.main();
    }
    console.log("✅ Daily report completed from cron");
  } catch (err: any) {
    console.error("❌ Daily report cron failed:", err.message);
  }
});

// --- Start server ---
app.listen(PORT, () => {
  console.log("===================================");
  console.log(`✅ Agent server running on http://localhost:${PORT}`);
  console.log(`📂 Agents directory: ${agentsDir}`);
  console.log("===================================");
});
