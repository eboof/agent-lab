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

// Validate SMTP (non-critical for server startup)
["SMTP_USER", "SMTP_PASS", "SMTP_HOST", "SMTP_PORT", "SMTP_FROM"].forEach((key) => {
  if (!process.env[key]) {
    console.warn(`⚠️ Missing SMTP environment variable: ${key} (email features disabled)`);
  }
});

// --- Imports ---
import express from "express";
import bodyParser from "body-parser";
import * as fs from "fs";
import cron from "node-cron";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import multer from "multer";
import { spawn, ChildProcess } from "child_process";
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

// Tools (new registry system)
import toolsRouter from "./api/tools.ts";
import agentsRouter from "./api/agents.ts";

// Orchestration & WebSocket
import { messageBus } from "./orchestration/message-bus.ts";
import { executionStore } from "./orchestration/execution-store.ts";
import googleRouter from "./api/google.ts";

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

// Configure multer for file uploads
const upload = multer({
  dest: '/Users/rob/dev/agent-lab/data/uploads/',
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});
app.use(bodyParser.json());

//
// === Tools API ===
//
app.use("/api/tools", toolsRouter);

//
// === Agents API ===
//
app.use("/api/agents", agentsRouter);

//
// === Google API ===
//
app.use("/api/google", googleRouter);

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

app.post("/rag/upload-files", upload.array('files'), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    // Rename files to preserve original names
    const filePaths: string[] = [];
    for (const file of files) {
      const originalName = file.originalname;
      const newPath = path.join('/Users/rob/dev/agent-lab/data/uploads', originalName);
      
      // Move file to correct location with original name
      fs.renameSync(file.path, newPath);
      filePaths.push(newPath);
      console.log(`📤 Uploaded ${originalName} to ${newPath}`);
    }

    res.json({
      status: "success",
      message: `Uploaded ${filePaths.length} files`,
      file_paths: filePaths
    });
  } catch (error: any) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ error: `Failed to upload files: ${error.message}` });
  }
});

app.post("/rag/load-docs", async (req, res) => {
  try {
    const r: any = await fetch("http://localhost:8000/load-docs", {
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const data = await r.json();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
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

// Chat endpoint for AI Chatbot UI
app.post("/chat", async (req, res) => {
  const { message, model = "anthropic" } = req.body;
  
  try {
    let response = "";
    
    if (model === "anthropic") {
      const result = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        messages: [{ role: "user", content: message }]
      });
      response = result.content[0].type === 'text' ? result.content[0].text : 'No response';
    } else if (model === "openai") {
      const result = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: message }],
        max_tokens: 1000
      });
      response = result.choices[0]?.message?.content || 'No response';
    } else {
      return res.status(400).json({ error: "Unsupported model" });
    }
    
    // Return chat history format expected by UI
    res.json({
      history: [
        { role: "user", content: message },
        { role: "assistant", content: response }
      ]
    });
  } catch (e: any) {
    console.error("Chat error:", e);
    res.status(500).json({ error: e.message });
  }
});

// --- Healthcheck ---
app.get("/health", (req, res) => {
  let agentCount = 0;
  try {
    if (fs.existsSync(agentsDir)) {
      agentCount = fs.readdirSync(agentsDir).filter(f => f.endsWith(".agent.yaml")).length;
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

// Tools API already mounted above at line 118


//
// --- WebSocket Setup ---
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

// Initialize message bus with WebSocket
messageBus.initializeWebSocket(wss);

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  console.log('📱 New WebSocket connection');
  
  // Extract execution ID from URL path
  const url = req.url || '';
  const executionIdMatch = url.match(/\/ws\/execution\/([^\/]+)/);
  
  if (executionIdMatch) {
    const executionId = executionIdMatch[1];
    messageBus.addWebSocketClient(executionId, ws);
  } else {
    console.warn('❌ WebSocket connection without valid execution ID');
    ws.close(1008, 'Invalid execution ID');
  }
});

// Add execution API routes
app.get('/api/executions', (req, res) => {
  const executions = executionStore.getAllExecutions();
  res.json(executions);
});

app.get('/api/executions/:executionId', (req, res) => {
  const execution = executionStore.getExecution(req.params.executionId);
  if (!execution) {
    return res.status(404).json({ error: 'Execution not found' });
  }
  res.json(execution);
});

app.post('/api/executions/:executionId/start', (req, res) => {
  const { executionId } = req.params;
  const { metadata } = req.body;
  
  try {
    const execution = executionStore.createExecution(executionId, metadata);
    res.json({ success: true, execution });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/executions/:executionId/refresh', (req, res) => {
  const { executionId } = req.params;
  
  try {
    const execution = executionStore.getExecution(executionId);
    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }

    // Force send current execution state to all connected WebSocket clients
    messageBus.sendToWebSocketClients(executionId, {
      type: 'execution:state',
      data: execution
    });
    
    console.log(`🔄 Manually refreshed execution state for ${executionId}`);
    res.json({ success: true, execution });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/executions/:executionId/resume', async (req, res) => {
  const { executionId } = req.params;
  
  try {
    const execution = executionStore.getExecution(executionId);
    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }

    const agent = execution.agents.find(a => a.status === 'running' && a.awaitingUserData?.userResponse);
    if (!agent) {
      return res.status(400).json({ error: 'No agent waiting for continuation' });
    }

    // Import AgentRunner dynamically to avoid circular dependency
    const { AgentRunner } = await import('./orchestration/agent-runner.ts');
    const runner = new AgentRunner();
    
    console.log(`🔄 Resuming agent ${agent.agentId} with user decisions`);
    
    // Create a continuation prompt with user decisions
    const userDecisions = agent.awaitingUserData?.userResponse;
    const continuationPrompt = `Continue processing with user decisions: ${JSON.stringify(userDecisions)}`;
    
    // Continue the agent with user input
    const result = await runner.continueWithUserInput(executionId, agent.agentId, continuationPrompt);
    
    res.json({ success: true, result });
  } catch (error: any) {
    console.error(`❌ Failed to resume execution ${executionId}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Clear inactive executions endpoint
app.delete('/api/executions/clear-inactive', (req, res) => {
  try {
    const cleared = executionStore.clearInactiveExecutions();
    console.log(`🧹 Cleared ${cleared} inactive executions`);
    res.json({ success: true, cleared });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

//
// --- Start ---
const server = httpServer.listen(PORT, () => {
  console.log("===================================");
  console.log(`✅ Server running → http://localhost:${PORT}`);
  console.log(`📂 Agents dir: ${agentsDir}`);
  console.log(`📡 WebSocket server ready`);
  console.log("===================================");
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
