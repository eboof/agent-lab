// server/api/agents.ts
// v20250901 – Safe Agent API Router

import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseAgentYAML, validateAgentConfig, stringifyAgentYAML, type AgentDefinition } from "../utils/agent-schema.ts";
import { agentRunner } from "../orchestration/agent-runner.ts";

const router = express.Router();

// Resolve repo root (always consistent, even in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");
const agentsDir = path.join(repoRoot, "agents");

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
    res.status(500).json({ error: "Failed to list agents" });
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
      return res.status(404).json({ error: `Agent '${id}' not found` });
    }

    const content = fs.readFileSync(file, "utf-8");
    res.json({ id, file: path.basename(file), content });
  } catch (err: any) {
    console.error("❌ Failed to load agent:", err);
    res.status(500).json({ error: "Failed to load agent" });
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
      return res.status(400).json({ error: "Missing id or content" });
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
    res.json({ success: true, id, file: path.basename(file) });
  } catch (err: any) {
    console.error("❌ Failed to save agent:", err);
    res.status(500).json({ error: "Failed to save agent" });
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
      return res.status(404).json({ error: `Agent '${id}' not found` });
    }

    console.log(`✅ Deleted agent: ${id} → ${deletedFile}`);
    res.json({ success: true, id });
  } catch (err: any) {
    console.error("❌ Failed to delete agent:", err);
    res.status(500).json({ error: "Failed to delete agent" });
  }
});

/**
 * POST /api/agents/run/:id
 * Executes an agent with provided input
 */
router.post("/run/:id", express.json(), async (req, res) => {
  try {
    const agentId = req.params.id;
    const { input = {} } = req.body;

    const result = await agentRunner.run(agentId, input);
    res.json(result);
  } catch (err: any) {
    console.error("❌ Failed to run agent:", err);
    res.status(500).json({ error: "Failed to run agent" });
  }
});

export default router;