// server/api/agents.ts
// v20250901 – Safe Agent API Router

import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseAgentYAML, validateAgentConfig, stringifyAgentYAML, type AgentDefinition } from "../utils/agent-schema.ts";
import { agentRunner } from "../orchestration/agent-runner.ts";
import { handleApiError, handleApiSuccess } from "../utils/api-error.ts";

const router = express.Router();

// Resolve repo root (always consistent, even in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");
const agentsDir = path.join(repoRoot, "agents");

/**
 * GET /api/agents (root endpoint)
 * Returns all agent definition files (.json or .yaml) from /agents dir
 */
router.get("/", async (_req, res) => {
  try {
    if (!fs.existsSync(agentsDir)) {
      return res.json([]);
    }

    const files = fs.readdirSync(agentsDir);
    const agents = files
      .filter((f) => f.endsWith(".agent.yaml") || f.endsWith(".agent.json"))
      .map((f) => ({
        id: f.replace(/\.agent\.(json|yaml|yml)$/, ""),
        file: f,
      }));

    res.json(agents);
  } catch (err: any) {
    console.error("❌ Failed to list agents:", err);
    handleApiError(res, err, 500);
  }
});

/**
 * GET /api/agents/list
 * Returns all agent definition files (.json or .yaml) from /agents dir
 */
router.get("/list", async (_req, res) => {
  try {
    if (!fs.existsSync(agentsDir)) {
      return res.json([]);
    }

    const files = fs.readdirSync(agentsDir);
    const agents = files
      .filter((f) => f.endsWith(".agent.yaml") || f.endsWith(".agent.json"))
      .map((f) => ({
        id: f.replace(/\.agent\.(json|yaml|yml)$/, ""),
        file: f,
      }));

    res.json(agents);
  } catch (err: any) {
    console.error("❌ Failed to list agents:", err);
    handleApiError(res, err, 500);
  }
});

/**
 * GET /api/agents/:id
 * Loads a single agent by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    
    // Skip if this is actually a list request
    if (id === "list") {
      return res.redirect("/api/agents");
    }
    
    const file = ["agent.json", "agent.yaml", "agent.yml"]
      .map((ext) => path.join(agentsDir, `${id}.${ext}`))
      .find((f) => fs.existsSync(f));

    if (!file) {
      return handleApiError(res, new Error(`Agent '${id}' not found`), 404);
    }

    const content = fs.readFileSync(file, "utf-8");
    const agent = parseAgentYAML(content);
    handleApiSuccess(res, { id, agent, file: path.basename(file) });
  } catch (err: any) {
    console.error("❌ Failed to load agent:", err);
    handleApiError(res, err, 500);
  }
});

/**
 * GET /api/agents/load/:id
 * Loads a single agent by ID
 */
router.get("/load/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const file = ["agent.json", "agent.yaml", "agent.yml"]
      .map((ext) => path.join(agentsDir, `${id}.${ext}`))
      .find((f) => fs.existsSync(f));

    if (!file) {
      return handleApiError(res, new Error(`Agent '${id}' not found`), 404);
    }

    const content = fs.readFileSync(file, "utf-8");
    handleApiSuccess(res, { id, file: path.basename(file), content });
  } catch (err: any) {
    console.error("❌ Failed to load agent:", err);
    handleApiError(res, err, 500);
  }
});

/**
 * POST /api/agents/create
 * Creates a new agent definition with validation
 */
router.post("/create", express.json(), async (req, res) => {
  try {
    const { id, name, role, model, tools, systemPrompt, inputSchema, outputSchema, metadata } = req.body;
    
    if (!id || !name) {
      return handleApiError(res, new Error("Missing required fields: id and name"), 400);
    }

    // Check if agent already exists
    const existingFile = ["agent.json", "agent.yaml", "agent.yml"]
      .map((ext) => path.join(agentsDir, `${id}.${ext}`))
      .find((f) => fs.existsSync(f));

    if (existingFile) {
      return handleApiError(res, new Error(`Agent '${id}' already exists`), 409);
    }

    // Build agent config
    const agentConfig = {
      id,
      name,
      role: role || "Assistant agent",
      model: model || "claude-3-5-sonnet-20241022",
      tools: tools || [],
      systemPrompt: systemPrompt || `You are ${name}, a helpful AI assistant.`,
      inputSchema: inputSchema || {},
      outputSchema: outputSchema || {},
      metadata: {
        version: "1.0.0",
        author: "Agent-Lab",
        created: new Date().toISOString(),
        description: role || `${name} agent`,
        tags: [],
        category: "general",
        ...metadata
      }
    };

    // Validate agent configuration
    const validation = validateAgentConfig(agentConfig);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: "Invalid agent configuration", 
        details: validation.errors 
      });
    }

    // Ensure agents directory exists
    if (!fs.existsSync(agentsDir)) {
      fs.mkdirSync(agentsDir, { recursive: true });
    }

    // Save as YAML for readability
    const filename = `${id}.agent.yaml`;
    const file = path.join(agentsDir, filename);
    const yamlContent = stringifyAgentYAML(agentConfig);
    fs.writeFileSync(file, yamlContent, "utf-8");

    console.log(`✅ Created agent: ${id} → ${file}`);
    res.json({ 
      success: true, 
      message: `Agent '${name}' created successfully`, 
      filename,
      id 
    });
  } catch (err: any) {
    console.error("❌ Failed to create agent:", err);
    handleApiError(res, err, 500);
  }
});

/**
 * POST /api/agents/save
 * Saves or updates an agent definition with validation
 */
router.post("/save", express.json(), async (req, res) => {
  try {
    const { id, content } = req.body;
    if (!id || !content) {
      return handleApiError(res, new Error("Missing id or content"), 400);
    }

    // Validate agent configuration
    const validation = validateAgentConfig(content);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: "Invalid agent configuration", 
        details: validation.errors 
      });
    }

    // Ensure agents directory exists
    if (!fs.existsSync(agentsDir)) {
      fs.mkdirSync(agentsDir, { recursive: true });
    }

    // Save as YAML for readability
    const file = path.join(agentsDir, `${id}.agent.yaml`);
    const yamlContent = stringifyAgentYAML(content);
    fs.writeFileSync(file, yamlContent, "utf-8");

    console.log(`✅ Saved agent: ${id} → ${file}`);
    handleApiSuccess(res, { success: true, id, file: path.basename(file) });
  } catch (err: any) {
    console.error("❌ Failed to save agent:", err);
    handleApiError(res, err, 500);
  }
});

/**
 * DELETE /api/agents/delete/:id
 * Deletes an agent definition file
 */
router.delete("/delete/:id", async (req, res) => {
  try {
    const id = req.params.id;
    
    // Try different extensions
    const extensions = ["agent.yaml", "agent.yml", "agent.json"];
    let deletedFile = null;
    
    for (const ext of extensions) {
      const file = path.join(agentsDir, `${id}.${ext}`);
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        deletedFile = file;
        break;
      }
    }

    if (!deletedFile) {
      return handleApiError(res, new Error(`Agent '${id}' not found`), 404);
    }

    console.log(`✅ Deleted agent: ${id} → ${deletedFile}`);
    handleApiSuccess(res, { success: true, id });
  } catch (err: any) {
    console.error("❌ Failed to delete agent:", err);
    handleApiError(res, err, 500);
  }
});

/**
 * POST /api/agents/run/:id
 * Executes an agent with provided input
 */
router.post("/run/:id", express.json(), async (req, res) => {
  try {
    const agentId = req.params.id;
    const { input = {}, executionId } = req.body;

    const result = await agentRunner.run(agentId, input, executionId);
    res.json(result);
  } catch (err: any) {
    console.error("❌ Failed to run agent:", err);
    handleApiError(res, err, 500);
  }
});

/**
 * POST /api/agents/smart-inbox-flow
 * Orchestrated Smart Inbox multi-agent workflow
 */
router.post("/smart-inbox-flow", express.json(), async (req, res) => {
  try {
    const { count = 10, decisions } = req.body;

    // Import the flow orchestrator
    const { runSmartInboxFlow } = await import('../orchestration/smart-inbox-flow.ts');
    
    const result = await runSmartInboxFlow(count, decisions);
    res.json(result);
  } catch (err: any) {
    console.error("❌ Smart Inbox Flow failed:", err);
    handleApiError(res, err, 500);
  }
});

export default router;