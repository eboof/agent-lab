// tools/implementations/weather.ts
import type { ToolDefinition } from "../tool-types.ts";
import fetch from "node-fetch";

export const WeatherTool: ToolDefinition = {
  id: "weather",
  name: "Weather (Open-Meteo)",
  description: "Get current weather from the Open-Meteo API",
  params: [
    { name: "latitude", type: "number", required: true, description: "Latitude of the location (e.g., -27.47 for Brisbane)" },
    { name: "longitude", type: "number", required: true, description: "Longitude of the location (e.g., 153.03 for Brisbane)" }
  ],

  async call({ latitude, longitude }) {
    if (latitude === undefined || longitude === undefined) {
      throw new Error("Missing required params: latitude, longitude");
    }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
      const res = await fetch(url);
      const data = await res.json();
      return data.current_weather || data;
    } catch (err: any) {
      throw new Error(`Weather API error: ${err.message}`);
    }
  }
};