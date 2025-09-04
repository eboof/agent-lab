// ui/src/pages/agents/BuildAgent.tsx
// Visual agent builder with form validation and tool selection

import React, { useState, useEffect } from 'react';

interface Tool {
  id: string;
  name: string;
  description: string;
  configSchema?: Record<string, any>;
}

interface AgentConfig {
  id: string;
  name: string;
  role: string;
  model: string;
  tools: string[];
  systemPrompt: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  metadata?: {
    version: string;
    author: string;
    created: string;
    description: string;
    tags: string[];
    category: string;
  };
}

const BuildAgent: React.FC = () => {
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    id: "",
    name: "",
    role: "",
    model: "claude-3-5-sonnet-20241022",
    tools: [],
    systemPrompt: "",
    inputSchema: {},
    outputSchema: {}
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchTools();
    
    // Check if we're editing an existing agent
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const editAgentId = urlParams.get('edit');
    if (editAgentId) {
      loadAgentForEditing(editAgentId);
    }
  }, []);

  const fetchTools = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/tools');
      const data = await response.json();
      // Handle new API format - tools are returned as object with indices
      const toolsArray = Array.isArray(data) ? data : Object.values(data).filter(tool => tool && typeof tool === 'object');
      setAvailableTools(toolsArray);
    } catch (err) {
      console.error('Failed to load tools:', err);
    }
  };

  const loadAgentForEditing = async (agentId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/agents/load/${agentId}`);
      if (!response.ok) {
        throw new Error(`Failed to load agent: ${response.statusText}`);
      }
      
      const data = await response.json();
      const yaml = await import('js-yaml');
      const config = yaml.load(data.content) as AgentConfig;
      
      setAgentConfig(config);
    } catch (err: any) {
      console.error('Failed to load agent for editing:', err);
      // Could show an error message to user
    }
  };

  const validateConfig = (): boolean => {
    const errors: string[] = [];
    
    if (!agentConfig.id) errors.push("Agent ID is required");
    if (!agentConfig.name) errors.push("Agent name is required");
    if (!agentConfig.role || agentConfig.role.length < 10) {
      errors.push("Role must be at least 10 characters");
    }
    if (!agentConfig.systemPrompt || agentConfig.systemPrompt.length < 50) {
      errors.push("System prompt must be at least 50 characters");
    }
    if (agentConfig.tools.length === 0) {
      errors.push("At least one tool must be selected");
    }
    
    // ID validation (kebab-case)
    if (agentConfig.id && !/^[a-z0-9-]+$/.test(agentConfig.id)) {
      errors.push("Agent ID must be kebab-case (lowercase letters, numbers, hyphens only)");
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSave = async () => {
    if (!validateConfig()) return;
    
    setSaving(true);
    setSuccess(false);
    
    try {
      // Add metadata
      const configWithMetadata = {
        ...agentConfig,
        metadata: {
          version: "1.0.0",
          author: "User",
          created: new Date().toISOString(),
          description: agentConfig.role,
          tags: [],
          category: "custom",
          ...agentConfig.metadata
        }
      };
      
      const response = await fetch('http://localhost:3001/api/agents/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: agentConfig.id,
          content: configWithMetadata
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save agent');
      }
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err: any) {
      setValidationErrors([err.message]);
    } finally {
      setSaving(false);
    }
  };

  const handleToolToggle = (toolId: string) => {
    setAgentConfig(prev => ({
      ...prev,
      tools: prev.tools.includes(toolId)
        ? prev.tools.filter(t => t !== toolId)
        : [...prev.tools, toolId]
    }));
  };

  const addInputField = () => {
    const fieldName = prompt("Enter field name:");
    if (fieldName && !agentConfig.inputSchema[fieldName]) {
      setAgentConfig(prev => ({
        ...prev,
        inputSchema: {
          ...prev.inputSchema,
          [fieldName]: {
            type: "string",
            required: false,
            description: ""
          }
        }
      }));
    }
  };

  const removeInputField = (fieldName: string) => {
    setAgentConfig(prev => {
      const newSchema = { ...prev.inputSchema };
      delete newSchema[fieldName];
      return { ...prev, inputSchema: newSchema };
    });
  };

  const updateInputField = (fieldName: string, property: string, value: any) => {
    setAgentConfig(prev => ({
      ...prev,
      inputSchema: {
        ...prev.inputSchema,
        [fieldName]: {
          ...prev.inputSchema[fieldName],
          [property]: value
        }
      }
    }));
  };

  return (
    <div className="build-agent-page">
      <div className="page-header">
        <h1>🔧 Build Agent</h1>
        <p>Create and configure new agents</p>
      </div>

      {validationErrors.length > 0 && (
        <div className="error-banner">
          <h3>❌ Validation Errors:</h3>
          <ul>
            {validationErrors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {success && (
        <div className="success-banner">
          ✅ Agent saved successfully!
        </div>
      )}

      <div className="config-form">
        <div className="form-section">
          <h2>Basic Configuration</h2>
          
          <div className="form-field">
            <label>Agent ID *</label>
            <input
              type="text"
              value={agentConfig.id}
              onChange={(e) => setAgentConfig(prev => ({ ...prev, id: e.target.value }))}
              placeholder="my-agent (kebab-case)"
            />
          </div>

          <div className="form-field">
            <label>Name *</label>
            <input
              type="text"
              value={agentConfig.name}
              onChange={(e) => setAgentConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder="My Custom Agent"
            />
          </div>

          <div className="form-field">
            <label>Role *</label>
            <textarea
              value={agentConfig.role}
              onChange={(e) => setAgentConfig(prev => ({ ...prev, role: e.target.value }))}
              placeholder="Describe what this agent does (minimum 10 characters)"
              rows={3}
            />
          </div>

          <div className="form-field">
            <label>Model *</label>
            <select
              value={agentConfig.model}
              onChange={(e) => setAgentConfig(prev => ({ ...prev, model: e.target.value }))}
            >
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-4o">GPT-4o</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h2>🛠️ Tools ({agentConfig.tools.length} selected)</h2>
          <div className="tools-grid">
            {availableTools.map(tool => (
              <div 
                key={tool.id} 
                className={`tool-card ${agentConfig.tools.includes(tool.id) ? 'selected' : ''}`}
                onClick={() => handleToolToggle(tool.id)}
              >
                <div className="tool-header">
                  <input
                    type="checkbox"
                    checked={agentConfig.tools.includes(tool.id)}
                    onChange={() => handleToolToggle(tool.id)}
                  />
                  <h3>{tool.name}</h3>
                </div>
                <p>{tool.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h2>📝 System Prompt *</h2>
          <textarea
            value={agentConfig.systemPrompt}
            onChange={(e) => setAgentConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
            placeholder="You are a helpful agent that..."
            rows={6}
            className="system-prompt"
          />
          <p className="field-help">
            Define how the agent should behave and use its tools (minimum 50 characters)
          </p>
        </div>

        <div className="form-section">
          <h2>📋 Input Schema</h2>
          <p>Define what inputs this agent expects</p>
          
          {Object.entries(agentConfig.inputSchema).map(([fieldName, field]) => (
            <div key={fieldName} className="schema-field">
              <div className="field-header">
                <h4>{fieldName}</h4>
                <button 
                  type="button" 
                  onClick={() => removeInputField(fieldName)}
                  className="remove-field"
                >
                  ❌
                </button>
              </div>
              
              <div className="field-config">
                <select
                  value={(field as any).type}
                  onChange={(e) => updateInputField(fieldName, 'type', e.target.value)}
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="array">Array</option>
                </select>
                
                <label>
                  <input
                    type="checkbox"
                    checked={(field as any).required || false}
                    onChange={(e) => updateInputField(fieldName, 'required', e.target.checked)}
                  />
                  Required
                </label>
                
                <input
                  type="text"
                  value={(field as any).description || ""}
                  onChange={(e) => updateInputField(fieldName, 'description', e.target.value)}
                  placeholder="Field description"
                />
              </div>
            </div>
          ))}
          
          <button type="button" onClick={addInputField} className="add-field">
            ➕ Add Input Field
          </button>
        </div>

        <div className="save-section">
          <button
            onClick={handleSave}
            disabled={saving || validationErrors.length > 0}
            className="save-button"
          >
            {saving ? "💾 Saving..." : "💾 Save Agent"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .build-agent-page {
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
          padding: 16px;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .success-banner {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
          padding: 16px;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .config-form {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .form-section {
          padding: 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .form-section:last-child {
          border-bottom: none;
        }

        .form-section h2 {
          margin: 0 0 16px 0;
          color: #374151;
        }

        .form-field {
          margin-bottom: 16px;
        }

        .form-field label {
          display: block;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .form-field input, .form-field select, .form-field textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
        }

        .system-prompt {
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 14px;
        }

        .field-help {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }

        .tools-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .tool-card {
          border: 2px solid #e5e7eb;
          border-radius: 6px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tool-card:hover {
          border-color: #3b82f6;
        }

        .tool-card.selected {
          border-color: #2563eb;
          background: #eff6ff;
        }

        .tool-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .tool-header h3 {
          margin: 0;
          font-size: 16px;
        }

        .schema-field {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .field-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .field-header h4 {
          margin: 0;
          color: #374151;
        }

        .remove-field {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
        }

        .field-config {
          display: grid;
          grid-template-columns: 120px 100px 1fr;
          gap: 12px;
          align-items: center;
        }

        .field-config label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
        }

        .add-field {
          background: #f3f4f6;
          border: 1px dashed #9ca3af;
          color: #374151;
          padding: 12px;
          border-radius: 6px;
          cursor: pointer;
          width: 100%;
        }

        .add-field:hover {
          background: #e5e7eb;
        }

        .save-section {
          padding: 24px;
          background: #f9fafb;
          text-align: center;
        }

        .save-button {
          background: #2563eb;
          color: white;
          padding: 16px 32px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
        }

        .save-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default BuildAgent;