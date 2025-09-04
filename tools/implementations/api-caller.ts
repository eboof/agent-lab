// tools/implementations/api-caller.ts
import type { ToolDefinition } from "../tool-types.ts";
import fetch from "node-fetch";

export const ApiCallerTool: ToolDefinition = {
  id: "api-caller",
  name: "API Caller",
  description: "Make GET or POST requests to any public API",
  params: [
    { name: "url", type: "string", required: true, description: "Full API endpoint (e.g., https://api.example.com/data)" },
    { name: "method", type: "string", required: false, description: "HTTP method (GET or POST, default=GET)" },
    { name: "headers", type: "string", required: false, description: "Optional request headers as JSON string" },
    { name: "body", type: "string", required: false, description: "Optional request body as JSON string (for POST)" }
  ],

  async call({ url, method = "GET", headers, body }) {
    if (!url) throw new Error("Missing required param: url");

    try {
      const response = await fetch(url, {
        method,
        headers: headers ? JSON.parse(headers) : {},
        body: method === "POST" ? body : undefined
      });

      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return { raw: text };
      }
    } catch (err: any) {
      throw new Error(`API call failed: ${err.message}`);
    }
  }
};