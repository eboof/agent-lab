// server/tools/implementations/prompt-yaml-tool.ts
// Converts natural language into YAML using OpenAI

import OpenAI from "openai";

export class PromptYamlTool {
  static async call(params: { prompt: string }): Promise<any> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is missing in environment. Please set it to use the Prompt→YAML converter tool.");
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = params.prompt || "Convert this into structured YAML.";

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a converter that outputs only valid YAML." },
        { role: "user", content: prompt }
      ],
      temperature: 0,
    });

    const text = response.choices[0]?.message?.content?.trim();
    return { yaml: text || "" };
  }
}
