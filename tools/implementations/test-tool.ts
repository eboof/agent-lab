// test-tool.ts
// Updated tool - 2025-08-31T09:28:41.593Z

import type { ToolDefinition } from "../tool-types.ts";

export const TestTool: ToolDefinition = {
  id: "test-tool",
  name: "Enhanced Test Tool",
  description: "An enhanced test tool with more features",
  params: [
    { name: "message", type: "string", required: true, description: "Message to echo" },
    { name: "uppercase", type: "boolean", required: false, description: "Convert to uppercase" }
  ],

  async call({ message, uppercase = false }) {
    const result = uppercase ? message.toUpperCase() : message;
    return { 
      echo: result, 
      original: message,
      wasUppercased: uppercase,
      timestamp: new Date().toISOString() 
    };
  }
};
