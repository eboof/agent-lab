// server/tools/implementations/prompt-yaml.ts
// Unified ToolDefinition version of Prompt→YAML

import type { ToolDefinition } from "../tool-types.ts";
import * as yaml from "js-yaml";
import OpenAI from "openai";

export const PromptYamlTool: ToolDefinition = {
  id: "prompt-yaml",
  name: "Prompt→YAML Converter",
  description: "Turn a natural language prompt into structured YAML",
  params: [
    { name: "prompt", type: "string", required: true, description: "User instruction text" },
    { name: "format", type: "string", required: false, description: "yaml or json" },
  ],
  defaults: { format: "yaml" },

  async call({ prompt, format = "yaml" }) {
    if (!prompt) throw new Error("Missing required param: prompt");

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY missing");
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Convert prompts into structured YAML or JSON." },
        { role: "user", content: prompt }
      ]
    });

    const text = completion.choices[0].message?.content?.trim() || "";

    if (format === "yaml") {
      return { yaml: text.startsWith("```") ? text : "```yaml\n" + text + "\n```" };
    } else {
      // fallback: try to parse into JSON
      try {
        return { json: JSON.parse(text) };
      } catch {
        return { raw: text };
      }
    }
  }
};