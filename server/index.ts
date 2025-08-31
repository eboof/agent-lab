// server/index.ts
// v20250829 — unified server with Tools + RAG + Agent APIs

// --- Load env FIRST (repo root only) ---
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Always load from repo root
const repoRoot = path.resolve(__dirname, "..");
const envPath = path.join(repoRoot, ".env");

const result = config({ path: envPath });

if (result.error) {
  console.error(`❌ Failed to load .env from ${envPath}`);
  process.exit(1);
} else {
  console.log(`✅ Loaded environment from ${envPath}`);
}

// Validate critical keys early
["OPENAI_API_KEY", "ANTHROPIC_API_KEY"].forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

// --- Imports ---
import express from "express";
import bodyParser from "body-parser";
import * as fs from "fs";
import cron from "node-cron";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import * as yaml from "js-yaml";
import { spawn, ChildProcess } from "child_process";

// Tools (unified auto-discovery)
import { loadTools, getToolById, TOOL_LIBRARY } from "./tools/tool-library.ts";

// --- Simple fetch polyfill ---
async function fetch(url: string, options?: any) {
  const https = await import("https");
  const http = await import("http");
  const { URL } = await import("url");

  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === "https:" ? https : http;
    const req = client.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: options?.method || "GET",
        headers: options?.headers || {},
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          resolve({
            ok: res.statusCode! >= 200 && res.statusCode! < 300,
            status: res.statusCode!,
            statusText: res.statusMessage!,
            json: () => Promise.resolve(JSON.parse(data)),
          } as any);
        });
      }
    );
    req.on("error", reject);
    if (options?.body) req.write(options.body);
    req.end();
  });
}

// --- Constants ---
const PORT = process.env.PORT || 3001;
const agentsDir = path.resolve(__dirname, "../agents");

// --- Clients ---
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- Express ---
const app = express();
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});
app.use(bodyParser.json());

// Initialize tools at startup
(async () => {
  await loadTools();
  console.log(`🔧 Loaded ${TOOL_LIBRARY.length} tools`);
})();

//
// === Tools API ===
//
app.get("/api/tools/list", (req, res) => res.json(TOOL_LIBRARY));

app.post("/api/tools/run/:id", async (req, res) => {
  const { id } = req.params;
  const params = req.body || {};
  const tool = getToolById(id);

  if (!tool) {
    return res.status(404).json({ error: `Tool ${id} not found` });
  }

  try {
    const result = await tool.call(params);
    res.json({ tool: id, result });
  } catch (err: any) {
    console.error(`❌ Tool ${id} failed:`, err);
    res.status(500).json({ error: err.message });
  }
});

//
// === RAG API ===
//
let ragProcess: ChildProcess | null = null;

app.post("/rag/start", async (req, res) => {
  if (ragProcess) return res.json({ success: false, error: "RAG already running" });
  const ragScript = path.join(__dirname, "api.py");
  ragProcess = spawn("python", [ragScript], { cwd: __dirname, stdio: ["ignore", "pipe", "pipe"] });
  ragProcess.stdout?.on("data", (d) => console.log("RAG:", d.toString()));
  ragProcess.stderr?.on("data", (d) => console.error("RAG ERR:", d.toString()));
  ragProcess.on("close", (c) => { console.log(`RAG exited ${c}`); ragProcess = null; });
  setTimeout(() => res.json({ success: true, message: "RAG starting..." }), 1000);
});

app.get("/rag/status", async (req, res) => {
  try {
    const r: any = await fetch("http://localhost:8000/health");
    res.json({ ready: r.ok, process: r.ok ? "running" : "stopped", port: 8000 });
  } catch {
    res.json({ ready: false, process: "stopped" });
  }
});

app.post("/rag/query", async (req, res) => {
  try {
    const r: any = await fetch("http://localhost:8000/query", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const data = await r.json();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/rag/models", async (req, res) => {
  try {
    const r: any = await fetch("http://localhost:8000/models");
    const data = await r.json();
    res.json(data);
  } catch {
    res.json({
      openai_models: ["gpt-4o-mini", "gpt-4o"],
      local_models: ["local-gpt2", "local-distilgpt2"],
    });
  }
});

//
// === Agents API ===
//

// Legacy shortcut
app.get("/agents", (req, res) => {
  try {
    const files = fs.readdirSync(agentsDir).filter(f => f.endsWith(".ts"));
    res.json(files.map(f => f.replace(/\.agent\.ts$|\.ts$/, "")));
  } catch {
    res.json([]);
  }
});

// List
app.get("/api/agents/list", (req, res) => {
  try {
    if (!fs.existsSync(agentsDir)) return res.json({ agents: [] });
    const files = fs.readdirSync(agentsDir)
      .filter(f => f.endsWith(".agent.ts"))
      .map(f => ({
        filename: f,
        name: f.replace(".agent.ts", ""),
        path: path.join(agentsDir, f),
        lastModified: fs.statSync(path.join(agentsDir, f)).mtime,
      }))
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    res.json({ agents: files });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Load
app.get("/api/agents/load/:filename", (req, res) => {
  const filePath = path.join(agentsDir, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });
  
  const content = fs.readFileSync(filePath, "utf-8");
  
  // Parse agent metadata from the class constructor
  const parsed = parseAgentMetadata(content);
  
  res.json({
    filename: req.params.filename,
    content,
    parsed,
    lastModified: fs.statSync(filePath).mtime,
  });
});

// Helper function to extract agent metadata from source code
function parseAgentMetadata(content: string): any {
  try {
    const nameMatch = content.match(/name:\s*["']([^"']+)["']/);
    const descMatch = content.match(/description:\s*["']([^"']+)["']/);
    const versionMatch = content.match(/version:\s*["']([^"']+)["']/);
    const promptMatch = content.match(/systemPrompt:\s*["']([^"']+)["']/);
    
    // Extract tools array
    const toolsMatch = content.match(/tools:\s*\[([\s\S]*?)\]/);
    let selectedTools: string[] = [];
    if (toolsMatch) {
      const toolsContent = toolsMatch[1];
      const toolMatches = toolsContent.match(/"id":\s*["']([^"']+)["']/g);
      if (toolMatches) {
        selectedTools = toolMatches.map(m => m.match(/"([^"]+)"/)![1]);
      }
    }
    
    // Extract schemas (simplified)
    const inputSchemaMatch = content.match(/inputSchema:\s*\{([\s\S]*?)\}/);
    const outputSchemaMatch = content.match(/outputSchema:\s*\{([\s\S]*?)\}/);
    
    return {
      name: nameMatch?.[1] || "Unknown Agent",
      description: descMatch?.[1] || "No description",
      version: versionMatch?.[1] || "1.0",
      systemPrompt: promptMatch?.[1] || "You are a helpful agent.",
      selectedTools,
      inputSchema: [],
      outputSchema: []
    };
  } catch (error) {
    return {
      name: "Parse Error",
      description: "Could not parse agent metadata",
      version: "unknown",
      systemPrompt: "",
      selectedTools: [],
      inputSchema: [],
      outputSchema: []
    };
  }
}

// Run
app.post("/run", async (req, res) => {
  const { agent, args = [] } = req.body;
  try {
    const filePath = path.join(agentsDir, `${agent}.agent.ts`);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });
    const mod = await import(filePath);
    const AgentClass = mod.default;
    const instance = new AgentClass();

    // Convert object args if needed
    let parsedArgs = args;
    if (args.length === 1 && typeof args[0] === "object") {
      parsedArgs = Object.values(args[0]).map(String);
    }

    const output = await instance.run(parsedArgs);
    res.json({ output });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Healthcheck ---
app.get("/health", (req, res) => {
  let agentCount = 0;
  try {
    if (fs.existsSync(agentsDir)) {
      agentCount = fs.readdirSync(agentsDir).filter(f => f.endsWith(".agent.ts")).length;
    }
  } catch {
    agentCount = -1; // error case
  }

  res.json({
    status: "ok",
    port: PORT,
    env: {
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      SMTP_USER: !!process.env.SMTP_USER,
    },
    clients: {
      openai: !!openai,
      anthropic: !!anthropic,
    },
    agents: {
      directory: agentsDir,
      count: agentCount
    },
    timestamp: new Date().toISOString(),
  });
});

//
// --- Start ---
app.listen(PORT, () => {
  console.log("===================================");
  console.log(`✅ Server running → http://localhost:${PORT}`);
  console.log(`📂 Agents dir: ${agentsDir}`);
  console.log("===================================");
});
