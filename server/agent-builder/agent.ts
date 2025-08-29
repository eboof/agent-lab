// server/agent-builder/agent.ts
// BaseAgent class for all generated agents

import { config as loadDotenv } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

export interface AgentConfig {
  name: string;
  description: string;
  version: string;
  systemPrompt: string;
  tools: ToolConfig[];
  inputSchema: Record<string, SchemaField>;
  outputSchema: Record<string, SchemaField>;
  dependencies?: string[];
  environmentVars?: string[];
  timeout?: number;
  retries?: number;
  memory?: boolean;
}

export interface ToolConfig {
  id: string;
  name: string;
  type: string;
  config?: Record<string, any>;
}

export interface SchemaField {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  
  constructor(config: AgentConfig) {
    // Load environment variables from .env file
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const envPath = path.resolve(__dirname, '../../.env');
    loadDotenv({ path: envPath });
    
    this.config = config;
  }

  async run(args: string[]): Promise<any> {
    console.log(`🤖 Running ${this.config.name}...`);
    console.log(`📝 Description: ${this.config.description}`);
    console.log(`🔧 Tools: ${this.config.tools.map(t => t.name).join(', ') || 'none'}`);
    
    try {
      // Parse input based on schema
      const input = this.parseInput(args);
      console.log(`📥 Input:`, input);
      
      // Execute agent logic
      const result = await this.execute(input);
      
      console.log(`📤 Output:`, result);
      return result;
      
    } catch (error: any) {
      console.error(`❌ ${this.config.name} failed:`, error.message);
      return { 
        error: error.message, 
        agent: this.config.name,
        timestamp: new Date().toISOString()
      };
    }
  }

  protected parseInput(args: string[]): Record<string, any> {
    const input: Record<string, any> = {};
    const schemaKeys = Object.keys(this.config.inputSchema);
    
    // Simple positional argument parsing
    schemaKeys.forEach((key, index) => {
      const field = this.config.inputSchema[key];
      const value = args[index];
      
      if (value !== undefined) {
        // Basic type conversion
        switch (field.type) {
          case 'number':
            input[key] = parseFloat(value) || 0;
            break;
          case 'boolean':
            input[key] = value.toLowerCase() === 'true';
            break;
          case 'array':
            input[key] = value.split(',').map(s => s.trim());
            break;
          default:
            input[key] = value;
        }
      } else if (field.required) {
        throw new Error(`Missing required parameter: ${key}`);
      }
    });
    
    return input;
  }

  protected async execute(input: Record<string, any>): Promise<any> {
    // Default implementation - subclasses can override
    return {
      message: `${this.config.name} executed successfully`,
      input,
      timestamp: new Date().toISOString(),
      agent: this.config.name,
      version: this.config.version
    };
  }

  // Utility methods for subclasses
  protected log(message: string, ...args: any[]) {
    console.log(`[${this.config.name}] ${message}`, ...args);
  }

  protected error(message: string, ...args: any[]) {
    console.error(`[${this.config.name}] ❌ ${message}`, ...args);
  }

  protected getToolConfig(toolId: string): ToolConfig | undefined {
    return this.config.tools.find(tool => tool.id === toolId);
  }

  protected hasTag(tag: string): boolean {
    return this.config.tools.some(tool => tool.type === tag);
  }

  // Helper methods for API access
  protected getApiKey(keyName: string): string | undefined {
    const value = process.env[keyName];
    if (!value) {
      this.error(`Missing environment variable: ${keyName}`);
      this.log(`Available env vars: ${Object.keys(process.env).filter(k => k.includes('API')).join(', ')}`);
    }
    return value;
  }

  protected getAnthropicKey(): string | undefined {
    return this.getApiKey('ANTHROPIC_API_KEY');
  }

  protected getOpenAIKey(): string | undefined {
    return this.getApiKey('OPENAI_API_KEY');
  }
}