// server/tools/tool-registry.ts
// Runtime mapping: tool ID → implementation class
// Server imports this file only to execute tools

import { TOOL_LIBRARY } from "./tool-library.ts";

// --- Import implementations ---
import { PromptYamlTool } from "./implementations/prompt-yaml-tool.ts";
// import { OpenAITool } from "./implementations/openai-tool.ts";
// import { AnthropicTool } from "./implementations/anthropic-tool.ts";
// import { YahooFinanceTool } from "./implementations/yahoo-finance-tool.ts";

// --- Map tool IDs to runtime classes ---
const TOOL_IMPLS: Record<string, any> = {
  "prompt-yaml": PromptYamlTool,
  // "openai-api": OpenAITool,
  // "anthropic-api": AnthropicTool,
  // "yahoo-finance": YahooFinanceTool,
};

/**
 * Get tool implementation for execution
 * @param id - Tool identifier
 * @returns Tool implementation class/object
 */
export function getTool(id: string) {
  return TOOL_IMPLS[id];
}

/**
 * Re-export metadata library for convenience
 * Server can import everything from this single file
 */
export { TOOL_LIBRARY } from "./tool-library.ts";