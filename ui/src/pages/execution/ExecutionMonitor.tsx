// ui/src/pages/execution/ExecutionMonitor.tsx
import React, { useState, useEffect, useRef } from 'react';
import AgentPortal from './AgentPortal';
import ExecutionLogs from './ExecutionLogs';

interface AgentState {
  agentId: string;
  status: "pending" | "running" | "done" | "error" | "awaiting_user";
  startTime?: number;
  endTime?: number;
  input?: any;
  output?: any;
  error?: string;
  toolCalls?: any[];
  awaitingUserData?: {
    outputSchema?: any;
    prompt?: string;
    data?: any;
    userResponse?: any;
  };
}

interface LogEntry {
  timestamp: number;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  agentId?: string;
  data?: any;
}

interface ExecutionState {
  executionId: string;
  startTime: number;
  endTime?: number;
  status: "running" | "completed" | "failed" | "paused";
  agents: AgentState[];
  logs: LogEntry[];
  metadata?: any;
}

interface ExecutionMonitorProps {
  executionId: string;
}

export default function ExecutionMonitor({ executionId }: ExecutionMonitorProps) {
  console.log('🚀 ExecutionMonitor component mounted with executionId:', executionId);
  const [execution, setExecution] = useState<ExecutionState | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [error, setError] = useState<string>('');
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    console.log('🔄 ExecutionMonitor useEffect - executionId:', executionId);
    if (!executionId) {
      console.log('❌ No executionId provided');
      return;
    }

    // Connect to WebSocket

    connectWebSocket();

    // Cleanup
    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000);
        wsRef.current = null;
      }
    };
  }, [executionId]);

  const handleDecisionSubmit = (agentId: string, decisions: Record<string, string>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: 'user:decision',
        agentId,
        data: decisions
      };
      
      console.log('📤 Sending user decision:', message);
      wsRef.current.send(JSON.stringify(message));
    } else {
      setError('Cannot send decisions: WebSocket not connected');
    }
  };

  const handleContinueExecution = async () => {
    if (!execution) return;
    
    try {
      console.log('🔄 Continuing execution:', executionId);
      const response = await fetch(`http://localhost:3001/api/executions/${executionId}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      if (!response.ok) {
        setError(`Failed to continue: ${result.error}`);
      } else {
        console.log('✅ Execution continued:', result);
      }
    } catch (err: any) {
      setError(`Failed to continue execution: ${err.message}`);
    }
  };

  const handleRefreshState = () => {
    console.log('🔄 Refreshing execution state by reconnecting WebSocket');
    
    // Close current WebSocket connection
    if (wsRef.current) {
      wsRef.current.close(1000);
      wsRef.current = null;
    }
    
    // Reconnect after a short delay
    setTimeout(() => {
      if (!wsRef.current) {
        connectWebSocket();
      }
    }, 500);
  };

  const connectWebSocket = () => {
    const wsUrl = `ws://localhost:3001/ws/execution/${executionId}`;
    console.log(`📡 Connecting to ${wsUrl}`);
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('📱 WebSocket connected');
      setConnectionStatus('connected');
      setError('');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('📨 WebSocket message:', message);

        if (message.type === 'execution:state') {
          console.log('📊 Received execution state:', message.data);
          setExecution(message.data);
        } else if (message.type === 'execution:event') {
          // Handle real-time updates
          const eventData = message.data;
          setExecution(prev => {
            if (!prev) return null;
            
            // Update based on event type
            switch (eventData.type) {
              case 'log':
                return {
                  ...prev,
                  logs: [...prev.logs, {
                    timestamp: eventData.timestamp,
                    level: eventData.data?.level || 'info',
                    message: eventData.data?.message || '',
                    agentId: eventData.agentId,
                    data: eventData.data
                  }]
                };
              
              case 'agent:start':
              case 'agent:done':
              case 'agent:error':
              case 'agent:awaiting_user':
                // Agent state will be updated by the backend and sent as full state
                return prev;
              
              default:
                return prev;
            }
          });
        }
      } catch (err) {
        console.error('❌ WebSocket message parse error:', err);
      }
    };

    ws.onclose = (event) => {
      console.log('📱 WebSocket closed:', event.code, event.reason);
      setConnectionStatus('disconnected');
      
      // Try to reconnect after a delay
      if (event.code !== 1000) { // Not a normal closure
        setTimeout(() => {
          if (wsRef.current === ws) { // Only reconnect if this is still the current ws
            connectWebSocket();
          }
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setError('WebSocket connection error');
      setConnectionStatus('disconnected');
    };
  };

  const getExecutionStatusIcon = (status: ExecutionState['status']) => {
    switch (status) {
      case 'running': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'paused': return '⏸️';
      default: return '❓';
    }
  };

  if (!executionId) {
    console.log('❌ ExecutionMonitor: No executionId provided');
    return (
      <div className="execution-error">
        <h1>❌ No Execution ID</h1>
        <p>Please provide a valid execution ID in the URL</p>
        <p>Current URL: {window.location.pathname}</p>
      </div>
    );
  }

  console.log('🎯 ExecutionMonitor rendering with:', { 
    executionId, 
    execution: !!execution, 
    connectionStatus, 
    error,
    executionStatus: execution?.status,
    agentStatus: execution?.agents?.[0]?.status,
    hasUserResponse: !!execution?.agents?.[0]?.awaitingUserData?.userResponse
  });

  return (
    <div className="execution-monitor">
      {/* Header */}
      <div className="monitor-header">
        <div className="execution-info">
          <div className="header-title">
            <button 
              onClick={() => {
                window.history.pushState({}, '', '/');
                window.location.reload();
              }} 
              className="back-button"
              title="Back to Agents"
            >
              ← Back
            </button>
            <h1>🔬 Execution Monitor</h1>
          </div>
          <div className="execution-details">
            <span className="execution-id">ID: {executionId}</span>
            {execution && (
              <>
                <span className="execution-status">
                  {getExecutionStatusIcon(execution.status)} {execution.status.toUpperCase()}
                </span>
                <span className="execution-duration">
                  {execution.endTime 
                    ? `Completed in ${Math.floor((execution.endTime - execution.startTime) / 1000)}s`
                    : `Running for ${Math.floor((Date.now() - execution.startTime) / 1000)}s`
                  }
                </span>
              </>
            )}
          </div>
        </div>

        <div className="connection-status">
          <div className={`status-indicator ${connectionStatus}`}>
            {connectionStatus === 'connected' && '🟢 Connected'}
            {connectionStatus === 'connecting' && '🟡 Connecting...'}
            {connectionStatus === 'disconnected' && '🔴 Disconnected'}
          </div>
          
          <button 
            onClick={handleRefreshState}
            className="refresh-button"
          >
            🔄 Refresh
          </button>
          
          {execution?.agents.some(a => a.awaitingUserData?.userResponse) && (
            <button 
              onClick={handleContinueExecution}
              className="continue-button"
            >
              🚀 Continue Execution
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-banner">
          ❌ {error}
        </div>
      )}

      {!execution && (
        <div className="loading-state">
          <div className="loading-spinner">🔄</div>
          <h2>Loading execution data...</h2>
          <p>Connection: {connectionStatus}</p>
          <p>Execution ID: {executionId}</p>
          <p>Waiting for execution state from server...</p>
        </div>
      )}

      {execution && (
        <div className="monitor-content">
          {/* Debug info */}
          <div style={{background: '#f0f9ff', padding: '12px', marginBottom: '16px', borderRadius: '8px'}}>
            <h3>🔍 Debug Info</h3>
            <p>Execution Status: {execution.status}</p>
            <p>Agents Count: {execution.agents?.length || 0}</p>
            {execution.agents?.map((agent, i) => (
              <p key={i}>Agent {i}: {agent.agentId} - {agent.status}</p>
            ))}
          </div>
          {/* Main Content Area */}
          <div className="content-area">
            {/* Sidebar */}
            <div className="sidebar">
              <h3>🤖 Agents ({execution.agents.length})</h3>
              <div className="agent-list">
                {execution.agents.length === 0 ? (
                  <div className="empty-agents">
                    <span>No agents yet...</span>
                  </div>
                ) : (
                  execution.agents.map((agent) => (
                    <div key={agent.agentId} className={`agent-item ${agent.status}`}>
                      <div className="agent-name">{agent.agentId}</div>
                      <div className="agent-status">
                        {agent.status.replace('_', ' ')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Agent Portals */}
            <div className="portals-area">
              {execution.agents.length === 0 ? (
                <div className="empty-portals">
                  <div className="empty-icon">🤖</div>
                  <h2>No agents running yet</h2>
                  <p>Agent portals will appear here as execution progresses</p>
                </div>
              ) : (
                execution.agents.map((agent) => {
                  try {
                    return (
                      <AgentPortal
                        key={agent.agentId}
                        {...agent}
                        onDecisionSubmit={handleDecisionSubmit}
                      />
                    );
                  } catch (error) {
                    console.error('❌ Error rendering AgentPortal:', error);
                    return (
                      <div key={agent.agentId} style={{padding: '20px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', margin: '10px 0'}}>
                        <h3>⚠️ Error rendering agent portal</h3>
                        <p>Agent: {agent.agentId}</p>
                        <p>Status: {agent.status}</p>
                        <p>Error: {error?.toString()}</p>
                      </div>
                    );
                  }
                })
              )}
            </div>
          </div>

          {/* Logs Panel */}
          <div className="logs-panel">
            <ExecutionLogs logs={execution.logs} />
          </div>
        </div>
      )}

      <style>{`
        .execution-monitor {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f5f5f5;
        }

        .monitor-header {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .back-button {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          color: #374151;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .back-button:hover {
          background: #e5e7eb;
          color: #111827;
        }

        .execution-info h1 {
          margin: 0;
          font-size: 24px;
          color: #111827;
        }

        .execution-details {
          display: flex;
          gap: 16px;
          align-items: center;
          font-size: 14px;
        }

        .execution-id {
          color: #6b7280;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .execution-status {
          background: #f3f4f6;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 500;
        }

        .execution-duration {
          color: #374151;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .status-indicator {
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .status-indicator.connected {
          background: #dcfce7;
          color: #166534;
        }

        .status-indicator.connecting {
          background: #fef3c7;
          color: #92400e;
        }

        .status-indicator.disconnected {
          background: #fee2e2;
          color: #dc2626;
        }

        .continue-button {
          background: #10b981;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-left: 12px;
          transition: all 0.2s;
        }

        .continue-button:hover {
          background: #059669;
          transform: translateY(-1px);
        }

        .refresh-button {
          background: #6b7280;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-left: 12px;
          transition: all 0.2s;
        }

        .refresh-button:hover {
          background: #4b5563;
          transform: translateY(-1px);
        }

        .error-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 20px;
          text-align: center;
        }

        .loading-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #6b7280;
        }

        .loading-spinner {
          font-size: 48px;
          margin-bottom: 16px;
          animation: spin 2s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .monitor-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .content-area {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .sidebar {
          width: 250px;
          background: white;
          border-right: 1px solid #e5e7eb;
          padding: 20px;
          overflow-y: auto;
        }

        .sidebar h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          color: #374151;
        }

        .empty-agents {
          color: #9ca3af;
          text-align: center;
          font-style: italic;
          padding: 20px;
        }

        .agent-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .agent-item {
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .agent-item.running {
          background: #dbeafe;
          border-color: #93c5fd;
        }

        .agent-item.done {
          background: #dcfce7;
          border-color: #86efac;
        }

        .agent-item.error {
          background: #fee2e2;
          border-color: #fca5a5;
        }

        .agent-item.awaiting_user {
          background: #fff7ed;
          border-color: #fdba74;
        }

        .agent-name {
          font-weight: 500;
          color: #111827;
          margin-bottom: 4px;
        }

        .agent-status {
          font-size: 12px;
          color: #6b7280;
          text-transform: capitalize;
        }

        .portals-area {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }

        .empty-portals {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #6b7280;
          text-align: center;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-portals h2 {
          margin: 0 0 8px 0;
          color: #374151;
        }

        .logs-panel {
          height: 300px;
          border-top: 1px solid #e5e7eb;
        }

        .execution-error {
          padding: 40px;
          text-align: center;
          color: #6b7280;
        }

        .execution-error h1 {
          color: #dc2626;
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
}