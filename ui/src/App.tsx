// Agent-Lab v4.0 - Unified AI Platform
// Combines agents, chatbot, and RAG functionality with local model support

import { useState, useEffect } from "react";
import yaml from "js-yaml";
import "./App.css";

// Tool Library (simplified version for UI)
const TOOLS = [
  { id: 'yahoo-finance', name: 'Yahoo Finance API', category: 'api', icon: '📈', description: 'Get real-time stock prices and market data' },
  { id: 'openai-api', name: 'OpenAI API', category: 'ai', icon: '🤖', description: 'Access GPT models for text generation' },
  { id: 'anthropic-api', name: 'Anthropic Claude', category: 'ai', icon: '🧠', description: 'Access Claude models for reasoning' },
  { id: 'cli-tool', name: 'CLI Tool', category: 'system', icon: '💻', description: 'Execute shell commands safely (ls, cat, curl, etc.)' },
  { id: 'email-sender', name: 'Email Sender', category: 'communication', icon: '📧', description: 'Send emails via SMTP' },
  { id: 'web-scraper', name: 'Web Scraper', category: 'web', icon: '🌐', description: 'Extract data from websites' },
  { id: 'json-processor', name: 'JSON Processor', category: 'data', icon: '🔧', description: 'Parse and transform JSON data' },
  { id: 'file-system', name: 'File System', category: 'system', icon: '📁', description: 'Read and write files safely' },
];

const CATEGORIES = {
  'api': '🌐 API Integrations',
  'ai': '🤖 AI Models', 
  'data': '📊 Data Processing',
  'communication': '📧 Communication',
  'web': '🌍 Web Tools',
  'system': '⚙️ System Tools'
};

// Agent Builder Component  
const AgentBuilder = () => {
  const [form, setForm] = useState({
    name: "MyAgent",
    description: "An example agent",
    version: "0.1",
    systemPrompt: "You are a helpful agent.",
    inputSchema: [
      { key: "query", type: "string", required: true, description: "User query or request" }
    ],
    outputSchema: [
      { key: "result", type: "string", required: true, description: "Agent response" }
    ],
    selectedTools: [] as string[]
  });

  const [activeSection, setActiveSection] = useState('metadata');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{type: string, message: string} | null>(null);
  const [existingAgents, setExistingAgents] = useState<any[]>([]);
  const [loadMenuOpen, setLoadMenuOpen] = useState(false);

  const updateForm = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleTool = (toolId: string) => {
    const isSelected = form.selectedTools.includes(toolId);
    const newTools = isSelected 
      ? form.selectedTools.filter(id => id !== toolId)
      : [...form.selectedTools, toolId];
    updateForm('selectedTools', newTools);
  };

  const addSchemaField = (schemaType: string) => {
    const newField = {
      key: `field${(form as any)[schemaType].length + 1}`,
      type: 'string',
      required: false,
      description: ''
    };
    updateForm(schemaType, [...(form as any)[schemaType], newField]);
  };

  const updateSchemaField = (schemaType: string, index: number, field: string, value: any) => {
    const updated = [...(form as any)[schemaType]];
    updated[index] = { ...updated[index], [field]: value };
    updateForm(schemaType, updated);
  };

  const removeSchemaField = (schemaType: string, index: number) => {
    const updated = (form as any)[schemaType].filter((_: any, i: number) => i !== index);
    updateForm(schemaType, updated);
  };

  const formatSchemaForCode = (schema: any) => {
    if (schema.length === 0) return '{}';
    const obj = schema.reduce((acc: any, field: any) => {
      acc[field.key] = { type: field.type, required: field.required, description: field.description };
      return acc;
    }, {});
    return JSON.stringify(obj, null, 6).replace(/^/gm, '      ');
  };

  const formatToolsForCode = (toolIds: string[]) => {
    if (toolIds.length === 0) return '[]';
    const toolConfigs = toolIds.map((id: string) => {
      const tool = TOOLS.find(t => t.id === id);
      return { id, name: tool?.name || id, type: tool?.category || 'unknown' };
    });
    return JSON.stringify(toolConfigs, null, 6).replace(/^/gm, '      ');
  };

  // Load existing agents
  const loadExistingAgents = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/agents/list');
      const data = await response.json();
      setExistingAgents(data.agents || []);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const loadAgent = async (filename: string) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/agents/load/${filename}`);
      const data = await response.json();
      
      if (response.ok && data.parsed) {
        // Update form with loaded agent data
        setForm({
          name: data.parsed.name || 'Loaded Agent',
          description: data.parsed.description || 'Loaded from file',
          version: data.parsed.version || '0.1',
          systemPrompt: data.parsed.systemPrompt || 'You are a helpful agent.',
          inputSchema: data.parsed.inputSchema || [],
          outputSchema: data.parsed.outputSchema || [],
          selectedTools: data.parsed.selectedTools || []
        });
        setSaveStatus({ type: 'success', message: `✅ Loaded ${filename}` });
        setLoadMenuOpen(false);
      } else {
        setSaveStatus({ type: 'error', message: `❌ Failed to load ${filename}: ${data.error}` });
      }
    } catch (error: any) {
      console.error('Load error:', error);
      setSaveStatus({ type: 'error', message: `❌ Network error loading ${filename}` });
    } finally {
      setLoading(false);
    }
  };

  // Load agents when component mounts or load menu opens
  useEffect(() => {
    if (loadMenuOpen) {
      loadExistingAgents();
    }
  }, [loadMenuOpen]);

  const saveAgent = async () => {
    setLoading(true);
    setSaveStatus(null);
    
    try {
      const response = await fetch('http://localhost:3001/api/agents/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSaveStatus({
          type: 'success',
          message: `✅ ${result.message} File: ${result.filename}`
        });
        
        // Reset form after successful save
        setTimeout(() => {
          setForm({
            name: "MyAgent",
            description: "An example agent", 
            version: "0.1",
            systemPrompt: "You are a helpful agent.",
            inputSchema: [{ key: "query", type: "string", required: true, description: "User query or request" }],
            outputSchema: [{ key: "result", type: "string", required: true, description: "Agent response" }],
            selectedTools: []
          });
          setSaveStatus(null);
          setActiveSection('metadata');
        }, 3000);
        
      } else {
        setSaveStatus({
          type: 'error',
          message: `❌ ${result.error}: ${result.message || ''}`
        });
      }
      
    } catch (error: any) {
      setSaveStatus({
        type: 'error',
        message: `❌ Network error: ${error?.message || 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  const generatedCode = `
import { BaseAgent } from "../../server/agent-builder/agent.ts";

export class ${form.name.replace(/\\s+/g, "")}Agent extends BaseAgent {
  constructor() {
    super({
      name: "${form.name}",
      description: "${form.description}",
      version: "${form.version}",
      systemPrompt: \`${form.systemPrompt}\`,
      tools: ${formatToolsForCode(form.selectedTools)},
      inputSchema: ${formatSchemaForCode(form.inputSchema)},
      outputSchema: ${formatSchemaForCode(form.outputSchema)}
    });
  }
}
`;

  return (
    <div className="agent-builder-container">
      {/* Left Side - Form Sections */}
      <div className="builder-form">
        {/* Section Navigation */}
        <div className="builder-nav">
          <button
            onClick={() => setActiveSection('metadata')}
            className={`builder-nav-btn ${activeSection === 'metadata' ? 'active' : ''}`}
          >
            📝 Metadata
          </button>
          <button
            onClick={() => setActiveSection('tools')}
            className={`builder-nav-btn ${activeSection === 'tools' ? 'active' : ''}`}
          >
            🛠️ Tools ({form.selectedTools.length})
          </button>
          <button
            onClick={() => setActiveSection('schemas')}
            className={`builder-nav-btn ${activeSection === 'schemas' ? 'active' : ''}`}
          >
            📋 Schemas
          </button>
        </div>

        {/* Metadata Section */}
        {activeSection === 'metadata' && (
          <div className="builder-section">
            <h3 className="section-heading">📝 Agent Metadata</h3>
            <div className="form-grid">
              <div className="form-field">
                <label>Name</label>
                <input
                  value={form.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label>Description</label>
                <input
                  value={form.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label>Version</label>
                <input
                  value={form.version}
                  onChange={(e) => updateForm('version', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-field full-width">
                <label>System Prompt</label>
                <textarea
                  value={form.systemPrompt}
                  onChange={(e) => updateForm('systemPrompt', e.target.value)}
                  className="form-textarea"
                  rows={4}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tools Section */}
        {activeSection === 'tools' && (
          <div className="builder-section">
            <h3 className="section-heading">🛠️ Select Tools</h3>
            <div className="tools-grid">
              {Object.entries(CATEGORIES).map(([category, label]) => {
                const categoryTools = TOOLS.filter(tool => tool.category === category);
                
                if (categoryTools.length === 0) {
                  return null;
                }
                
                return (
                  <div key={category} className="tool-category">
                    <h4 className="category-label">{label}</h4>
                    <div className="category-tools">
                      {categoryTools.map(tool => (
                        <div
                          key={tool.id}
                          onClick={() => toggleTool(tool.id)}
                          className={`tool-card ${form.selectedTools.includes(tool.id) ? 'selected' : ''}`}
                        >
                          <div className="tool-header">
                            <span className="tool-icon">{tool.icon}</span>
                            <span className="tool-name">{tool.name}</span>
                            {form.selectedTools.includes(tool.id) && (
                              <span className="selected-indicator">✓</span>
                            )}
                          </div>
                          <p className="tool-description">{tool.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Schemas Section */}
        {activeSection === 'schemas' && (
          <div className="builder-section">
            <h3 className="section-heading">📋 Input & Output Schemas</h3>
            
            {/* Input Schema */}
            <div className="schema-editor">
              <div className="schema-header">
                <h4>Input Schema</h4>
                <button
                  onClick={() => addSchemaField('inputSchema')}
                  className="add-field-btn"
                >
                  + Add Field
                </button>
              </div>
              {form.inputSchema.map((field, index) => (
                <div key={index} className="schema-field">
                  <input
                    placeholder="Field name"
                    value={field.key}
                    onChange={(e) => updateSchemaField('inputSchema', index, 'key', e.target.value)}
                    className="field-input small"
                  />
                  <select
                    value={field.type}
                    onChange={(e) => updateSchemaField('inputSchema', index, 'type', e.target.value)}
                    className="field-select small"
                  >
                    <option value="string">string</option>
                    <option value="number">number</option>
                    <option value="boolean">boolean</option>
                  </select>
                  <input
                    placeholder="Description"
                    value={field.description}
                    onChange={(e) => updateSchemaField('inputSchema', index, 'description', e.target.value)}
                    className="field-input"
                  />
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateSchemaField('inputSchema', index, 'required', e.target.checked)}
                    />
                    Required
                  </label>
                  <button
                    onClick={() => removeSchemaField('inputSchema', index)}
                    className="remove-btn"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            {/* Output Schema */}
            <div className="schema-editor">
              <div className="schema-header">
                <h4>Output Schema</h4>
                <button
                  onClick={() => addSchemaField('outputSchema')}
                  className="add-field-btn"
                >
                  + Add Field
                </button>
              </div>
              {form.outputSchema.map((field, index) => (
                <div key={index} className="schema-field">
                  <input
                    placeholder="Field name"
                    value={field.key}
                    onChange={(e) => updateSchemaField('outputSchema', index, 'key', e.target.value)}
                    className="field-input small"
                  />
                  <select
                    value={field.type}
                    onChange={(e) => updateSchemaField('outputSchema', index, 'type', e.target.value)}
                    className="field-select small"
                  >
                    <option value="string">string</option>
                    <option value="number">number</option>
                    <option value="boolean">boolean</option>
                  </select>
                  <input
                    placeholder="Description"
                    value={field.description}
                    onChange={(e) => updateSchemaField('outputSchema', index, 'description', e.target.value)}
                    className="field-input"
                  />
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateSchemaField('outputSchema', index, 'required', e.target.checked)}
                    />
                    Required
                  </label>
                  <button
                    onClick={() => removeSchemaField('outputSchema', index)}
                    className="remove-btn"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Section */}
        <div className="save-section">
          <div className="action-buttons">
            <button 
              onClick={() => setLoadMenuOpen(!loadMenuOpen)}
              className="load-btn"
            >
              📂 Load Agent
            </button>
            <button 
              onClick={saveAgent}
              disabled={loading || !form.name || !form.description}
              className="save-btn"
            >
              {loading ? "⏳ Generating..." : "💾 Generate Agent"}
            </button>
          </div>
          
          <div className="cli-info">
            <h4>⚡ CLI Tool Available</h4>
            <p>Create agents faster from terminal:</p>
            <div className="cli-commands">
              <code>pnpm run agent-cli</code> <span>(Interactive mode)</span><br/>
              <code>pnpm run agent-cli "Bot Name" "Description" tool1 tool2</code> <span>(Fast mode)</span>
            </div>
            <p><strong>Example:</strong></p>
            <code>pnpm run agent-cli "Stock Bot" "Analyzes stocks" yahoo-finance openai-api</code>
          </div>
          
          {loadMenuOpen && (
            <div className="load-menu">
              <h4>📂 Load Existing Agent</h4>
              {existingAgents.length === 0 ? (
                <p>No agents found. Create your first agent!</p>
              ) : (
                <div className="agent-list">
                  {existingAgents.map(agent => (
                    <div key={agent.filename} className="agent-item">
                      <div className="agent-info">
                        <strong>{agent.name}</strong>
                        <small>{new Date(agent.lastModified).toLocaleDateString()}</small>
                      </div>
                      <button 
                        onClick={() => loadAgent(agent.filename)}
                        className="load-agent-btn"
                      >
                        Load
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button 
                onClick={() => setLoadMenuOpen(false)}
                className="close-load-btn"
              >
                Close
              </button>
            </div>
          )}
          {saveStatus && (
            <div className={`save-status ${saveStatus.type}`}>
              {saveStatus.message}
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Code Preview */}
      <div className="code-preview">
        <h3 className="preview-header">Generated Code</h3>
        <div className="code-container">
          <pre className="code-content">{generatedCode}</pre>
        </div>
      </div>
    </div>
  );
};

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
  const [subTab, setSubTab] = useState<"run" | "build">("run");
  const [agents, setAgents] = useState<string[]>([]);
  const [output, setOutput] = useState("");
  const [input, setInput] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [loading, setLoading] = useState(false);
  const [ragStatus, setRagStatus] = useState<{ready: boolean, process: string}>({ready: false, process: "stopped"});
  const [ragLoading, setRagLoading] = useState(false);

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

  async function loadRagStatus() {
    try {
      const res = await fetch("http://localhost:3001/rag/status");
      const data = await res.json();
      setRagStatus(data);
    } catch (err) {
      console.error("Failed to load RAG status:", err);
    }
  }

  async function startRagServer() {
    setRagLoading(true);
    try {
      const res = await fetch("http://localhost:3001/rag/start", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setOutput("🚀 RAG server starting...");
        // Poll status until ready, then check if it actually started
        setTimeout(() => {
          loadRagStatus();
          setTimeout(() => {
            if (!ragStatus.ready) {
              setOutput("⚠️ RAG server failed to start. This may be due to missing Python dependencies. The AI Chatbot and Agent Builder work without RAG.");
            }
          }, 5000);
        }, 2000);
      } else {
        setOutput(`❌ Failed to start RAG server: ${data.error}`);
      }
    } catch (err) {
      setOutput(`❌ Error starting RAG server: ${err}`);
    } finally {
      setRagLoading(false);
    }
  }

  useEffect(() => {
    loadAgents();
    loadRagStatus();
  }, []);

  return (
    <div className="agents-ui">
      <div className="section-header">
        <h2 className="section-title">Agents</h2>
        
        {/* RAG Server Status */}
        <div className="rag-status-section">
          <div className="rag-status">
            <span className={`status-indicator ${ragStatus.ready ? 'ready' : 'stopped'}`}>
              {ragStatus.ready ? '🟢' : '🔴'} RAG Server: {ragStatus.ready ? 'Ready' : 'Stopped'}
            </span>
            {!ragStatus.ready && (
              <button 
                onClick={startRagServer}
                disabled={ragLoading}
                className="rag-start-btn"
              >
                {ragLoading ? '⏳ Starting...' : '🚀 Start RAG Server'}
              </button>
            )}
          </div>
        </div>
        
        <div className="agent-sub-tabs">
          <button
            onClick={() => setSubTab("run")}
            className={`sub-tab ${subTab === "run" ? "active" : ""}`}
          >
            ▶️ Run Agents
          </button>
          <button
            onClick={() => setSubTab("build")}
            className={`sub-tab ${subTab === "build" ? "active" : ""}`}
          >
            🔧 Build Agent
          </button>
        </div>
        {subTab === "run" && (
          <button onClick={loadAgents} className="refresh-btn">
            🔄 Refresh
          </button>
        )}
      </div>

      {/* Content based on active sub-tab */}
      {subTab === "run" && (
        <>
          {/* Compact Input Section */}
          <div className="run-agent-compact">
            <div className="run-controls">
              <input
                className="agent-input-compact"
                placeholder="Enter query, command, or parameters..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <select 
                className="agent-selector"
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
              >
                <option value="">Select Agent</option>
                {agents.map((agent) => (
                  <option key={agent} value={agent}>
                    {agent}
                  </option>
                ))}
              </select>
              <button 
                onClick={() => runAgent(selectedAgent)}
                disabled={loading || !selectedAgent}
                className="run-button"
              >
                {loading ? "⏳" : "▶️"} Run
              </button>
            </div>
            
            {loading && (
              <div className="loading-compact">
                <div className="loading-spinner-small"></div>
                <span>Running {selectedAgent}...</span>
              </div>
            )}
          </div>

          {/* Output Section - Takes full space */}
          {output && (
            <div className="output-section-compact">
              <div className="output-header">
                <h3>🎯 Output:</h3>
                <button 
                  onClick={() => setOutput("")}
                  className="clear-output-btn"
                >
                  🗑️ Clear
                </button>
              </div>
              <pre className="output-content-expanded">{output}</pre>
            </div>
          )}
        </>
      )}

      {subTab === "build" && <AgentBuilder />}
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
        text: `❌ RAG Server Error: ${err instanceof Error ? err.message : 'Unknown error'}. 

📋 **To use RAG Chat:**
1. Go to **Agents** tab
2. Click **🚀 Start RAG Server** 
3. Wait for server to be ready
4. Return to RAG Chat

**Note:** RAG requires Python dependencies (FastAPI, LangChain). If the server fails to start, you can still use the **💬 AI Chatbot** which works perfectly!`,
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