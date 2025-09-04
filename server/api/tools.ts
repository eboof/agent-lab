// server/api/tools.ts
import express from "express";
import * as fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { listTools, getToolById } from "../../tools/tool-library.ts";
import { handleApiError, handleApiSuccess } from "../utils/api-error.ts";

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Root endpoint - list all tools
router.get("/", (req, res) => {
  handleApiSuccess(res, listTools());
});

// List tools (with configSchema for Playground)
router.get("/list", (req, res) => {
  handleApiSuccess(res, listTools());
});

// Load tool source code for editing
router.get("/load/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const tool = getToolById(id);
    
    if (!tool) {
      return res.status(404).json({ error: `Tool ${id} not found` });
    }

    // Find the tool file (fix path resolution for ESM)
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const repoRoot = path.resolve(__dirname, "../..");
    const toolsDir = path.join(repoRoot, "tools/implementations");
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
      icon: "🔧",
      category: "custom",
      sourceCode,
      fileName,
      lastModified: fs.statSync(filePath).mtime
    });
    
  } catch (error: any) {
    console.error("Tool load error:", error);
    handleApiError(res, error, 500);
  }
});

// Create new tool
router.post("/create", async (req, res) => {
  try {
    const { id, name, description, icon, category, code, baseToolId } = req.body;
    
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
    const repoRoot = path.resolve(__dirname, "../..");
    const toolsDir = path.join(repoRoot, "tools/implementations");
    const fileName = `${id}.ts`;
    const filePath = path.join(toolsDir, fileName);

    // Generate tool code with proper imports
    const action = baseToolId ? "Cloned" : "Generated";
    const baseInfo = baseToolId ? ` (cloned from ${baseToolId})` : "";
    const toolCode = `// ${fileName}
// ${action} tool - ${new Date().toISOString()}${baseInfo}

import type { ToolDefinition } from "../tool-types.ts";

${code}
`;

    // Write tool file
    fs.writeFileSync(filePath, toolCode);

    // TODO: Reload tools registry
    console.log(`✅ Created tool: ${fileName}`);

    const actionText = baseToolId ? "cloned" : "created";
    res.json({ 
      success: true, 
      message: `Tool "${name}" ${actionText} successfully`,
      id,
      file: fileName,
      baseToolId
    });

  } catch (error: any) {
    console.error("Tool creation error:", error);
    handleApiError(res, error, 500);
  }
});

// Update existing tool
router.put("/update/:id", async (req, res) => {
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
    const repoRoot = path.resolve(__dirname, "../..");
    const toolsDir = path.join(repoRoot, "tools/implementations");
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

    // TODO: Reload tools registry
    console.log(`✅ Updated tool: ${fileName}`);

    res.json({ 
      success: true, 
      message: `Tool "${name || existingTool.name}" updated successfully`,
      id,
      file: fileName
    });

  } catch (error: any) {
    console.error("Tool update error:", error);
    handleApiError(res, error, 500);
  }
});

// Delete tool
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if tool exists
    const existingTool = getToolById(id);
    if (!existingTool) {
      return res.status(404).json({ error: `Tool with ID "${id}" not found` });
    }

    // Delete tool file
    const repoRoot = path.resolve(__dirname, "../..");
    const toolsDir = path.join(repoRoot, "tools/implementations");
    const fileName = `${id}.ts`;
    const filePath = path.join(toolsDir, fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `Tool file ${fileName} not found` });
    }

    // Remove the file
    fs.unlinkSync(filePath);

    // TODO: Reload tools registry
    console.log(`✅ Deleted tool: ${fileName}`);

    res.json({ 
      success: true, 
      message: `Tool "${existingTool.name}" deleted successfully`,
      id,
      file: fileName
    });

  } catch (error: any) {
    console.error("Tool deletion error:", error);
    handleApiError(res, error, 500);
  }
});

// Run tool
router.post("/run/:id", async (req, res) => {
  const tool = getToolById(req.params.id);
  if (!tool) return res.status(404).json({ error: "Tool not found" });

  try {
    const result = await tool.call(req.body || {});
    res.json({ tool: req.params.id, result });
  } catch (err: any) {
    console.error(`❌ Tool ${req.params.id} failed:`, err);
    handleApiError(res, err, 400);
  }
});

export default router;