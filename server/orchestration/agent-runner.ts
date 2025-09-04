// server/orchestration/agent-runner.ts
// Single-agent execution engine for Agent-Lab vNext

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { parseAgentYAML, validateAgentConfig, validateToolsExist, type AgentDefinition } from "../utils/agent-schema.ts";
import { runTool } from "../../tools/tool-library.ts";
import { messageBus } from "./message-bus.ts";
import { executionStore } from "./execution-store.ts";

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
  executionId: string;
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

  async run(agentId: string, input: Record<string, any> = {}, executionId?: string): Promise<any> {
    const startTime = Date.now();
    const finalExecutionId = executionId || `exec_${agentId}_${Date.now()}`;
    
    this.context = {
      agentId,
      executionId: finalExecutionId,
      startTime,
      toolCalls: []
    };

    // Create execution if it doesn't exist
    if (!executionStore.getExecution(finalExecutionId)) {
      executionStore.createExecution(finalExecutionId, { 
        agentId, 
        singleAgent: true,
        startedBy: 'agent-runner'
      });
    }

    // Emit agent start event
    messageBus.agentStart(finalExecutionId, agentId, input);

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
      console.log(`▶️ Running agent: ${agent.id}`);
      const output = await this.executeAgent(agent, input);

      // Check if Smart Inbox needs user input
      const isSmartInbox = agentId.includes('smart-inbox');
      const hasEmails = output.emails || (this.context.toolCalls.some(call => 
        call.tool === 'gmail-get-emails' && call.result?.emails?.length > 0
      ));
      
      if (isSmartInbox && hasEmails && !input.decisions) {
        // Smart Inbox needs user decisions - pause execution
        const emailsData = output.emails || this.context.toolCalls
          .find(call => call.tool === 'gmail-get-emails')?.result?.emails || [];
        
        messageBus.agentAwaitingUser(finalExecutionId, agentId, {
          prompt: "Please review the emails and select actions for each one",
          outputSchema: { decisions: "object" },
          data: { emails: emailsData }
        });

        return {
          success: true,
          output,
          executionId: finalExecutionId,
          awaitingUser: true,
          toolCallResults: this.context.toolCalls,
          metadata: {
            agentId,
            executionId: finalExecutionId,
            executionTime: Date.now() - startTime,
            toolCalls: this.context.toolCalls.length,
            model: agent.model,
            timestamp: new Date().toISOString()
          }
        };
      }

      // Normal completion
      messageBus.agentDone(finalExecutionId, agentId, output);
      
      // 6. Return results
      return {
        success: true,
        output,
        executionId: finalExecutionId,
        toolCallResults: this.context.toolCalls, // Expose tool call results
        metadata: {
          agentId,
          executionId: finalExecutionId,
          executionTime: Date.now() - startTime,
          toolCalls: this.context.toolCalls.length,
          model: agent.model,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error: any) {
      console.error(`❌ Agent execution failed for ${agentId}:`, error);
      
      // Emit agent error event
      if (this.context) {
        messageBus.agentError(this.context.executionId, agentId, error.message);
      }
      
      return {
        success: false,
        error: error.message,
        executionId: finalExecutionId,
        metadata: {
          agentId,
          executionId: finalExecutionId,
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

TOOL USAGE - FOLLOW EXACTLY:
When you need to use a tool, write exactly this format:
TOOL_CALL: {"tool": "TOOLNAME", "params": {PARAMETERS}}

DO NOT USE:
- Function calls like weather(lat, lon) 
- Different field names like "type" or "action"
- Just parameter objects without "tool" field

EXAMPLES FOR YOUR TOOLS:
- TOOL_CALL: {"tool": "geocode-place", "params": {"place": "Brisbane"}}  
- TOOL_CALL: {"tool": "weather", "params": {"latitude": -27.47, "longitude": 153.02}}

You MUST use your tools to get weather data. Do not suggest alternatives.

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

  private async processAgentResponse(response: string, agent: AgentDefinition, depth: number = 0): Promise<any> {
    // Prevent infinite recursion
    if (depth > 5) {
      console.warn(`⚠️ Max recursion depth reached for agent ${agent.id}`);
      return { _rawResponse: response };
    }
    
    let processedResponse = response;
    let hasToolCalls = false;
    
    // Handle JSON format: TOOL_CALL: {...}
    const jsonToolCallRegex = /TOOL_CALL:\s*\{/g;
    let match;
    
    while ((match = jsonToolCallRegex.exec(response)) !== null) {
      hasToolCalls = true;
      const startIndex = match.index + match[0].length - 1; // Start at the opening brace
      let endIndex = match.index;
      try {
        // Find the complete JSON object by counting braces
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
        console.log(`🔍 Attempting to parse tool call JSON: ${jsonStr}`);
        const toolCall = JSON.parse(jsonStr);
        
        // Handle various formats the LLM might generate
        let tool, params;
        
        if (toolCall.tool) {
          // Standard format: {"tool": "weather", "params": {...}}
          tool = toolCall.tool;
          params = toolCall.params || {};
        } else if (toolCall.type) {
          // Alternative format: {"type": "weather", ...}
          tool = toolCall.type;
          params = { ...toolCall };
          delete params.type;
        } else if (toolCall.latitude !== undefined && toolCall.longitude !== undefined) {
          // Weather coordinates format: {"latitude": ..., "longitude": ...}
          tool = "weather";
          params = toolCall;
        } else if (toolCall.location && typeof toolCall.location === 'object') {
          // Nested location format: {"location": {"latitude": ..., "longitude": ...}}
          tool = "weather";
          params = toolCall.location;
        } else if (toolCall.location && typeof toolCall.location === 'string') {
          // Location string format: {"location": "Paris, France", "date": "..."}
          // Skip this - it's usually just information, not a tool call
          console.log(`⚠️ Skipping informational JSON: ${JSON.stringify(toolCall)}`);
          continue;
        } else {
          throw new Error(`Unable to determine tool from JSON: ${JSON.stringify(toolCall)}`);
        }
        
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
        console.error(`Failed JSON string: "${response.substring(startIndex, endIndex + 1)}"`);
        const errorText = `[TOOL_ERROR: ${error.message}]`;
        const fullMatch = response.substring(match.index, endIndex + 1);
        processedResponse = processedResponse.replace(fullMatch, errorText);
      }
    }

    // Handle function call format: TOOL_CALL: fetch_weather_data(latitude=..., longitude=...)
    const funcToolCallRegex = /TOOL_CALL:\s*([a-zA-Z_-]+)\(([^)]+)\)/g;
    let funcMatch;
    
    while ((funcMatch = funcToolCallRegex.exec(response)) !== null) {
      hasToolCalls = true;
      try {
        const funcName = funcMatch[1];
        const paramString = funcMatch[2];
        
        // Map function names to tool names
        const toolMap: Record<string, string> = {
          'fetch_weather_data': 'weather',
          'get_weather': 'weather',
          'weather_data': 'weather',
          'geocode': 'geocode-place',
          'get_coordinates': 'geocode-place'
        };
        
        const tool = toolMap[funcName] || funcName;
        
        // Parse parameters from function call format
        const params: Record<string, any> = {};
        const paramPairs = paramString.split(',').map(p => p.trim());
        
        for (const pair of paramPairs) {
          const [key, value] = pair.split('=').map(s => s.trim());
          // Try to parse as number, otherwise keep as string
          params[key] = isNaN(Number(value)) ? value.replace(/['"]/g, '') : Number(value);
        }
        
        // Validate tool is allowed
        if (!agent.tools.includes(tool)) {
          throw new Error(`Tool '${tool}' not available to this agent`);
        }
        
        // Execute tool
        const toolResult = await this.executeTool(tool, params);
        
        // Replace function call with result
        let resultText;
        try {
          resultText = `[TOOL_RESULT: ${JSON.stringify(toolResult, null, 2)}]`;
        } catch (jsonError) {
          resultText = `[TOOL_RESULT: ${JSON.stringify(toolResult, (key, value) => {
            if (value instanceof Date) return value.toISOString();
            if (typeof value === 'function') return '[Function]';
            if (typeof value === 'undefined') return null;
            return value;
          }, 2)}]`;
        }
        
        processedResponse = processedResponse.replace(funcMatch[0], resultText);
        
      } catch (error: any) {
        console.error(`Function tool call failed:`, error);
        const errorText = `[TOOL_ERROR: ${error.message}]`;
        processedResponse = processedResponse.replace(funcMatch[0], errorText);
      }
    }

    // If there were tool calls, continue the conversation
    if (hasToolCalls) {
      console.log(`🔄 Continuing conversation (depth ${depth}) with tool results`);
      const continuePrompt = `${processedResponse}\n\nContinue with the next steps. If you need to make more tool calls, use the TOOL_CALL format. Provide a final answer when complete.`;
      
      // Recursively execute to handle follow-up tool calls
      if (agent.model.startsWith("claude")) {
        return await this.continueWithClaude(agent, continuePrompt, depth + 1);
      } else if (agent.model.startsWith("gpt")) {
        return await this.continueWithOpenAI(agent, continuePrompt, depth + 1);
      }
    }

    // Parse structured output for specific agents
    const result: any = { _rawResponse: processedResponse };
    
    // Smart Inbox: Extract emails from tool calls (fallback approach)
    if (agent.id === "smart-inbox" && this.context?.toolCalls?.length > 0) {
      const gmailToolCall = this.context.toolCalls
        .filter(call => call.tool === "gmail-get-emails")
        .pop(); // Get the most recent one
      
      if (gmailToolCall?.result?.emails) {
        result.emails = gmailToolCall.result.emails;
        console.log(`✅ Smart Inbox: Added ${result.emails.length} emails from tool result`);
      }
    }
    
    return result;
  }


  private async executeTool(toolId: string, params: any): Promise<any> {
    const timestamp = new Date().toISOString();
    
    try {
      console.log(`🔧 Tool: ${toolId}`, `params:`, this.redactSensitiveParams(params));
      
      // Log tool execution start
      if (this.context) {
        messageBus.logMessage(this.context.executionId, 'info', `Executing tool: ${toolId}`, this.context.agentId);
      }
      
      // Add timeout wrapper
      const result = await Promise.race([
        runTool(toolId, params),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Tool '${toolId}' timed out after 30s`)), 30000)
        )
      ]);
      
      // Log tool call
      this.context?.toolCalls.push({
        tool: toolId,
        params,
        result,
        timestamp
      });

      // Log tool success
      if (this.context) {
        messageBus.logMessage(this.context.executionId, 'info', `Tool ${toolId} completed successfully`, this.context.agentId);
      }

      return result;
      
    } catch (error: any) {
      // Log failed tool call
      this.context?.toolCalls.push({
        tool: toolId,
        params,
        result: { error: error.message },
        timestamp
      });
      
      // Log tool error
      if (this.context) {
        messageBus.logMessage(this.context.executionId, 'error', `Tool ${toolId} failed: ${error.message}`, this.context.agentId);
      }
      
      throw error;
    }
  }

  private redactSensitiveParams(params: any): any {
    if (!params || typeof params !== 'object') return params;
    
    const redacted = { ...params };
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth', 'credentials'];
    
    for (const key in redacted) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        redacted[key] = '***';
      }
    }
    
    return redacted;
  }

  private async continueWithClaude(agent: AgentDefinition, continuePrompt: string, depth: number): Promise<any> {
    const config = agent.config || {};
    const client = getAnthropicClient();
    
    const claudeResult = await client.messages.create({
      model: agent.model as any,
      max_tokens: config.maxTokens || 2000,
      temperature: config.temperature || 0.3,
      messages: [{
        role: "user",
        content: continuePrompt
      }]
    });

    const content = claudeResult.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    const continueResult = await this.processAgentResponse(content.text, agent, depth);
    
    // Smart Inbox: Preserve emails from context in recursive calls
    if (agent.id === "smart-inbox" && this.context?.toolCalls?.length > 0 && !continueResult.emails) {
      const gmailToolCall = this.context.toolCalls
        .filter(call => call.tool === "gmail-get-emails")
        .pop();
      
      if (gmailToolCall?.result?.emails) {
        continueResult.emails = gmailToolCall.result.emails;
        console.log(`✅ Smart Inbox (depth ${depth}): Added ${continueResult.emails.length} emails from context`);
      }
    }
    
    return continueResult;
  }

  private async continueWithOpenAI(agent: AgentDefinition, continuePrompt: string, depth: number): Promise<any> {
    const config = agent.config || {};
    const client = getOpenAIClient();
    
    const openaiResult = await client.chat.completions.create({
      model: agent.model,
      max_tokens: config.maxTokens || 2000,
      temperature: config.temperature || 0.3,
      messages: [{
        role: "user",
        content: continuePrompt
      }]
    });

    const content = openaiResult.choices[0].message.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const openaiContinueResult = await this.processAgentResponse(content, agent, depth);
    
    // Smart Inbox: Preserve emails from context in recursive calls
    if (agent.id === "smart-inbox" && this.context?.toolCalls?.length > 0 && !openaiContinueResult.emails) {
      const gmailToolCall = this.context.toolCalls
        .filter(call => call.tool === "gmail-get-emails")
        .pop();
      
      if (gmailToolCall?.result?.emails) {
        openaiContinueResult.emails = gmailToolCall.result.emails;
        console.log(`✅ Smart Inbox OpenAI (depth ${depth}): Added ${openaiContinueResult.emails.length} emails from context`);
      }
    }
    
    return openaiContinueResult;
  }

  async continueWithUserInput(executionId: string, agentId: string, userInput: string): Promise<any> {
    console.log(`🔄 Continuing agent ${agentId} with user input in execution ${executionId}`);
    
    // Get the execution and agent state
    const execution = executionStore.getExecution(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    const agent = execution.agents.find(a => a.agentId === agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found in execution`);
    }

    // Get the user decisions from the agent's awaitingUserData
    const userDecisions = agent.awaitingUserData?.userResponse;
    if (!userDecisions) {
      throw new Error(`No user decisions found for agent ${agentId}`);
    }

    console.log(`📧 Continuing with user decisions:`, userDecisions);

    try {
      // Update agent status to running 
      messageBus.agentStart(executionId, agentId, { userDecisions });

      // Combine original input with user decisions
      const originalInput = agent.input || {};
      const combinedInput = {
        ...originalInput,
        decisions: userDecisions  // Use 'decisions' key as expected by Smart Inbox schema
      };

      console.log(`📧 Running agent with combined input:`, combinedInput);

      // Run the agent with both original input and user decisions
      const result = await this.run(agentId, combinedInput, executionId);
      
      console.log(`✅ Agent ${agentId} completed with user decisions`);
      return result;
    } catch (error: any) {
      console.error(`❌ Agent continuation failed:`, error);
      messageBus.agentError(executionId, agentId, error);
      throw error;
    }
  }
}

// Export singleton instance
export const agentRunner = new AgentRunner();