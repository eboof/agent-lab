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

  // Fetch available tools
  useEffect(() => {
    fetch("http://localhost:3001/api/tools/list")
      .then((res) => res.json())
      .then((data) => setTools(data))
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

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">🛠 Tools Playground</h1>

      {/* Tool Selector */}
      <div>
        <label className="block text-sm font-medium">Select Tool</label>
        <select
          className="border p-2 rounded w-full"
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
              {tool.icon} {tool.name}
            </option>
          ))}
        </select>
      </div>

      {/* Config Form */}
      {selectedTool && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            {selectedTool.icon} {selectedTool.name}
          </h2>
          <p className="text-sm text-gray-600">{selectedTool.description}</p>

          {Object.entries(selectedTool.configSchema).map(([key, field]) => (
            <div key={key}>
              <label className="block text-sm font-medium">{field.label}</label>
              {field.type === "string" && (
                <input
                  type="text"
                  placeholder={field.placeholder}
                  className="border p-2 rounded w-full"
                  value={formValues[key] || ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                />
              )}
              {field.type === "number" && (
                <input
                  type="number"
                  className="border p-2 rounded w-full"
                  value={formValues[key] || ""}
                  onChange={(e) => handleChange(key, Number(e.target.value))}
                />
              )}
              {field.type === "boolean" && (
                <input
                  type="checkbox"
                  checked={formValues[key] || false}
                  onChange={(e) => handleChange(key, e.target.checked)}
                />
              )}
              {field.type === "select" && (
                <select
                  className="border p-2 rounded w-full"
                  value={formValues[key] || ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                >
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}
              {field.description && (
                <p className="text-xs text-gray-500">{field.description}</p>
              )}
            </div>
          ))}

          <button
            onClick={runTool}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow"
          >
            {loading ? "Running..." : "Run Tool"}
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div>
          <h2 className="text-lg font-semibold mt-6">Results</h2>
          <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
