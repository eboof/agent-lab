// server/utils/agent-schema.ts
// Agent Schema Validation for YAML configs

// Simple validation without external dependencies
import * as yaml from "js-yaml";

// Agent Schema Definition
export const agentSchema = {
  type: "object",
  required: ["id", "name", "role", "model", "tools", "systemPrompt"],
  properties: {
    id: {
      type: "string",
      pattern: "^[a-z0-9-]+$",
      minLength: 1,
      maxLength: 50,
      description: "Unique agent identifier (kebab-case)"
    },
    name: {
      type: "string",
      minLength: 1,
      maxLength: 100,
      description: "Human-readable agent name"
    },
    role: {
      type: "string",
      minLength: 10,
      maxLength: 500,
      description: "Agent's primary function or specialty"
    },
    model: {
      type: "string",
      enum: ["claude-3-5-sonnet-20241022", "gpt-4o-mini", "gpt-4o"],
      description: "LLM model identifier"
    },
    tools: {
      type: "array",
      items: { type: "string" },
      maxItems: 20,
      description: "Array of tool IDs from tool library"
    },
    systemPrompt: {
      type: "string",
      minLength: 50,
      maxLength: 5000,
      description: "Instructions defining agent behavior"
    },
    inputSchema: {
      type: "object",
      description: "Expected input parameters",
      additionalProperties: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["string", "number", "boolean", "array", "object"] },
          required: { type: "boolean" },
          description: { type: "string" },
          default: {},
          options: { type: "array", items: { type: "string" } },
          minimum: { type: "number" },
          maximum: { type: "number" }
        }
      }
    },
    outputSchema: {
      type: "object",
      description: "Expected output format",
      additionalProperties: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["string", "number", "boolean", "array", "object"] },
          required: { type: "boolean" },
          description: { type: "string" },
          enum: { type: "array", items: { type: "string" } }
        }
      }
    },
    metadata: {
      type: "object",
      properties: {
        version: { type: "string" },
        author: { type: "string" },
        created: { type: "string", format: "date-time" },
        updated: { type: "string", format: "date-time" },
        description: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        category: { type: "string" }
      }
    },
    config: {
      type: "object",
      properties: {
        timeout: { type: "number", minimum: 10, maximum: 600 },
        retries: { type: "number", minimum: 0, maximum: 5 },
        temperature: { type: "number", minimum: 0, maximum: 1 },
        maxTokens: { type: "number", minimum: 100, maximum: 10000 }
      }
    },
    constraints: {
      type: "object",
      properties: {
        maxToolCalls: { type: "number", minimum: 1, maximum: 50 },
        allowedDomains: { type: "array", items: { type: "string" } },
        rateLimits: {
          type: "object",
          additionalProperties: { type: "string" }
        }
      }
    }
  }
};

// Simple validator without Ajv dependency
const validateAgent = (agent: any): boolean => {
  const required = ["id", "name", "role", "model", "tools", "systemPrompt"];
  return required.every(field => agent[field] !== undefined);
};

export interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  model: string;
  tools: string[];
  systemPrompt: string;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  metadata?: {
    version?: string;
    author?: string;
    created?: string;
    updated?: string;
    description?: string;
    tags?: string[];
    category?: string;
  };
  config?: {
    timeout?: number;
    retries?: number;
    temperature?: number;
    maxTokens?: number;
  };
  constraints?: {
    maxToolCalls?: number;
    allowedDomains?: string[];
    rateLimits?: Record<string, string>;
  };
}

export function parseAgentYAML(content: string): AgentDefinition {
  try {
    const parsed = yaml.load(content) as AgentDefinition;
    return parsed;
  } catch (error: any) {
    throw new Error(`Invalid YAML: ${error.message}`);
  }
}

export function validateAgentConfig(agent: AgentDefinition): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];
  
  // Required field validation
  if (!agent.id) errors.push("Missing required field: id");
  if (!agent.name) errors.push("Missing required field: name");
  if (!agent.role) errors.push("Missing required field: role");
  if (!agent.model) errors.push("Missing required field: model");
  if (!agent.tools) errors.push("Missing required field: tools");
  if (!agent.systemPrompt) errors.push("Missing required field: systemPrompt");
  
  // Type validation
  if (agent.id && !/^[a-z0-9-]+$/.test(agent.id)) {
    errors.push("Agent ID must be kebab-case (lowercase letters, numbers, hyphens only)");
  }
  if (agent.role && agent.role.length < 10) {
    errors.push("Role must be at least 10 characters");
  }
  if (agent.systemPrompt && agent.systemPrompt.length < 50) {
    errors.push("System prompt must be at least 50 characters");
  }
  if (agent.tools && !Array.isArray(agent.tools)) {
    errors.push("Tools must be an array");
  }
  
  const validModels = ["claude-3-5-sonnet-20241022", "gpt-4o-mini", "gpt-4o"];
  if (agent.model && !validModels.includes(agent.model)) {
    errors.push(`Model must be one of: ${validModels.join(", ")}`);
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

export function stringifyAgentYAML(agent: AgentDefinition): string {
  return yaml.dump(agent, {
    indent: 2,
    lineWidth: 80,
    noRefs: true
  });
}

// Tool existence validation (requires tool registry)
export async function validateToolsExist(tools: string[]): Promise<{ valid: boolean; missing?: string[] }> {
  try {
    // Import tool library dynamically to avoid circular deps
    const { listTools } = await import("../../tools/tool-library.ts");
    const availableTools = listTools();
    const availableIds = availableTools.map(t => t.id);
    
    const missing = tools.filter(toolId => !availableIds.includes(toolId));
    
    if (missing.length > 0) {
      return { valid: false, missing };
    }
    
    return { valid: true };
  } catch (error) {
    console.error("Failed to validate tools:", error);
    return { valid: false, missing: tools }; // Conservative: assume all missing
  }
}