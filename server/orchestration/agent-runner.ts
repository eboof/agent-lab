// server/orchestration/agent-runner.ts
// Single-agent execution engine for Agent-Lab vNext

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { parseAgentYAML, validateAgentConfig, validateToolsExist, type AgentDefinition } from "../utils/agent-schema.ts";
import { runTool } from "../../tools/tool-library.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");

// Lazy initialization to avoid startup errors
let anthropic: Anthropic | null = null;
let openai: OpenAI | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY environment variable is required");
    }
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropic;
}

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

export interface ExecutionContext {
  agentId: string;
  startTime: number;
  toolCalls: Array<{
    tool: string;
    params: any;
    result: any;
    timestamp: string;
  }>;
}

export class AgentRunner {
  private agentsDir: string;
  private context: ExecutionContext | null = null;

  constructor(agentsDir?: string) {
    this.agentsDir = agentsDir || path.join(repoRoot, "agents");
  }

  async run(agentId: string, input: Record<string, any> = {}): Promise<any> {
    const startTime = Date.now();
    
    this.context = {
      agentId,
      startTime,
      toolCalls: []
    };

    try {
      // 1. Resolve agent file path
      const agentPath = path.join(this.agentsDir, `${agentId}.agent.yaml`);
      
      // 2. Load and parse agent YAML
      if (!fs.existsSync(agentPath)) {
        throw new Error(`Agent '${agentId}' not found at ${agentPath}`);
      }

      const yamlContent = fs.readFileSync(agentPath, "utf-8");
      const agent = parseAgentYAML(yamlContent);

      // 3. Validate agent configuration
      const validation = validateAgentConfig(agent);
      if (!validation.valid) {
        throw new Error(`Invalid agent config: ${validation.errors?.join(", ")}`);
      }

      // 4. Validate input against schema
      if (agent.inputSchema) {
        this.validateInput(input, agent.inputSchema);
      }

      // 5. Execute agent with model
      const output = await this.executeAgent(agent, input);

      // 6. Return results
      return {
        success: true,
        output,
        metadata: {
          agentId,
          executionTime: Date.now() - startTime,
          toolCalls: this.context.toolCalls.length,
          model: agent.model,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error: any) {
      console.error(`❌ Agent execution failed for ${agentId}:`, error);
      
      return {
        success: false,
        error: error.message,
        metadata: {
          agentId,
          executionTime: Date.now() - startTime,
          toolCalls: this.context?.toolCalls.length || 0,
          model: "unknown",
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  private validateInput(input: Record<string, any>, schema: Record<string, any>): void {
    // Basic validation - check required fields
    for (const [key, field] of Object.entries(schema)) {
      const fieldSchema = field as any;
      if (fieldSchema.required && (input[key] === undefined || input[key] === "")) {
        throw new Error(`Missing required input field: ${key}`);
      }
    }
  }

  private async executeAgent(agent: AgentDefinition, input: Record<string, any>): Promise<any> {
    const systemPrompt = this.buildSystemPrompt(agent, input);
    const userMessage = this.formatInputMessage(input);

    // Execute based on model
    if (agent.model.startsWith("claude")) {
      return await this.executeWithClaude(agent, systemPrompt, userMessage);
    } else if (agent.model.startsWith("gpt")) {
      return await this.executeWithOpenAI(agent, systemPrompt, userMessage);
    } else {
      throw new Error(`Unsupported model: ${agent.model}`);
    }
  }

  private buildSystemPrompt(agent: AgentDefinition, input: Record<string, any>): string {
    const toolList = agent.tools.map(toolId => `- ${toolId}`).join("\n");
    
    return `${agent.systemPrompt}

AVAILABLE TOOLS:
${toolList}

To use a tool, respond with a function call in this format:
TOOL_CALL: {"tool": "tool-id", "params": {"param1": "value1"}}

You can make multiple tool calls. Always explain your reasoning and provide a final answer.

INPUT CONTEXT:
${JSON.stringify(input, null, 2)}`;
  }

  private formatInputMessage(input: Record<string, any>): string {
    return Object.entries(input)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");
  }

  private async executeWithClaude(agent: AgentDefinition, systemPrompt: string, userMessage: string): Promise<any> {
    const config = agent.config || {};
    const client = getAnthropicClient();
    
    const result = await client.messages.create({
      model: agent.model as any,
      max_tokens: config.maxTokens || 2000,
      temperature: config.temperature || 0.3,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userMessage
        }
      ]
    });

    const content = result.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    return await this.processAgentResponse(content.text, agent);
  }

  private async executeWithOpenAI(agent: AgentDefinition, systemPrompt: string, userMessage: string): Promise<any> {
    const config = agent.config || {};
    const client = getOpenAIClient();
    
    const result = await client.chat.completions.create({
      model: agent.model,
      max_tokens: config.maxTokens || 2000,
      temperature: config.temperature || 0.3,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user", 
          content: userMessage
        }
      ]
    });

    const content = result.choices[0].message.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    return await this.processAgentResponse(content, agent);
  }

  private async processAgentResponse(response: string, agent: AgentDefinition): Promise<any> {
    // Extract tool calls with proper balanced brace matching
    let processedResponse = response;
    
    const toolCallRegex = /TOOL_CALL:\s*\{/g;
    let match;
    
    while ((match = toolCallRegex.exec(response)) !== null) {
      let endIndex = match.index;
      try {
        // Find the complete JSON object by counting braces
        const startIndex = match.index + match[0].length - 1; // Start at the opening brace
        let braceCount = 0;
        endIndex = startIndex;
        
        for (let i = startIndex; i < response.length; i++) {
          if (response[i] === '{') braceCount++;
          if (response[i] === '}') braceCount--;
          if (braceCount === 0) {
            endIndex = i;
            break;
          }
        }
        
        const jsonStr = response.substring(startIndex, endIndex + 1);
        const toolCall = JSON.parse(jsonStr);
        const { tool, params } = toolCall;
        
        // Validate tool is allowed
        if (!agent.tools.includes(tool)) {
          throw new Error(`Tool '${tool}' not available to this agent`);
        }
        
        // Execute tool
        const toolResult = await this.executeTool(tool, params);
        
        // Replace tool call with result in response - safer JSON serialization
        let resultText;
        try {
          resultText = `[TOOL_RESULT: ${JSON.stringify(toolResult, null, 2)}]`;
        } catch (jsonError) {
          // Handle non-serializable values like Dates
          resultText = `[TOOL_RESULT: ${JSON.stringify(toolResult, (key, value) => {
            if (value instanceof Date) return value.toISOString();
            if (typeof value === 'function') return '[Function]';
            if (typeof value === 'undefined') return null;
            return value;
          }, 2)}]`;
        }
        
        // Replace the full tool call (from TOOL_CALL: to end of JSON) with result
        const fullMatch = response.substring(match.index, endIndex + 1);
        processedResponse = processedResponse.replace(fullMatch, resultText);
        
      } catch (error: any) {
        console.error(`Tool call failed:`, error);
        const errorText = `[TOOL_ERROR: ${error.message}]`;
        const fullMatch = response.substring(match.index, endIndex + 1);
        processedResponse = processedResponse.replace(fullMatch, errorText);
      }
    }

    return { _rawResponse: processedResponse };
  }

  private async executeTool(toolId: string, params: any): Promise<any> {
    const timestamp = new Date().toISOString();
    
    try {
      const result = await runTool(toolId, params);
      
      // Log tool call
      this.context?.toolCalls.push({
        tool: toolId,
        params,
        result,
        timestamp
      });

      return result;
      
    } catch (error: any) {
      // Log failed tool call
      this.context?.toolCalls.push({
        tool: toolId,
        params,
        result: { error: error.message },
        timestamp
      });
      
      throw error;
    }
  }
}

// Export singleton instance
export const agentRunner = new AgentRunner();