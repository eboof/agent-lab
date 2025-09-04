// ui/src/pages/agents/SmartInboxV2.tsx
// Multi-agent orchestrated Smart Inbox interface

import React, { useState } from 'react';
import SmartInboxDecisionTable from '../../components/SmartInboxDecisionTable';

interface Email {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  classification: string;
  recommend?: string;
}

interface ActionResult {
  id: string;
  action: string;
  status: 'success' | 'error' | 'skipped';
  message?: string;
}

interface SmartInboxFlowResult {
  success: boolean;
  phase: 'analysis' | 'execution' | 'completed';
  data?: {
    emails: Email[];
    actionResults?: ActionResult[];
  };
  error?: string;
  metadata?: {
    timestamp: string;
    executionTime: number;
    agentsUsed: string[];
  };
}

const SmartInboxV2: React.FC = () => {
  const [count, setCount] = useState<number>(10);
  const [result, setResult] = useState<SmartInboxFlowResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const runAnalysis = async () => {
    setLoading(true);
    setResult(null);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/agents/smart-inbox-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count })
      });

      const data = await response.json();
      setResult(data);

      if (!data.success) {
        setError(data.error || 'Unknown error occurred');
      }
    } catch (err: any) {
      setError(`Failed to run Smart Inbox: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const applyDecisions = async (decisions: Record<string, string>) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/agents/smart-inbox-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count, decisions })
      });

      const data = await response.json();
      setResult(data);

      if (!data.success) {
        setError(data.error || 'Failed to apply decisions');
      }
    } catch (err: any) {
      setError(`Failed to apply decisions: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderActionResults = (actionResults: ActionResult[]) => {
    const successCount = actionResults.filter(r => r.status === 'success').length;
    const errorCount = actionResults.filter(r => r.status === 'error').length;

    return (
      <div className="action-results">
        <h3>📊 Execution Results</h3>
        <div className="results-summary">
          <span className="success-badge">{successCount} successful</span>
          {errorCount > 0 && <span className="error-badge">{errorCount} failed</span>}
        </div>
        
        <div className="results-details">
          {actionResults.map((result) => (
            <div key={result.id} className={`result-item ${result.status}`}>
              <div className="result-action">{result.action}</div>
              <div className="result-status">
                {result.status === 'success' ? '✅' : '❌'} {result.status}
              </div>
              {result.message && (
                <div className="result-message">{result.message}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="smart-inbox-v2">
      <div className="page-header">
        <h1>📧 Smart Inbox v2</h1>
        <p>Multi-agent orchestrated email management</p>
      </div>

      {error && (
        <div className="error-banner">
          ❌ {error}
        </div>
      )}

      <div className="controls">
        <div className="input-group">
          <label htmlFor="count">Number of emails to analyze:</label>
          <input
            id="count"
            type="number"
            min="1"
            max="25"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value) || 10)}
            disabled={loading}
          />
        </div>
        
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="analyze-btn"
        >
          {loading ? "🔄 Analyzing..." : "📥 Analyze Inbox"}
        </button>
      </div>

      {result && result.metadata && (
        <div className="flow-metadata">
          <div className="metadata-item">
            <strong>Phase:</strong> {result.phase}
          </div>
          <div className="metadata-item">
            <strong>Agents Used:</strong> {result.metadata.agentsUsed.join(', ')}
          </div>
          <div className="metadata-item">
            <strong>Execution Time:</strong> {result.metadata.executionTime}ms
          </div>
        </div>
      )}

      {result && result.success && result.data?.emails && (
        <SmartInboxDecisionTable
          emails={result.data.emails}
          onSubmit={applyDecisions}
          loading={loading}
        />
      )}

      {result && result.data?.actionResults && (
        renderActionResults(result.data.actionResults)
      )}

      <style jsx>{`
        .smart-inbox-v2 {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header h1 {
          color: #2563eb;
          margin-bottom: 8px;
        }

        .page-header p {
          color: #6b7280;
          margin-bottom: 32px;
        }

        .error-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .controls {
          display: flex;
          align-items: flex-end;
          gap: 16px;
          margin-bottom: 24px;
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .input-group label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .input-group input {
          width: 120px;
          padding: 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
        }

        .analyze-btn {
          background: #2563eb;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .analyze-btn:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .analyze-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .flow-metadata {
          display: flex;
          gap: 24px;
          margin-bottom: 20px;
          padding: 12px 16px;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 6px;
          font-size: 14px;
        }

        .metadata-item strong {
          color: #0369a1;
        }

        .action-results {
          margin-top: 24px;
          padding: 20px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        }

        .action-results h3 {
          margin-top: 0;
          margin-bottom: 12px;
          color: #1f2937;
        }

        .results-summary {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .success-badge {
          background: #ecfdf5;
          color: #065f46;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .error-badge {
          background: #fee2e2;
          color: #dc2626;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .results-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .result-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 14px;
        }

        .result-item.success {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
        }

        .result-item.error {
          background: #fef2f2;
          border: 1px solid #fecaca;
        }

        .result-action {
          font-weight: 500;
          min-width: 120px;
        }

        .result-status {
          min-width: 80px;
        }

        .result-message {
          color: #6b7280;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

export default SmartInboxV2;