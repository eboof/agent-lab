// ui/src/pages/agents/SmartInboxWorkflow.tsx
// Dedicated workflow page for Smart Inbox functionality

import React, { useState, useEffect } from 'react';
import * as yaml from 'js-yaml';

interface Email {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  classification: string;
}

const SmartInboxWorkflow: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [rawResponse, setRawResponse] = useState<string>('');
  const [count, setCount] = useState<number>(10);

  const fetchEmails = async () => {
    setLoading(true);
    setError('');
    setEmails([]);
    
    try {
      const response = await fetch(`http://localhost:3001/api/agents/run/smart-inbox-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: { count } })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch emails');
      }

      const rawResp = data.output?._rawResponse || '';
      setRawResponse(rawResp);
      
      // Parse emails from YAML
      const parsedEmails = parseEmailsFromResponse(rawResp);
      
      // If YAML parsing fails, try tool call results
      if (parsedEmails.length === 0 && data.toolCallResults?.length > 0) {
        const gmailTool = data.toolCallResults.find((call: any) => call.tool === 'gmail-get-emails');
        if (gmailTool?.result?.emails) {
          const toolEmails = gmailTool.result.emails.map((email: any) => ({
            ...email,
            classification: inferClassification(email)
          }));
          setEmails(toolEmails);
        }
      } else {
        setEmails(parsedEmails);
      }
      
    } catch (err: any) {
      setError(`Failed to fetch emails: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const parseEmailsFromResponse = (response: string): Email[] => {
    try {
      // Look for YAML block
      const yamlMatch = response.match(/```yaml\s*([\s\S]*?)\s*```/);
      if (yamlMatch) {
        const parsedYaml = yaml.load(yamlMatch[1]) as any;
        if (parsedYaml?.emails && Array.isArray(parsedYaml.emails)) {
          return parsedYaml.emails;
        }
      }
    } catch (error) {
      console.warn('Failed to parse YAML:', error);
    }
    return [];
  };

  const inferClassification = (email: any): string => {
    const from = (email.from || '').toLowerCase();
    const subject = (email.subject || '').toLowerCase();
    
    if (from.includes('noreply') || subject.includes('promotion') || subject.includes('deal')) {
      return 'PROMOTIONS';
    }
    if (from.includes('notification') || from.includes('update')) {
      return 'UPDATES';
    }
    if (from.includes('social') || from.includes('facebook') || from.includes('twitter')) {
      return 'SOCIAL';
    }
    return 'IMPORTANT';
  };

  const handleDecisionChange = (emailId: string, action: string) => {
    setDecisions(prev => ({ ...prev, [emailId]: action }));
  };

  const applyDecisions = async () => {
    if (Object.keys(decisions).length === 0) return;
    
    setLoading(true);
    try {
      const filteredDecisions = Object.fromEntries(
        Object.entries(decisions).filter(([_, action]) => action !== 'keep')
      );
      
      const response = await fetch(`http://localhost:3001/api/agents/run/smart-inbox-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input: { 
            count, 
            decisions: filteredDecisions 
          } 
        })
      });
      
      const data = await response.json();
      if (data.success) {
        // Refresh email list
        await fetchEmails();
        setDecisions({});
      } else {
        setError(`Failed to apply decisions: ${data.error}`);
      }
      
    } catch (err: any) {
      setError(`Failed to apply decisions: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="smart-inbox-workflow">
      <div className="page-header">
        <h1>📧 Smart Inbox Workflow</h1>
        <p>AI-powered Gmail management with interactive decisions</p>
      </div>

      <div className="controls">
        <div className="fetch-section">
          <label>
            Email Count:
            <input
              type="number"
              min="1"
              max="25"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              disabled={loading}
            />
          </label>
          <button 
            onClick={fetchEmails}
            disabled={loading}
            className="fetch-btn"
          >
            {loading ? '🔄 Loading...' : '📥 Fetch Emails'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          ❌ {error}
        </div>
      )}

      {emails.length > 0 && (
        <div className="decision-section">
          <h2>📋 Email Management</h2>
          <div className="emails-grid">
            {emails.map((email) => (
              <div key={email.id} className="email-card">
                <div className="email-header">
                  <div className="email-from">📨 {email.from}</div>
                  <div className={`classification ${email.classification.toLowerCase()}`}>
                    {email.classification}
                  </div>
                </div>
                <div className="email-subject">📄 {email.subject}</div>
                <div className="email-snippet">💬 {email.snippet}</div>
                
                <div className="decision-controls">
                  <label>Action:</label>
                  <select
                    value={decisions[email.id] || 'keep'}
                    onChange={(e) => handleDecisionChange(email.id, e.target.value)}
                    disabled={loading}
                  >
                    <option value="keep">Keep</option>
                    <option value="delete">Delete</option>
                    <option value="label:STARRED">⭐ Star</option>
                    <option value="label:IMPORTANT">❗ Important</option>
                    <option value="label:CATEGORY_PROMOTIONS">📢 Promotions</option>
                    <option value="label:CATEGORY_SOCIAL">👥 Social</option>
                    <option value="label:CATEGORY_UPDATES">📝 Updates</option>
                    <option value="label:SPAM">🚫 Spam</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
          
          <div className="apply-section">
            <button
              onClick={applyDecisions}
              disabled={loading || Object.keys(decisions).length === 0}
              className="apply-btn"
            >
              {loading ? '⏳ Applying...' : `🚀 Apply ${Object.keys(decisions).length} Decisions`}
            </button>
          </div>
        </div>
      )}

      {rawResponse && (
        <details className="debug-section">
          <summary>🔍 Debug Info</summary>
          <pre>{rawResponse}</pre>
        </details>
      )}

      <style jsx>{`
        .smart-inbox-workflow {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header h1 {
          color: #2563eb;
          margin-bottom: 8px;
        }

        .controls {
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          margin-bottom: 20px;
        }

        .fetch-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .fetch-section input {
          width: 80px;
          margin-left: 8px;
          padding: 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
        }

        .fetch-btn {
          background: #2563eb;
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .fetch-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .error-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .decision-section {
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          margin-bottom: 20px;
        }

        .emails-grid {
          display: grid;
          gap: 16px;
          margin-bottom: 20px;
        }

        .email-card {
          background: #f9fafb;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .email-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .email-from {
          font-weight: 500;
          color: #374151;
        }

        .classification {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .classification.important {
          background: #fef3c7;
          color: #92400e;
        }

        .classification.promotions {
          background: #dbeafe;
          color: #1e40af;
        }

        .classification.social {
          background: #f3e8ff;
          color: #7c3aed;
        }

        .classification.updates {
          background: #dcfce7;
          color: #166534;
        }

        .classification.spam {
          background: #fee2e2;
          color: #dc2626;
        }

        .email-subject {
          font-weight: 600;
          margin-bottom: 4px;
          color: #111827;
        }

        .email-snippet {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 12px;
        }

        .decision-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .decision-controls select {
          padding: 6px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }

        .apply-section {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .apply-btn {
          background: #059669;
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 16px;
        }

        .apply-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .debug-section {
          background: #f3f4f6;
          padding: 16px;
          border-radius: 8px;
          margin-top: 20px;
        }

        .debug-section pre {
          background: white;
          padding: 12px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

export default SmartInboxWorkflow;