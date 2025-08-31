// server/tools/tool-library.ts
// Auto-discovery of all tools in ./implementations

import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import type { ToolDefinition } from "./tool-types.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const toolsDir = path.join(__dirname, "implementations");

let TOOL_LIBRARY: ToolDefinition[] = [];

/**
 * Load all tools from ./implementations
 */
export async function loadTools(): Promise<ToolDefinition[]> {
  const files = fs.readdirSync(toolsDir).filter(f => f.endsWith(".ts"));
  const toolDefs: ToolDefinition[] = [];

  for (const file of files) {
    try {
      const mod = await import(path.join(toolsDir, file));
      const tool = Object.values(mod)[0] as ToolDefinition;
      if (tool?.id) {
        // Convert params array to configSchema object for UI compatibility
        const configSchema: Record<string, any> = {};
        tool.params.forEach(param => {
          configSchema[param.name] = {
            type: param.type,
            label: param.name.charAt(0).toUpperCase() + param.name.slice(1),
            description: param.description,
            required: param.required,
            defaultValue: tool.defaults?.[param.name]
          };
        });
        
        const toolWithSchema = {
          ...tool,
          configSchema,
          icon: "🔧" // default icon
        };
        
        toolDefs.push(toolWithSchema as any);
      }
    } catch (error) {
      console.error(`Failed to load tool from ${file}:`, error);
    }
  }
  
  TOOL_LIBRARY = toolDefs;
  return toolDefs;
}

export function getToolById(id: string): ToolDefinition | undefined {
  return TOOL_LIBRARY.find(t => t.id === id);
}

export { TOOL_LIBRARY };