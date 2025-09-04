// ui/src/pages/tools/Playground.tsx
// Tools Playground UI
// v20250828-1650

import { useEffect, useState } from "react";

interface ToolConfigField {
  type: "string" | "number" | "boolean" | "select";
  label: string;
  description?: string;
  required?: boolean;
  defaultValue?: any;
  options?: string[];
  placeholder?: string;
}

interface ToolDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  configSchema: Record<string, ToolConfigField>;
}

export default function ToolsPlayground() {
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [selectedTool, setSelectedTool] = useState<ToolDefinition | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"test" | "create" | "edit">("test");
  const [newTool, setNewTool] = useState({
    id: "",
    name: "",
    description: "",
    icon: "🔧",
    category: "custom",
    code: `// Tool implementation
export const MyTool: ToolDefinition = {
  id: "my-tool",
  name: "My Tool",
  description: "Description of what this tool does",
  params: [
    { name: "input", type: "string", required: true, description: "Input parameter" }
  ],

  async call({ input }) {
    // Your tool logic here
    return { result: \`Processed: \${input}\` };
  }
};`
  });
  const [createStatus, setCreateStatus] = useState<{type: string, message: string} | null>(null);
  const [editingTool, setEditingTool] = useState<any>(null);

  // Fetch available tools
  useEffect(() => {
    fetch("http://localhost:3001/api/tools")
      .then((res) => res.json())
      .then((data) => {
        // Handle new API format - tools are returned as object with indices
        const toolsArray = Array.isArray(data) ? data : Object.values(data).filter(tool => tool && typeof tool === 'object');
        setTools(toolsArray);
      })
      .catch((err) => console.error("Failed to load tools:", err));
  }, []);

  // Reset form when switching tool
  useEffect(() => {
    if (selectedTool) {
      const defaults: Record<string, any> = {};
      for (const [key, field] of Object.entries(selectedTool.configSchema)) {
        defaults[key] = field.defaultValue ?? "";
      }
      setFormValues(defaults);
    }
  }, [selectedTool]);

  const handleChange = (key: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const runTool = async () => {
    if (!selectedTool) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        `http://localhost:3001/api/tools/run/${selectedTool.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formValues),
        }
      );

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Tool run failed:", err);
      setResult({ error: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const createTool = async () => {
    if (!newTool.id || !newTool.name || !newTool.code) {
      setCreateStatus({ type: 'error', message: 'Please fill in all required fields' });
      return;
    }

    setLoading(true);
    setCreateStatus(null);

    try {
      const response = await fetch('http://localhost:3001/api/tools/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTool)
      });

      const data = await response.json();

      if (response.ok) {
        setCreateStatus({ type: 'success', message: `✅ Tool "${newTool.name}" created successfully!` });
        // Refresh tools list
        const toolsRes = await fetch("http://localhost:3001/api/tools");
        const toolsData = await toolsRes.json();
        const toolsArray = Array.isArray(toolsData) ? toolsData : Object.values(toolsData).filter(tool => tool && typeof tool === 'object');
        setTools(toolsArray);
        // Reset form
        setNewTool({
          id: "",
          name: "",
          description: "",
          icon: "🔧",
          category: "custom",
          code: newTool.code // Keep template code
        });
      } else {
        setCreateStatus({ type: 'error', message: `❌ Failed to create tool: ${data.error || 'Unknown error'}` });
      }
    } catch (error: any) {
      setCreateStatus({ type: 'error', message: `❌ Error: ${error.message}` });
    } finally {
      setLoading(false);
      setTimeout(() => setCreateStatus(null), 5000);
    }
  };

  const loadToolForEditing = async (toolId: string) => {
    setLoading(true);
    setCreateStatus(null); // Clear any previous error messages
    try {
      const response = await fetch(`http://localhost:3001/api/tools/load/${toolId}`);
      const data = await response.json();

      if (response.ok) {
        setEditingTool(data);
        setMode("edit");
      } else {
        setCreateStatus({ type: 'error', message: `❌ Failed to load tool: ${data.error}` });
      }
    } catch (error: any) {
      setCreateStatus({ type: 'error', message: `❌ Error loading tool: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const updateTool = async () => {
    if (!editingTool?.sourceCode) {
      setCreateStatus({ type: 'error', message: 'No tool code to update' });
      return;
    }

    setLoading(true);
    setCreateStatus(null);

    try {
      const response = await fetch(`http://localhost:3001/api/tools/update/${editingTool.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingTool.name,
          description: editingTool.description,
          icon: editingTool.icon,
          category: editingTool.category,
          code: editingTool.sourceCode
        })
      });

      const data = await response.json();

      if (response.ok) {
        setCreateStatus({ type: 'success', message: `✅ Tool "${editingTool.name}" updated successfully!` });
        // Refresh tools list
        const toolsRes = await fetch("http://localhost:3001/api/tools");
        const toolsData = await toolsRes.json();
        const toolsArray = Array.isArray(toolsData) ? toolsData : Object.values(toolsData).filter(tool => tool && typeof tool === 'object');
        setTools(toolsArray);
      } else {
        setCreateStatus({ type: 'error', message: `❌ Failed to update tool: ${data.error || 'Unknown error'}` });
      }
    } catch (error: any) {
      setCreateStatus({ type: 'error', message: `❌ Error: ${error.message}` });
    } finally {
      setLoading(false);
      setTimeout(() => setCreateStatus(null), 5000);
    }
  };

  const saveAsNewTool = async () => {
    // Auto-suggest ID and name based on current tool
    const suggestedId = editingTool.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Collapse multiple hyphens
      .replace(/^-|-$/g, '') + '-v2'; // Add version suffix
    
    const suggestedName = `${editingTool.name} (Copy)`;
    
    const newId = prompt(
      `Enter ID for new tool (cloned from ${editingTool.id}):\n\n` +
      `Suggested: ${suggestedId}\n\n` +
      `Format: lowercase letters, numbers, and hyphens only\n` +
      `Examples: my-tool-v2, data-processor-enhanced, yahoo-finance-custom`
    );
    
    if (!newId) return;

    if (!/^[a-z0-9-]+$/.test(newId)) {
      setCreateStatus({ type: 'error', message: 'Tool ID must contain only lowercase letters, numbers, and hyphens' });
      return;
    }

    const newName = prompt(
      `Enter name for new tool:\n\n` +
      `Suggested: ${suggestedName}\n\n` +
      `This will appear in the dropdown to distinguish from the original.`
    ) || suggestedName;

    setLoading(true);
    setCreateStatus(null);

    try {
      const response = await fetch('http://localhost:3001/api/tools/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newId,
          name: newName,
          description: editingTool.description,
          icon: editingTool.icon,
          category: editingTool.category,
          code: editingTool.sourceCode.replace(
            new RegExp(`id: "${editingTool.id}"`, 'g'),
            `id: "${newId}"`
          ).replace(
            new RegExp(`name: "${editingTool.name}"`, 'g'),
            `name: "${newName}"`
          ),
          baseToolId: editingTool.id
        })
      });

      const data = await response.json();

      if (response.ok) {
        setCreateStatus({ type: 'success', message: `✅ Tool "${newName}" cloned as "${newId}"!` });
        // Refresh tools list
        const toolsRes = await fetch("http://localhost:3001/api/tools");
        const toolsData = await toolsRes.json();
        const toolsArray = Array.isArray(toolsData) ? toolsData : Object.values(toolsData).filter(tool => tool && typeof tool === 'object');
        setTools(toolsArray);
      } else {
        setCreateStatus({ type: 'error', message: `❌ Failed to clone tool: ${data.error || 'Unknown error'}` });
      }
    } catch (error: any) {
      setCreateStatus({ type: 'error', message: `❌ Error: ${error.message}` });
    } finally {
      setLoading(false);
      setTimeout(() => setCreateStatus(null), 5000);
    }
  };

  const deleteTool = async () => {
    if (!editingTool) return;
    
    if (!confirm(`Are you sure you want to delete "${editingTool.name}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setCreateStatus(null);

    try {
      const response = await fetch(`http://localhost:3001/api/tools/delete/${editingTool.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        setCreateStatus({ type: 'success', message: `✅ Tool "${editingTool.name}" deleted successfully!` });
        // Refresh tools list and reset edit state
        const toolsRes = await fetch("http://localhost:3001/api/tools/list");
        const toolsData = await toolsRes.json();
        setTools(toolsData);
        setEditingTool(null);
        setMode("test");
      } else {
        setCreateStatus({ type: 'error', message: `❌ Failed to delete tool: ${data.error || 'Unknown error'}` });
      }
    } catch (error: any) {
      setCreateStatus({ type: 'error', message: `❌ Error: ${error.message}` });
    } finally {
      setLoading(false);
      setTimeout(() => setCreateStatus(null), 5000);
    }
  };

  return (
    <div className="tools-playground">
      <div className="tools-header">
        <h1 className="tools-title">🛠 Tools Playground</h1>
        <p className="tools-subtitle">Test existing tools or create new ones</p>
        
        {/* Mode Switcher */}
        <div className="mode-switcher">
          <button
            onClick={() => {
              setMode("test");
              setCreateStatus(null);
            }}
            className={`mode-btn ${mode === "test" ? "active" : ""}`}
          >
            🧪 Test Tools
          </button>
          <button
            onClick={() => {
              setMode("create");
              setCreateStatus(null);
            }}
            className={`mode-btn ${mode === "create" ? "active" : ""}`}
          >
            ⚡ Create Tool
          </button>
          <button
            onClick={() => {
              setMode("edit");
              setCreateStatus(null);
              setEditingTool(null);
            }}
            className={`mode-btn ${mode === "edit" ? "active" : ""}`}
          >
            ✏️ Edit Tool
          </button>
        </div>
      </div>

      {mode === "test" && (
        <>
          {/* Tool Selector */}
          <div className="tool-selector-section">
        <label className="form-label">Select Tool</label>
        <select
          className="tool-select"
          onChange={(e) => {
            const tool = tools.find((t) => t.id === e.target.value) || null;
            setSelectedTool(tool);
          }}
          defaultValue=""
        >
          <option value="" disabled>
            -- choose a tool --
          </option>
          {tools.map((tool) => (
            <option key={tool.id} value={tool.id}>
              {tool.icon} {tool.name} ({tool.id})
            </option>
          ))}
        </select>
      </div>

      {/* Config Form */}
      {selectedTool && (
        <div className="tool-config-section">
          <div className="tool-header">
            <h2 className="tool-name">
              {selectedTool.icon} {selectedTool.name}
            </h2>
            <p className="tool-description">{selectedTool.description}</p>
          </div>

          <div className="tool-form">
            {Object.entries(selectedTool.configSchema).map(([key, field]) => (
              <div key={key} className="form-field">
                <label className="form-label">
                  {field.label}
                  {field.required && <span className="required">*</span>}
                </label>
                {field.type === "string" && (
                  <input
                    type="text"
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                    className="form-input"
                    value={formValues[key] || ""}
                    onChange={(e) => handleChange(key, e.target.value)}
                  />
                )}
                {field.type === "number" && (
                  <input
                    type="number"
                    className="form-input"
                    value={formValues[key] || ""}
                    onChange={(e) => handleChange(key, Number(e.target.value))}
                  />
                )}
                {field.type === "boolean" && (
                  <div className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      id={key}
                      checked={formValues[key] || false}
                      onChange={(e) => handleChange(key, e.target.checked)}
                    />
                    <label htmlFor={key} className="checkbox-label">Enable</label>
                  </div>
                )}
                {field.type === "select" && (
                  <select
                    className="form-input"
                    value={formValues[key] || ""}
                    onChange={(e) => handleChange(key, e.target.value)}
                  >
                    <option value="">Select option</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}
                {field.description && (
                  <p className="field-description">{field.description}</p>
                )}
              </div>
            ))}

            <button
              onClick={runTool}
              disabled={loading}
              className="run-tool-btn"
            >
              {loading ? "⏳ Running..." : "🚀 Run Tool"}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="results-section">
          <h2 className="results-title">📊 Results</h2>
          <div className="results-container">
            <pre className="results-output">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}
        </>
      )}

      {mode === "create" && (
        <div className="tool-creation-section">
          <div className="tool-form">
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Tool ID <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="my-awesome-tool"
                  className="form-input"
                  value={newTool.id}
                  onChange={(e) => setNewTool(prev => ({ ...prev, id: e.target.value }))}
                />
                <p className="field-description">
                  Format: lowercase letters, numbers, and hyphens only (e.g., data-processor, ai-analyzer)
                </p>
              </div>
              <div className="form-field">
                <label className="form-label">Name <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="My Awesome Tool"
                  className="form-input"
                  value={newTool.name}
                  onChange={(e) => setNewTool(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Icon</label>
                <input
                  type="text"
                  placeholder="🚀"
                  className="form-input"
                  value={newTool.icon}
                  onChange={(e) => setNewTool(prev => ({ ...prev, icon: e.target.value }))}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={newTool.category}
                  onChange={(e) => setNewTool(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="custom">Custom</option>
                  <option value="api">API Integration</option>
                  <option value="ai">AI Model</option>
                  <option value="data">Data Processing</option>
                  <option value="web">Web Tool</option>
                  <option value="system">System Tool</option>
                </select>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Description</label>
              <textarea
                placeholder="Describe what this tool does..."
                className="form-textarea"
                rows={3}
                value={newTool.description}
                onChange={(e) => setNewTool(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="form-field">
              <label className="form-label">Implementation Code <span className="required">*</span></label>
              <textarea
                className="code-textarea"
                rows={20}
                value={newTool.code}
                onChange={(e) => setNewTool(prev => ({ ...prev, code: e.target.value }))}
              />
              <p className="field-description">
                Follow the ToolDefinition interface. Include id, name, description, params array, and async call function.
              </p>
            </div>

            {createStatus && (
              <div className={`create-status ${createStatus.type}`}>
                {createStatus.message}
              </div>
            )}

            <button
              onClick={createTool}
              disabled={loading}
              className="create-tool-btn"
            >
              {loading ? "⏳ Creating..." : "✨ Create Tool"}
            </button>
          </div>
        </div>
      )}

      {mode === "edit" && (
        <div className="tool-editing-section">
          {!editingTool ? (
            <div className="tool-selector-section">
              <label className="form-label">Select Tool to Edit</label>
              <select
                className="tool-select"
                onChange={(e) => {
                  if (e.target.value) {
                    loadToolForEditing(e.target.value);
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>
                  -- choose a tool to edit --
                </option>
                {tools.map((tool) => (
                  <option key={tool.id} value={tool.id}>
                    {tool.icon} {tool.name} ({tool.id})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="tool-form">
              <div className="edit-header">
                <h2 className="tool-name">
                  ✏️ Editing: {editingTool.icon} {editingTool.name}
                </h2>
                <button
                  onClick={() => {
                    setEditingTool(null);
                    setCreateStatus(null);
                  }}
                  className="back-btn"
                >
                  ← Back to Tool Selection
                </button>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingTool.name}
                    onChange={(e) => setEditingTool(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Icon</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingTool.icon}
                    onChange={(e) => setEditingTool(prev => ({ ...prev, icon: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={editingTool.description}
                  onChange={(e) => setEditingTool(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="form-field">
                <label className="form-label">Source Code</label>
                <textarea
                  className="code-textarea"
                  rows={25}
                  value={editingTool.sourceCode}
                  onChange={(e) => setEditingTool(prev => ({ ...prev, sourceCode: e.target.value }))}
                />
                <p className="field-description">
                  Edit the tool implementation. Changes will be saved to {editingTool.fileName}.
                </p>
              </div>

              {createStatus && (
                <div className={`create-status ${createStatus.type}`}>
                  {createStatus.message}
                </div>
              )}

              <div className="edit-actions">
                <button
                  onClick={updateTool}
                  disabled={loading}
                  className="update-tool-btn"
                >
                  {loading ? "⏳ Updating..." : "💾 Update Tool"}
                </button>
                <button
                  onClick={saveAsNewTool}
                  disabled={loading}
                  className="save-as-btn"
                >
                  {loading ? "⏳ Cloning..." : "📋 Save As New Tool"}
                </button>
                <button
                  onClick={deleteTool}
                  disabled={loading}
                  className="delete-tool-btn"
                >
                  {loading ? "⏳ Deleting..." : "🗑️ Delete Tool"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
