import express from "express";
import bodyParser from "body-parser";
import { exec } from "child_process";
import path from "path";

const app = express();
app.use(bodyParser.json());

app.get("/agents", (req, res) => {
  res.json(["demo-agent"]);
});

app.post("/run", (req, res) => {
  const { agent, args } = req.body;
  const agentPath = path.join(__dirname, "../agents", `${agent}.ts`);

  exec(`npx ts-node ${agentPath} ${args.join(" ")}`, (err, stdout, stderr) => {
    if (err) return res.status(500).send(stderr);
    res.send(stdout);
  });
});

app.listen(3001, () => console.log("✅ Agent server running on http://localhost:3001"));
