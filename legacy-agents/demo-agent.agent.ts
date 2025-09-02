// agents/demo-agent.ts
// Simple demo agent for testing

import { BaseAgent } from "../server/agent-builder/agent.ts";

export default class DemoAgent extends BaseAgent {
  constructor() {
    super({
      name: "Demo Agent",
      description: "Simple demo agent for testing basic functionality",
      version: "1.0",
      systemPrompt: "You are a helpful demo agent. Respond to user queries with enthusiasm.",
      tools: [],
      inputSchema: {
        "message": {
          "type": "string",
          "required": false,
          "description": "Optional message input"
        }
      },
      outputSchema: {
        "response": {
          "type": "string", 
          "required": true,
          "description": "Demo response"
        }
      }
    });
  }

  protected async execute(input: Record<string, any>): Promise<any> {
    this.log("Demo agent starting with input:", input);
    
    const message = input.message || "Hello from Demo Agent!";
    
    const result = {
      response: `🤖 Hello! I am Demo Agent. You said: "${message}". I could fetch stock prices, send an email, or do research if I had tools configured!`,
      timestamp: new Date().toISOString(),
      agent: this.config.name
    };
    
    this.log("Demo agent completed:", result);
    return result;
  }
}

