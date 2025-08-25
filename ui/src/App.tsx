import { useState } from "react";
import yaml from "js-yaml";

type Message = { role: string; content: string };

export default function App() {
  const [tab, setTab] = useState<"agents" | "chat">("agents");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
      <div className="w-full max-w-4xl bg-white shadow-2xl rounded-2xl p-8">
        {/* Tabs */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setTab("agents")}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              tab === "agents"
                ? "bg-blue-600 text-white shadow"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Agents
          </button>
          <button
            onClick={() => setTab("chat")}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              tab === "chat"
                ? "bg-blue-600 text-white shadow"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Chatbot
          </button>
        </div>

        {tab === "agents" ? <AgentsUI /> : <ChatUI />}
      </div>
    </div>
  );
}

// ---------------- Agents UI ----------------
function AgentsUI() {
  const [agents, setAgents] = useState<string[]>([]);
  const [output, setOutput] = useState("");
  const [input, setInput] = useState("");

  async function loadAgents() {
    const res = await fetch("/agents");
    setAgents(await res.json());
  }

  async function runAgent(agent: string) {
    const res = await fetch("/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent, args: input ? [input] : [] }),
    });
    setOutput(await res.text());
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 flex items-center">🤖 Agents</h1>

      <div className="flex mb-6">
        <input
          className="flex-grow border p-3 rounded-lg mr-2"
          placeholder="Enter query or ticker..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          onClick={loadAgents}
          className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Load Agents
        </button>
      </div>

      <ul className="space-y-2">
        {agents.map((a) => (
          <li key={a}>
            <button
              onClick={() => runAgent(a)}
              className="px-4 py-2 border rounded-lg w-full text-left bg-gray-100 hover:bg-gray-200"
            >
              ▶ Run {a}
            </button>
          </li>
        ))}
      </ul>

      {output && (
        <pre className="mt-6 p-4 bg-black text-green-400 rounded-lg whitespace-pre-wrap">
          {output}
        </pre>
      )}
    </div>
  );
}

// ---------------- Chat UI ----------------
function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("anthropic");

  async function sendMessage() {
    if (!input.trim()) return;
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input, model: selectedModel }),
    });
    const data = await res.json();
    if (data.reply) {
      setMessages(data.history);
    }
    setInput("");
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">💬 Chatbot</h1>
        
        {/* Model Selection Dropdown */}
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-700">Model:</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="anthropic">Claude (Anthropic)</option>
            <option value="openai">GPT-4o (OpenAI)</option>
          </select>
        </div>
      </div>

      <div className="border p-4 h-96 overflow-y-auto bg-gray-50 rounded-lg mb-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`mb-2 p-3 rounded-lg ${
              m.role === "user"
                ? "bg-blue-100 text-left"
                : "bg-green-100 text-left"
            }`}
          >
            <strong>{m.role === "user" ? "You" : "Bot"}:</strong> {m.content}
          </div>
        ))}
      </div>

      <div className="flex">
        <input
          className="flex-grow border p-3 rounded-lg mr-2"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}
