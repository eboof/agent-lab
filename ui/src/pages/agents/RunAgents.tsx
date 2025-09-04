// ui/src/pages/agents/RunAgents.tsx
// UI for running existing agents with dynamic input forms

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import * as yaml from 'js-yaml';

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

  const runAgent = async (customInput?: Record<string, any>) => {
    if (!selectedAgent || !agentConfig) return;
    
    setLoading(true);
    setResult(null);
    setError("");
    
    try {
      const response = await fetch(`http://localhost:3001/api/agents/run/${selectedAgent}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: customInput || input })
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

  // Parse emails from Smart Inbox agent response  
  const parseEmailsFromResponse = (rawResponse: string) => {
    const emails: Array<{
      id: string;
      subject: string;
      from: string;
      snippet: string;
      classification: string;
    }> = [];

    try {
      
      // Look for new INTERACTIVE_EMAILS format first
      const interactiveMatch = rawResponse.match(/---INTERACTIVE_EMAILS---\s*([\s\S]*?)\s*---END_INTERACTIVE_EMAILS---/);
      console.log('🔍 INTERACTIVE_EMAILS match found:', !!interactiveMatch);
      if (interactiveMatch) {
        let rawJson = interactiveMatch[1].trim();
        console.log('🔍 Raw INTERACTIVE_EMAILS content:', rawJson);
        
        // Fix common formatting issues with the JSON
        // Remove line breaks within the JSON structure
        rawJson = rawJson.replace(/\[\s+\{/g, '[{');
        rawJson = rawJson.replace(/\}\s+\]/g, '}]');
        rawJson = rawJson.replace(/\},\s+\{/g, '},{');
        
        try {
          const structuredEmails = JSON.parse(rawJson);
          console.log('🔍 Parsed INTERACTIVE emails:', structuredEmails);
          if (Array.isArray(structuredEmails)) {
            return structuredEmails;
          }
        } catch (jsonError) {
          console.warn("Failed to parse INTERACTIVE_EMAILS:", jsonError);
          console.log("Raw content that failed:", rawJson);
        }
      }

      // Look for YAML in markdown code blocks (Smart Inbox v2 format)
      const yamlBlockMatch = rawResponse.match(/```yaml\s*([\s\S]*?)\s*```/);
      console.log('🔍 YAML code block match found:', !!yamlBlockMatch);
      if (yamlBlockMatch) {
        try {
          const yamlContent = yamlBlockMatch[1].trim();
          const parsedYaml = yaml.load(yamlContent) as any;
          console.log('🔍 Parsed YAML content:', parsedYaml);
          
          if (parsedYaml && parsedYaml.emails && Array.isArray(parsedYaml.emails)) {
            return parsedYaml.emails;
          }
        } catch (yamlError) {
          console.warn("Failed to parse YAML code block:", yamlError);
          console.log("Raw YAML content:", yamlBlockMatch[1]);
        }
      }

      // Look for JSON in markdown code blocks (fallback)
      const codeBlockMatch = rawResponse.match(/```json\s*([\s\S]*?)\s*```/);
      console.log('🔍 JSON code block match found:', !!codeBlockMatch);
      if (codeBlockMatch) {
        try {
          let jsonContent = codeBlockMatch[1].trim();
          // Clean up any trailing text after the JSON array
          const arrayEndIndex = jsonContent.lastIndexOf(']');
          if (arrayEndIndex !== -1) {
            jsonContent = jsonContent.substring(0, arrayEndIndex + 1);
          }
          
          const jsonEmails = JSON.parse(jsonContent);
          console.log('🔍 Parsed JSON emails:', jsonEmails);
          if (Array.isArray(jsonEmails) && jsonEmails.length > 0 && jsonEmails[0].id) {
            return jsonEmails;
          }
        } catch (jsonError) {
          console.warn("Failed to parse JSON code block:", jsonError);
          console.log("Raw JSON content:", codeBlockMatch[1]);
        }
      }

      // Look for JSON array using bracket counting (most robust)
      const arrayStartIndex = rawResponse.indexOf('[');
      if (arrayStartIndex !== -1) {
        let bracketCount = 0;
        let braceCount = 0;
        let arrayEndIndex = -1;
        
        for (let i = arrayStartIndex; i < rawResponse.length; i++) {
          if (rawResponse[i] === '[') bracketCount++;
          if (rawResponse[i] === ']') bracketCount--;
          if (rawResponse[i] === '{') braceCount++;
          if (rawResponse[i] === '}') braceCount--;
          
          // Found complete array when bracket count reaches 0
          if (bracketCount === 0 && braceCount === 0) {
            arrayEndIndex = i;
            break;
          }
        }
        
        if (arrayEndIndex !== -1) {
          const arrayContent = rawResponse.substring(arrayStartIndex, arrayEndIndex + 1);
          console.log('🔍 Bracket-counted JSON array found, length:', arrayContent.length);
          try {
            const arrayEmails = JSON.parse(arrayContent);
            console.log('🔍 Parsed bracket-counted emails:', arrayEmails);
            if (Array.isArray(arrayEmails) && arrayEmails.length > 0 && arrayEmails[0].id) {
              return arrayEmails;
            }
          } catch (jsonError) {
            console.warn("Failed to parse bracket-counted JSON:", jsonError);
            console.log("Raw bracket-counted content:", arrayContent.substring(0, 500) + '...');
          }
        }
      }

      // Look for STRUCTURED_DATA section (fallback format)  
      const structuredDataMatch = rawResponse.match(/STRUCTURED_DATA:\s*(\[[\s\S]*?\])/);
      if (structuredDataMatch) {
        try {
          const structuredEmails = JSON.parse(structuredDataMatch[1]);
          if (Array.isArray(structuredEmails)) {
            return structuredEmails;
          }
        } catch (jsonError) {
          console.warn("Failed to parse STRUCTURED_DATA:", jsonError);
        }
      }

      // Fallback: Look for TOOL_RESULT containing Gmail emails data (old format)
      const toolResultRegex = /\[TOOL_RESULT:\s*(.*?)\]/gs;
      let match;
      
      while ((match = toolResultRegex.exec(rawResponse)) !== null) {
        try {
          const toolData = JSON.parse(match[1]);
          
          // Check if this is Gmail emails data - could be nested in result
          const emailData = toolData.result?.emails || toolData.emails;
          if (emailData && Array.isArray(emailData)) {
            for (const email of emailData) {
              // Infer classification from the response text
              const classification = inferEmailClassification(email, rawResponse);
              
              emails.push({
                id: email.id,
                subject: email.subject,
                from: email.from,
                snippet: email.snippet,
                classification
              });
            }
            break; // Found emails, stop looking
          }
        } catch (jsonError) {
          // Continue searching other tool results
        }
      }
    } catch (error) {
      console.warn("Failed to parse Smart Inbox emails:", error);
    }

    return emails;
  };

  const inferEmailClassification = (email: any, response: string): string => {
    const subject = (email.subject || "").toLowerCase();
    const from = (email.from || "").toLowerCase();
    const snippet = (email.snippet || "").toLowerCase();
    
    // Check if the response mentions this email's classification
    const emailRef = subject || from;
    if (emailRef && response.includes(emailRef)) {
      // Look for classification keywords near this email
      const emailIndex = response.toLowerCase().indexOf(emailRef);
      const surroundingText = response.substring(Math.max(0, emailIndex - 200), emailIndex + 200).toLowerCase();
      
      if (surroundingText.includes("important") || surroundingText.includes("urgent")) {
        return "IMPORTANT";
      }
      if (surroundingText.includes("promotion") || surroundingText.includes("marketing")) {
        return "PROMOTIONS";  
      }
      if (surroundingText.includes("spam") || surroundingText.includes("delete")) {
        return "SPAM";
      }
      if (surroundingText.includes("starred") || surroundingText.includes("receipt") || surroundingText.includes("confirmation")) {
        return "STARRED";
      }
    }
    
    // Basic classification rules as fallback
    if (from.includes("noreply") || from.includes("marketing") || subject.includes("deal") || subject.includes("offer")) {
      return "PROMOTIONS";
    }
    
    if (subject.includes("receipt") || subject.includes("order") || subject.includes("confirmation")) {
      return "STARRED";
    }
    
    // Default classification
    return "IMPORTANT";
  };

  // Smart Inbox Decision Table Component
  const SmartInboxDecisionTable: React.FC<{
    emails: Array<{
      id: string;
      subject: string;
      from: string;
      snippet: string;
      classification: string;
    }>;
    onSubmit: (decisions: Record<string, string>) => void;
    loading?: boolean;
  }> = ({ emails, onSubmit, loading = false }) => {
    const [decisions, setDecisions] = useState<Record<string, string>>({});

    const handleDecisionChange = (messageId: string, action: string) => {
      setDecisions(prev => ({ ...prev, [messageId]: action }));
    };

    const applyDecisions = () => {
      // Filter out "keep" decisions (no action needed)
      const filteredDecisions = Object.fromEntries(
        Object.entries(decisions).filter(([_, action]) => action !== "keep")
      );
      onSubmit(filteredDecisions);
    };

    return (
      <div className="decision-table">
        <h3>📧 Smart Inbox Decisions</h3>
        <div className="emails-list">
          {emails.map((email) => (
            <div key={email.id} className="email-row">
              <div className="email-content">
                <div className="email-subject">
                  <strong>Subject:</strong> {email.subject}
                </div>
                <div className="email-from">
                  <strong>From:</strong> {email.from}
                </div>
                <div className="email-snippet">
                  <strong>Snippet:</strong> {email.snippet}
                </div>
                <div className="email-classification">
                  <strong>Classification:</strong> 
                  <span className={`classification ${email.classification.toLowerCase()}`}>
                    {email.classification}
                  </span>
                </div>
              </div>
              <div className="email-action">
                <label>Action:</label>
                <select
                  value={decisions[email.id] || "keep"}
                  onChange={(e) => handleDecisionChange(email.id, e.target.value)}
                  disabled={loading}
                  className="action-select"
                >
                  <option value="keep">Keep</option>
                  <option value="delete">Delete</option>
                  <option value="label:STARRED">Label: STARRED</option>
                  <option value="label:IMPORTANT">Label: IMPORTANT</option>
                  <option value="label:CATEGORY_PROMOTIONS">Label: CATEGORY_PROMOTIONS</option>
                  <option value="label:CATEGORY_SOCIAL">Label: CATEGORY_SOCIAL</option>
                  <option value="label:CATEGORY_UPDATES">Label: CATEGORY_UPDATES</option>
                  <option value="label:SPAM">Label: SPAM</option>
                </select>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={applyDecisions}
          disabled={loading || Object.keys(decisions).length === 0}
          className="apply-decisions-btn"
        >
          {loading ? "🔄 Applying..." : "🚀 Apply Decisions"}
        </button>
      </div>
    );
  };

  const renderResult = () => {
    if (!result) return null;

    // Check if this is a Smart Inbox result with structured emails
    const isSmartInbox = (selectedAgent === "smart-inbox" || selectedAgent === "smart-inbox-actions" || selectedAgent === "smart-inbox-v2") && result.success;
    
    // Get emails from direct result or fallback to parsing
    const structuredEmails = result.output?.emails || [];
    let parsedEmails = structuredEmails.length > 0 ? structuredEmails : [];
    
    // Smart Inbox v2: Extract emails directly from tool calls if no parsed emails found
    if (parsedEmails.length === 0 && selectedAgent === "smart-inbox-v2" && (result as any).toolCallResults) {
      console.log('🔍 Extracting emails directly from tool call results');
      const toolCalls = (result as any).toolCallResults;
      const gmailToolCall = toolCalls.find((call: any) => call.tool === 'gmail-get-emails');
      
      if (gmailToolCall?.result?.emails) {
        console.log('🔍 Found emails in tool call results:', gmailToolCall.result.emails.length);
        parsedEmails = gmailToolCall.result.emails.map((email: any) => ({
          ...email,
          classification: inferEmailClassification(email, result.output?._rawResponse || '')
        }));
      }
    }
    
    // Add classifications to emails
    const emails = parsedEmails.map((email: any) => ({
      ...email,
      classification: email.classification || inferEmailClassification(email, result.output?._rawResponse || '')
    }));
    const hasStructuredEmails = emails.length > 0;


    return (
      <div className="results-section">
        <h2 className="results-title">
          {result.success ? '✅ Agent Response' : '❌ Execution Failed'}
        </h2>
        
        {/* Render markdown for readable output */}
        {result.success && result.output?._rawResponse && (
          <div className="results-container">
            <div className="markdown-output">
              <ReactMarkdown>{result.output._rawResponse}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Smart Inbox Decision Table */}
        {isSmartInbox && hasStructuredEmails && (
          <SmartInboxDecisionTable
            emails={emails}
            onSubmit={(decisions) => {
              const newInput = { ...input, decisions };
              runAgent(newInput);
            }}
            loading={loading}
          />
        )}

        {/* Fallback: Raw JSON output */}
        {!result.output?._rawResponse && (
          <div className="results-container">
            <details>
              <summary>Raw JSON Output</summary>
              <pre className="results-output">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
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
              onClick={() => runAgent()}
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

        /* Results styling */
        .results-section {
          margin-top: 20px;
        }

        .results-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .results-container {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .markdown-output {
          line-height: 1.6;
        }

        .markdown-output h1, .markdown-output h2, .markdown-output h3 {
          color: #1f2937;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }

        .markdown-output ul, .markdown-output ol {
          margin: 1em 0;
          padding-left: 1.5em;
        }

        .markdown-output code {
          background: #f3f4f6;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: Monaco, Consolas, monospace;
        }

        .markdown-output pre {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          padding: 1rem;
          overflow-x: auto;
        }

        /* Decision Table Styles */
        .decision-table {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          margin-top: 20px;
        }

        .decision-table h3 {
          margin-top: 0;
          margin-bottom: 16px;
          color: #1f2937;
        }

        .emails-list {
          margin-bottom: 20px;
        }

        .email-row {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 12px;
          background: #fafafa;
        }

        .email-content {
          flex: 1;
        }

        .email-subject, .email-from, .email-snippet, .email-classification {
          margin-bottom: 4px;
          font-size: 14px;
        }

        .classification {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          margin-left: 8px;
        }

        .classification.important {
          background: #fef3c7;
          color: #92400e;
        }

        .classification.promotions {
          background: #dbeafe;
          color: #1e40af;
        }

        .classification.starred {
          background: #fed7d7;
          color: #c53030;
        }

        .classification.spam {
          background: #fee2e2;
          color: #dc2626;
        }

        .email-action {
          flex-shrink: 0;
          width: 150px;
        }

        .email-action label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 4px;
          color: #6b7280;
        }

        .action-select {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }

        .apply-decisions-btn {
          background: #2563eb;
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .apply-decisions-btn:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .apply-decisions-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        /* Raw JSON collapsible */
        details {
          margin-top: 16px;
        }

        details summary {
          cursor: pointer;
          padding: 8px;
          background: #f3f4f6;
          border-radius: 4px;
          font-weight: 500;
        }

        .results-output {
          background: #f8f9fa !important;
          border: 1px solid #e9ecef !important;
          border-radius: 6px !important;
          padding: 1rem !important;
          overflow-x: auto !important;
          font-family: Monaco, Consolas, monospace !important;
          font-size: 12px !important;
          margin-top: 8px !important;
        }
      `}</style>
    </div>
  );
};

export default RunAgents;