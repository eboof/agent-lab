// Agent-Lab v4.0 - Unified AI Platform
// Combines agents, chatbot, and RAG functionality with local model support

import { useState, useEffect } from "react";
import yaml from "js-yaml";
import "./App.css";

type Message = { role: string; content: string };

interface RAGMessage {
  role: "user" | "bot";
  text: string;
  sources?: string[];
  model?: string;
  responseTime?: number;
}

interface ModelOption {
  id: string;
  name: string;
  type: "openai" | "local" | "anthropic";
  description: string;
}

export default function App() {
  const [tab, setTab] = useState<"agents" | "chat" | "rag">("agents");

  return (
    <div className="app-container">
      <div className="app-wrapper">
        {/* Header with Navigation */}
        <div className="app-header">
          <div className="header-content">
            <div className="title-section">
              <h1 className="app-title">🧪 Agent Lab</h1>
              <p className="app-subtitle">Your AI Lego Set - Agents, Chat & RAG</p>
            </div>
            
            {/* Navigation Tabs */}
            <div className="nav-tabs">
              <button
                onClick={() => setTab("agents")}
                className={`nav-tab ${tab === "agents" ? "active" : ""}`}
              >
                🤖 Agents
              </button>
              <button
                onClick={() => setTab("chat")}
                className={`nav-tab ${tab === "chat" ? "active" : ""}`}
              >
                💬 Chatbot
              </button>
              <button
                onClick={() => setTab("rag")}
                className={`nav-tab ${tab === "rag" ? "active" : ""}`}
              >
                🧠 RAG Chat
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="app-content">
          {tab === "agents" && <AgentsUI />}
          {tab === "chat" && <ChatUI />}
          {tab === "rag" && <RAGUI />}
        </div>
      </div>
    </div>
  );
}

// ---------------- Agents UI ----------------
function AgentsUI() {
  const [agents, setAgents] = useState<string[]>([]);
  const [output, setOutput] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadAgents() {
    try {
      const res = await fetch("http://localhost:3001/agents");
      setAgents(await res.json());
    } catch (err) {
      setOutput("❌ Error connecting to agent server. Make sure server is running on port 3001.");
    }
  }

  async function runAgent(agent: string) {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent, args: input ? [input] : [] }),
      });
      const data = await res.json();
      setOutput(yaml.dump(data.output || data, { indent: 2 }));
    } catch (err) {
      setOutput(`❌ Error running agent: ${err}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAgents();
  }, []);

  return (
    <div className="agents-ui">
      <div className="section-header">
        <h2 className="section-title">Available Agents</h2>
        <button onClick={loadAgents} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      <div className="input-section">
        <input
          className="agent-input"
          placeholder="Enter query, ticker symbol, or parameters..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>

      <div className="agents-grid">
        {agents.map((agent) => (
          <button
            key={agent}
            onClick={() => runAgent(agent)}
            disabled={loading}
            className="agent-card"
          >
            <div className="agent-name">▶ {agent}</div>
            <div className="agent-description">
              {agent === "stock-agent" && "Get real-time stock prices"}
              {agent === "daily-report" && "Generate daily market summary"}
              {agent === "research-agent" && "Research topics with AI"}
              {!["stock-agent", "daily-report", "research-agent"].includes(agent) && "Custom agent"}
            </div>
          </button>
        ))}
      </div>

      {loading && (
        <div className="loading-indicator">
          <div className="loading-spinner"></div>
          <span>Running agent...</span>
        </div>
      )}

      {output && (
        <div className="output-section">
          <h3>Output:</h3>
          <pre className="output-content">{output}</pre>
        </div>
      )}
    </div>
  );
}

// ---------------- Chat UI ----------------
function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("anthropic");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, model: selectedModel }),
      });
      const data = await res.json();
      if (data.history) {
        setMessages(data.history);
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setLoading(false);
    }
    setInput("");
  }

  return (
    <div className="chat-ui">
      <div className="chat-header">
        <h2 className="section-title">AI Chatbot</h2>
        <div className="model-selection">
          <label>Model:</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="model-select"
          >
            <option value="anthropic">Claude (Anthropic)</option>
            <option value="openai">GPT-4o (OpenAI)</option>
          </select>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h3>Start a conversation</h3>
            <p>Chat with Claude or GPT-4o about anything!</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`message-wrapper ${msg.role}`}>
            <div className={`message ${msg.role}`}>
              <strong>{msg.role === "user" ? "You" : "Bot"}:</strong> {msg.content}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="message-wrapper bot">
            <div className="message loading">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span>Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="input-area">
        <div className="input-container">
          <input
            className="message-input"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="send-btn"
          >
            {loading ? "•••" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------- RAG UI ----------------
function RAGUI() {
  const [messages, setMessages] = useState<RAGMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [models, setModels] = useState<ModelOption[]>([]);
  
  // Default model options (fallback if RAG server isn't running)
  const defaultModels: ModelOption[] = [
    { id: "gpt-4o-mini", name: "GPT-4o Mini", type: "openai", description: "Fast & efficient OpenAI model" },
    { id: "local-gpt2", name: "GPT-2 (Local)", type: "local", description: "124M params - Fast local inference" },
    { id: "local-distilgpt2", name: "DistilGPT-2 (Local)", type: "local", description: "82M params - Fastest local model" },
  ];
  
  // Load available models from Agent-Lab server (proxies to RAG)
  useEffect(() => {
    fetch("http://localhost:3001/rag/models")
      .then(res => res.json())
      .then(data => {
        const modelOptions: ModelOption[] = [
          ...data.openai_models.map((id: string) => ({
            id,
            name: id.toUpperCase().replace('-', ' '),
            type: "openai" as const,
            description: "OpenAI hosted model"
          })),
          ...data.local_models.map((id: string) => ({
            id,
            name: id.replace('local-', '').toUpperCase() + " (Local)",
            type: "local" as const,
            description: id === "local-gpt2" ? "124M params - Fast local inference" : "82M params - Fastest local model"
          }))
        ];
        setModels(modelOptions);
      })
      .catch(() => {
        // Fallback to default models if RAG API fails
        setModels(defaultModels);
      });
  }, []);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    
    const userMsg: RAGMessage = { role: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const startTime = Date.now();

    try {
      const res = await fetch("http://localhost:3001/rag/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          question: userMsg.text,
          model: selectedModel,
          k: 3 
        }),
      });
      
      if (!res.ok) {
        throw new Error(`RAG API error: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      const responseTime = Date.now() - startTime;

      const botMsg: RAGMessage = {
        role: "bot",
        text: data.answer || "⚠️ No answer received from RAG system",
        sources: data.sources || [],
        model: selectedModel,
        responseTime: responseTime,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("❌ RAG Error:", err);
      const errorMsg: RAGMessage = {
        role: "bot",
        text: `❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}. Try starting the RAG server from the agents tab.`,
        model: selectedModel,
        responseTime: Date.now() - startTime,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const selectedModelData = models.find(m => m.id === selectedModel);

  return (
    <div className="rag-ui">
      <div className="rag-header">
        <div className="header-content">
          <div className="title-section">
            <h2 className="section-title">RAG Chat</h2>
            <p className="subtitle">Ask questions about your documents</p>
          </div>
          
          {/* Model Selection */}
          <div className="model-selection">
            <label>Model:</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="model-select"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Model Info */}
        {selectedModelData && (
          <div className="model-info">
            <div className={`model-badge ${selectedModelData.type}`}>
              {selectedModelData.type === "local" ? "🏠 Local" : "☁️ Cloud"} • {selectedModelData.description}
            </div>
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <div className="chat-container">
        {messages.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>Ask about your documents</h3>
            <p>Get instant answers with sources from your knowledge base.</p>
            <div className="example-questions">
              <button
                onClick={() => setInput("What is machine learning?")}
                className="example-btn"
              >
                What is machine learning?
              </button>
              <button
                onClick={() => setInput("How does Python work?")}
                className="example-btn"
              >
                How does Python work?
              </button>
            </div>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`message-wrapper ${msg.role}`}>
            <div className={`message ${msg.role}`}>
              {msg.text}
            </div>
            
            {msg.role === "bot" && (
              <div className="message-meta">
                <div className="meta-left">
                  {msg.sources && msg.sources.length > 0 && (
                    <span>📚 Sources: {msg.sources.join(", ")}</span>
                  )}
                  {msg.model && (
                    <span>🤖 {models.find(m => m.id === msg.model)?.name || msg.model}</span>
                  )}
                </div>
                {msg.responseTime && (
                  <span className="response-time">⏱️ {(msg.responseTime / 1000).toFixed(1)}s</span>
                )}
              </div>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="message-wrapper bot">
            <div className="message loading">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span>Searching knowledge base...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="input-area">
        <div className="input-container">
          <textarea
            className="message-input"
            rows={2}
            placeholder="Ask anything about your documents..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="send-btn"
          >
            {loading ? "•••" : "Ask"}
          </button>
        </div>
      </div>
    </div>
  );
}