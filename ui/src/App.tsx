import { useState } from "react";

function App() {
  const [agents, setAgents] = useState<string[]>([]);
  const [output, setOutput] = useState("");

  async function loadAgents() {
    const res = await fetch("http://localhost:3001/agents");
    setAgents(await res.json());
  }

  async function runAgent(agent: string) {
    const res = await fetch("http://localhost:3001/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent, args: [] }),
    });
    setOutput(await res.text());
  }

  return (
    <div className="p-4">
      <button onClick={loadAgents}>Load Agents</button>
      <ul>
        {agents.map(a => (
          <li key={a}>
            <button onClick={() => runAgent(a)}>{a}</button>
          </li>
        ))}
      </ul>
      <pre className="mt-4">{output}</pre>
    </div>
  );
}

export default App;
