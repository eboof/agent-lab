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
import multer from "multer";
import * as yaml from "js-yaml";
import { spawn, ChildProcess } from "child_process";

// Tools (unified auto-discovery)
import { loadTools, getToolById, TOOL_LIBRARY } from "../tools/tool-library.ts";

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

// Initialize tools at startup
(async () => {
  await loadTools();
  console.log(`🔧 Loaded ${TOOL_LIBRARY.length} tools`);
})();

//
// === Tools API ===
//
app.get("/api/tools/list", (req, res) => res.json(TOOL_LIBRARY));

app.get("/api/tools/load/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const tool = getToolById(id);
    
    if (!tool) {
      return res.status(404).json({ error: `Tool ${id} not found` });
    }

    // Find the tool file
    const toolsDir = path.join(__dirname, "../tools/implementations");
    const fileName = `${id}.ts`;
    const filePath = path.join(toolsDir, fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `Tool file ${fileName} not found` });
    }

    // Read the source code
    const sourceCode = fs.readFileSync(filePath, "utf-8");
    
    res.json({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      icon: tool.icon,
      category: tool.category,
      sourceCode,
      fileName,
      lastModified: fs.statSync(filePath).mtime
    });
    
  } catch (error: any) {
    console.error("Tool load error:", error);
    res.status(500).json({ error: `Failed to load tool: ${error.message}` });
  }
});

app.post("/api/tools/create", async (req, res) => {
  try {
    const { id, name, description, icon, category, code } = req.body;
    
    if (!id || !name || !code) {
      return res.status(400).json({ error: "Missing required fields: id, name, code" });
    }

    // Validate tool ID format
    if (!/^[a-z0-9-]+$/.test(id)) {
      return res.status(400).json({ error: "Tool ID must contain only lowercase letters, numbers, and hyphens" });
    }

    // Check if tool already exists
    const existingTool = getToolById(id);
    if (existingTool) {
      return res.status(400).json({ error: `Tool with ID "${id}" already exists` });
    }

    // Create tool file
    const toolsDir = path.join(__dirname, "../tools/implementations");
    const fileName = `${id}.ts`;
    const filePath = path.join(toolsDir, fileName);

    // Generate tool code with proper imports
    const toolCode = `// ${fileName}
// Generated tool - ${new Date().toISOString()}

import type { ToolDefinition } from "../tool-types.ts";

${code}
`;

    // Write tool file
    fs.writeFileSync(filePath, toolCode);

    // Reload tools to include the new one
    await loadTools();

    res.json({ 
      success: true, 
      message: `Tool "${name}" created successfully`,
      id,
      file: fileName
    });

  } catch (error: any) {
    console.error("Tool creation error:", error);
    res.status(500).json({ error: `Failed to create tool: ${error.message}` });
  }
});

app.put("/api/tools/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, category, code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: "Missing required field: code" });
    }

    // Check if tool exists
    const existingTool = getToolById(id);
    if (!existingTool) {
      return res.status(404).json({ error: `Tool with ID "${id}" not found` });
    }

    // Update tool file
    const toolsDir = path.join(__dirname, "../tools/implementations");
    const fileName = `${id}.ts`;
    const filePath = path.join(toolsDir, fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `Tool file ${fileName} not found` });
    }

    // Generate updated tool code with proper imports
    const toolCode = `// ${fileName}
// Updated tool - ${new Date().toISOString()}

import type { ToolDefinition } from "../tool-types.ts";

${code}
`;

    // Write updated tool file
    fs.writeFileSync(filePath, toolCode);

    // Reload tools to reflect changes
    await loadTools();

    res.json({ 
      success: true, 
      message: `Tool "${name || existingTool.name}" updated successfully`,
      id,
      file: fileName
    });

  } catch (error: any) {
    console.error("Tool update error:", error);
    res.status(500).json({ error: `Failed to update tool: ${error.message}` });
  }
});

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
