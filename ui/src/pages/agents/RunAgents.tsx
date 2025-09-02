// ui/src/pages/agents/RunAgents.tsx
// UI for running existing agents with dynamic input forms

import React, { useState, useEffect } from 'react';

interface Agent {
  id: string;
  file: string;
}

interface AgentConfig {
  id: string;
  name: string;
  role: string;
  model: string;
  tools: string[];
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
}

interface ExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  metadata?: {
    agentId: string;
    executionTime: number;
    toolCalls: number;
    model: string;
    timestamp: string;
  };
}

const RunAgents: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
  const [input, setInput] = useState<Record<string, any>>({});
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Load available agents
  useEffect(() => {
    fetchAgents();
  }, []);

  // Load agent config when selection changes
  useEffect(() => {
    if (selectedAgent) {
      loadAgentConfig(selectedAgent);
    } else {
      setAgentConfig(null);
      setInput({});
    }
  }, [selectedAgent]);

  const fetchAgents = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/agents/list');
      const data = await response.json();
      setAgents(data);
    } catch (err: any) {
      setError(`Failed to load agents: ${err.message}`);
    }
  };

  const loadAgentConfig = async (agentId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/agents/load/${agentId}`);
      if (!response.ok) {
        throw new Error(`Failed to load agent: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Parse YAML content
      const yaml = await import('js-yaml');
      const config = yaml.load(data.content) as any;
      setAgentConfig(config);
      
      // Initialize input with defaults
      const initialInput: Record<string, any> = {};
      if (config.inputSchema) {
        for (const [key, field] of Object.entries(config.inputSchema)) {
          const fieldSchema = field as any;
          if (fieldSchema.default !== undefined) {
            initialInput[key] = fieldSchema.default;
          }
        }
      }
      setInput(initialInput);
      
    } catch (err: any) {
      setError(`Failed to load agent config: ${err.message}`);
    }
  };

  const runAgent = async () => {
    if (!selectedAgent || !agentConfig) return;
    
    setLoading(true);
    setResult(null);
    setError("");
    
    try {
      const response = await fetch(`http://localhost:3001/api/agents/run/${selectedAgent}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input })
      });
      
      const data = await response.json();
      setResult(data);
      
    } catch (err: any) {
      setError(`Execution failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setInput(prev => ({ ...prev, [key]: value }));
  };

  const renderInputForm = () => {
    if (!agentConfig?.inputSchema) {
      return (
        <div className="input-form">
          <p>No input schema defined for this agent.</p>
        </div>
      );
    }

    return (
      <div className="input-form">
        <h3>Input Parameters</h3>
        {Object.entries(agentConfig.inputSchema).map(([key, field]) => {
          const fieldSchema = field as any;
          return (
            <div key={key} className="form-field">
              <label>
                {key} {fieldSchema.required && <span className="required">*</span>}
              </label>
              <p className="field-description">{fieldSchema.description}</p>
              
              {fieldSchema.options ? (
                <select
                  value={input[key] || fieldSchema.default || ""}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                >
                  <option value="">Select {key}</option>
                  {fieldSchema.options.map((option: string) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : fieldSchema.type === "boolean" ? (
                <input
                  type="checkbox"
                  checked={input[key] || false}
                  onChange={(e) => handleInputChange(key, e.target.checked)}
                />
              ) : fieldSchema.type === "number" ? (
                <input
                  type="number"
                  value={input[key] || fieldSchema.default || ""}
                  min={fieldSchema.minimum}
                  max={fieldSchema.maximum}
                  onChange={(e) => handleInputChange(key, parseFloat(e.target.value))}
                />
              ) : (
                <input
                  type="text"
                  value={input[key] || fieldSchema.default || ""}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  placeholder={fieldSchema.description}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderResult = () => {
    if (!result) return null;

    return (
      <div className={`result ${result.success ? 'success' : 'error'}`}>
        <h3>{result.success ? '✅ Execution Success' : '❌ Execution Failed'}</h3>
        
        {result.success && result.output && (
          <div className="output">
            <h4>Output:</h4>
            <pre>{JSON.stringify(result.output, null, 2)}</pre>
          </div>
        )}
        
        {!result.success && result.error && (
          <div className="error-detail">
            <h4>Error:</h4>
            <p>{result.error}</p>
          </div>
        )}
        
        {result.metadata && (
          <div className="metadata">
            <h4>Execution Metadata:</h4>
            <ul>
              <li>Agent: {result.metadata.agentId}</li>
              <li>Model: {result.metadata.model}</li>
              <li>Execution Time: {result.metadata.executionTime}ms</li>
              <li>Tool Calls: {result.metadata.toolCalls}</li>
              <li>Timestamp: {result.metadata.timestamp}</li>
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="run-agents-page">
      <div className="page-header">
        <h1>▶️ Run Agents</h1>
        <p>Execute existing agents with custom inputs</p>
      </div>

      {error && (
        <div className="error-banner">
          ❌ {error}
        </div>
      )}

      <div className="agent-selection">
        <h2>Select Agent</h2>
        <select
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          disabled={loading}
        >
          <option value="">Choose an agent...</option>
          {agents.map(agent => (
            <option key={agent.id} value={agent.id}>
              {agent.id}
            </option>
          ))}
        </select>
        
        {agentConfig && (
          <div className="agent-info">
            <h3>{agentConfig.name}</h3>
            <p><strong>Role:</strong> {agentConfig.role}</p>
            <p><strong>Model:</strong> {agentConfig.model}</p>
            <p><strong>Tools:</strong> {agentConfig.tools.join(", ")}</p>
          </div>
        )}
      </div>

      {agentConfig && (
        <div className="execution-section">
          {renderInputForm()}
          
          <div className="run-controls">
            <button
              onClick={runAgent}
              disabled={loading || !selectedAgent}
              className="run-button"
            >
              {loading ? "🔄 Running..." : "▶️ Run Agent"}
            </button>
          </div>
          
          {renderResult()}
        </div>
      )}

      <style jsx>{`
        .run-agents-page {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header h1 {
          color: #2563eb;
          margin-bottom: 8px;
        }

        .error-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .agent-selection select {
          width: 100%;
          padding: 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          margin-bottom: 16px;
        }

        .agent-info {
          background: #f9fafb;
          padding: 16px;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .input-form {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .form-field {
          margin-bottom: 16px;
        }

        .form-field label {
          display: block;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .required {
          color: #dc2626;
        }

        .field-description {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .form-field input, .form-field select {
          width: 100%;
          padding: 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
        }

        .run-button {
          background: #2563eb;
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 20px;
        }

        .run-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .result {
          border-radius: 6px;
          padding: 20px;
          margin-top: 20px;
        }

        .result.success {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
        }

        .result.error {
          background: #fef2f2;
          border: 1px solid #fecaca;
        }

        .output pre, .error-detail {
          background: #f3f4f6;
          padding: 12px;
          border-radius: 4px;
          overflow-x: auto;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 14px;
        }

        .metadata ul {
          list-style: none;
          padding: 0;
        }

        .metadata li {
          padding: 4px 0;
          border-bottom: 1px solid #e5e7eb;
        }
      `}</style>
    </div>
  );
};

export default RunAgents;