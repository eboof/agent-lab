// ui/src/pages/execution/AgentPortal.tsx
import React from 'react';
import SmartInboxDecisionTable from './SmartInboxDecisionTable';

export interface AgentPortalProps {
  agentId: string;
  status: "pending" | "running" | "done" | "error" | "awaiting_user";
  input?: any;
  output?: any;
  error?: string;
  startTime?: number;
  endTime?: number;
  toolCalls?: any[];
  awaitingUserData?: {
    outputSchema?: any;
    prompt?: string;
    data?: any;
    userResponse?: any;
  };
  onDecisionSubmit?: (agentId: string, decisions: Record<string, string>) => void;
}

export default function AgentPortal({ 
  agentId, 
  status, 
  input, 
  output, 
  error, 
  startTime,
  endTime,
  toolCalls,
  awaitingUserData,
  onDecisionSubmit 
}: AgentPortalProps) {
  console.log('🤖 AgentPortal rendering:', { agentId, status, hasAwaitingData: !!awaitingUserData });

  const getStatusIcon = (status: AgentPortalProps['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '🔄';
      case 'done': return '✅';
      case 'error': return '❌';
      case 'awaiting_user': return '⏸️';
      default: return '❓';
    }
  };

  const getStatusColor = (status: AgentPortalProps['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'running': return 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse';
      case 'done': return 'bg-green-100 text-green-700 border-green-200';
      case 'error': return 'bg-red-100 text-red-700 border-red-200';
      case 'awaiting_user': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDuration = (start?: number, end?: number) => {
    if (!start) return 'Not started';
    if (!end && status === 'running') return `Running for ${Math.floor((Date.now() - start) / 1000)}s`;
    if (!end) return 'In progress';
    return `Completed in ${Math.floor((end - start) / 1000)}s`;
  };

  const handleDecisionSubmit = (decisions: Record<string, string>) => {
    if (onDecisionSubmit) {
      onDecisionSubmit(agentId, decisions);
    }
  };

  const renderSmartInboxDecisions = () => {
    console.log('📧 AgentPortal renderSmartInboxDecisions - status:', status, 'awaitingUserData:', awaitingUserData);
    
    // Check if this is Smart Inbox and needs user decisions
    // Handle both direct path (awaitingUserData.data.emails) and nested path (awaitingUserData.data.data.emails)
    const emails = awaitingUserData?.data?.emails || awaitingUserData?.data?.data?.emails;
    console.log('📧 Found emails:', emails?.length || 0, 'emails:', emails);
    
    if (status === 'awaiting_user' && emails) {
      console.log('📧 Rendering SmartInboxDecisionTable with', emails.length, 'emails');
      return (
        <SmartInboxDecisionTable
          emails={emails}
          onSubmit={handleDecisionSubmit}
          loading={false}
        />
      );
    }

    // Check if output contains emails for completed Smart Inbox
    if (output?.emails && Array.isArray(output.emails)) {
      return (
        <div className="smart-inbox-result">
          <h4>📧 Processed Emails ({output.emails.length})</h4>
          <div className="email-summary">
            {output.emails.slice(0, 3).map((email: any, idx: number) => (
              <div key={idx} className="email-preview">
                <strong>{email.subject}</strong>
                <span className="email-from">from {email.from}</span>
                <span className={`classification ${email.classification?.toLowerCase()}`}>
                  {email.classification}
                </span>
              </div>
            ))}
            {output.emails.length > 3 && (
              <div className="more-emails">
                +{output.emails.length - 3} more emails...
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="agent-portal">
      <div className="portal-header">
        <div className="agent-info">
          <h2 className="agent-name">🤖 {agentId}</h2>
          <div className={`status-badge ${getStatusColor(status)}`}>
            {getStatusIcon(status)} {status.replace('_', ' ').toUpperCase()}
          </div>
        </div>
        <div className="timing-info">
          {formatDuration(startTime, endTime)}
        </div>
      </div>

      {error && (
        <div className="error-section">
          <h4>❌ Error Details</h4>
          <div className="error-content">
            {error}
          </div>
        </div>
      )}

      {status === 'awaiting_user' && awaitingUserData?.prompt && (
        <div className="awaiting-section">
          <h4>⏸️ Waiting for User Input</h4>
          <div className="prompt-content">
            {awaitingUserData.prompt}
          </div>
        </div>
      )}

      <div className="portal-content">
        <div className="data-sections">
          {input && (
            <div className="data-section">
              <h4>📥 Input</h4>
              <div className="json-viewer">
                <pre>{JSON.stringify(input, null, 2)}</pre>
              </div>
            </div>
          )}

          {output && (
            <div className="data-section">
              <h4>📤 Output</h4>
              <div className="json-viewer">
                <pre>{JSON.stringify(output, null, 2)}</pre>
              </div>
            </div>
          )}

          {toolCalls && toolCalls.length > 0 && (
            <div className="data-section">
              <h4>🔧 Tool Calls ({toolCalls.length})</h4>
              <div className="tool-calls">
                {toolCalls.map((call, idx) => (
                  <div key={idx} className="tool-call">
                    <div className="tool-header">
                      <strong>{call.tool}</strong>
                      <span className="tool-time">
                        {new Date(call.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {call.params && (
                      <details className="tool-details">
                        <summary>Parameters</summary>
                        <pre>{JSON.stringify(call.params, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {(() => {
          try {
            return renderSmartInboxDecisions();
          } catch (error) {
            console.error('❌ Error rendering SmartInboxDecisions:', error);
            return (
              <div style={{padding: '20px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px'}}>
                <h4>⚠️ Error rendering decision table</h4>
                <p>Status: {status}</p>
                <p>Has awaitingUserData: {!!awaitingUserData ? 'Yes' : 'No'}</p>
                <p>Error: {error?.toString()}</p>
              </div>
            );
          }
        })()}
      </div>

      <style>{`
        .agent-portal {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          margin-bottom: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .portal-header {
          background: #f9fafb;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .agent-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .agent-name {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #111827;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid;
        }

        .timing-info {
          font-size: 14px;
          color: #6b7280;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .error-section, .awaiting-section {
          padding: 16px 20px;
          border-bottom: 1px solid #f3f4f6;
        }

        .error-section {
          background: #fef2f2;
        }

        .awaiting-section {
          background: #fff7ed;
        }

        .error-section h4, .awaiting-section h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
        }

        .error-content, .prompt-content {
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 14px;
          background: rgba(0, 0, 0, 0.05);
          padding: 12px;
          border-radius: 6px;
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .portal-content {
          padding: 20px;
        }

        .data-sections {
          display: grid;
          gap: 16px;
          margin-bottom: 24px;
        }

        .data-section h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .json-viewer {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          overflow: hidden;
        }

        .json-viewer pre {
          padding: 16px;
          margin: 0;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 12px;
          line-height: 1.5;
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow-wrap: break-word;
          color: #374151;
        }

        .tool-calls {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .tool-call {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          padding: 12px;
        }

        .tool-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .tool-time {
          font-size: 11px;
          color: #6b7280;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .tool-details summary {
          cursor: pointer;
          font-size: 12px;
          color: #3b82f6;
          margin-bottom: 4px;
        }

        .tool-details pre {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 8px;
          font-size: 11px;
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .smart-inbox-result h4 {
          margin: 0 0 12px 0;
          color: #374151;
        }

        .email-summary {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .email-preview {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: #f9fafb;
          border-radius: 6px;
          font-size: 14px;
        }

        .email-from {
          color: #6b7280;
          font-size: 12px;
        }

        .classification {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
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

        .more-emails {
          color: #6b7280;
          font-style: italic;
          font-size: 12px;
          padding: 4px 12px;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}