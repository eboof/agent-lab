// tools/tool-library.ts
// Central registry for all tools with params → configSchema conversion

import type { ToolDefinition } from "./tool-types.ts";

// Import each tool here
import { YahooFinanceTool } from "./implementations/yahoo-finance.ts";
import { SendEmailTool } from "./implementations/send-email.ts";
// import { OpenAITool } from "./implementations/openai-api.ts";

const tools: ToolDefinition[] = [
  YahooFinanceTool,
  // OpenAITool,
   SendEmailTool,
];

/**
 * Convert ToolDefinition.params → Playground configSchema
 */
function toConfigSchema(tool: ToolDefinition) {
  const schema: Record<string, any> = {};
  if (tool.params) {
    for (const param of tool.params) {
      schema[param.name] = {
        type: param.type || "string",
        label: param.name,
        description: param.description || "",
        required: param.required || false,
        defaultValue: param.default || "",
        options: (param as any).options || [],
      };
    }
  }
  return schema;
}

/**
 * Return tools in a Playground-friendly format
 */
export function listTools() {
  return tools.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    icon: "🔧",
    category: "custom",
    configSchema: toConfigSchema(t),
  }));
}

/**
 * Find a tool by ID
 */
export function getToolById(id: string) {
  return tools.find((t) => t.id === id);
}

/**
 * Execute a tool by ID with parameters
 */
export async function runTool(toolId: string, params: any): Promise<any> {
  const tool = getToolById(toolId);
  if (!tool) {
    throw new Error(`Tool '${toolId}' not found`);
  }
  
  return await tool.call(params);
}

export { tools };
