// server/showMeta.ts
// v20250826-0735 — expose project-meta.yaml via Express

import fs from "fs";
import path from "path";
import yaml from "js-yaml";

export function registerMetaEndpoint(app: any, __dirname: string) {
  const metaPath = path.resolve(__dirname, "../project-meta.yaml");

  app.get("/meta", (req: any, res: any) => {
    try {
      if (!fs.existsSync(metaPath)) {
        return res.status(404).json({ error: "project-meta.yaml not found" });
      }
      const raw = fs.readFileSync(metaPath, "utf-8");
      const data = yaml.load(raw);
      res.json(data);
    } catch (err: any) {
      console.error("❌ Failed to load project-meta.yaml:", err.message);
      res.status(500).json({ error: "Failed to load metadata" });
    }
  });
}
