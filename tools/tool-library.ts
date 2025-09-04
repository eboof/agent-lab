// tools/tool-library.ts
// Unified tool registry with consistent ToolDefinition pattern

import { YahooFinanceTool } from "./implementations/yahoo-finance.ts";
import { SendEmailTool } from "./implementations/send-email.ts";
import { ApiCallerTool } from "./implementations/api-caller.ts";
import { CryptoPriceTool } from "./implementations/crypto-price.ts";
import { WeatherTool } from "./implementations/weather.ts";
import { GeocodePlaceTool } from "./implementations/geocode-place.ts";
import { GmailGetEmailsTool } from "./implementations/gmail-get-emails.ts";
import { GmailLabelEmailTool } from "./implementations/gmail-label-email.ts";
import { GmailDeleteEmailTool } from "./implementations/gmail-delete-email.ts";
import { GmailSendEmailTool } from "./implementations/gmail-send-email.ts";

export const toolLibrary = {
  [YahooFinanceTool.id]: YahooFinanceTool,
  [SendEmailTool.id]: SendEmailTool,
  [ApiCallerTool.id]: ApiCallerTool,
  [CryptoPriceTool.id]: CryptoPriceTool,
  [WeatherTool.id]: WeatherTool,
  [GeocodePlaceTool.id]: GeocodePlaceTool,
  [GmailGetEmailsTool.id]: GmailGetEmailsTool,
  [GmailLabelEmailTool.id]: GmailLabelEmailTool,
  [GmailDeleteEmailTool.id]: GmailDeleteEmailTool,
  [GmailSendEmailTool.id]: GmailSendEmailTool,
};

export type ToolId = keyof typeof toolLibrary;

export function getToolById(id: string) {
  return toolLibrary[id as ToolId];
}

export function listTools() {
  return Object.values(toolLibrary).map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    icon: "🔧",
    category: "custom",
    configSchema: toConfigSchema(t),
  }));
}

export async function runTool(toolId: string, params: any): Promise<any> {
  const tool = getToolById(toolId);
  if (!tool) {
    throw new Error(`Tool '${toolId}' not found`);
  }
  
  return await tool.call(params);
}

/**
 * Convert ToolDefinition.params → UI configSchema
 */
function toConfigSchema(tool: any) {
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

// Legacy exports for compatibility
export const tools = Object.values(toolLibrary);
