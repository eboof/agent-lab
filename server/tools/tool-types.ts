// server/tools/tool-types.ts
// Canonical definition of ToolDefinition

export interface ToolParam {
  name: string;
  type: "string" | "number" | "boolean" | "object";
  required?: boolean;
  description?: string;
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  params: ToolParam[];
  defaults?: Record<string, any>;
  call: (params: Record<string, any>) => Promise<any>;
}