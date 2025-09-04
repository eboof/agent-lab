// ui/src/pages/agents/ExecutionLauncher.tsx
// Launcher for agent executions with real-time monitoring

import React, { useState, useEffect } from 'react';

interface Agent {
  id: string;
  name: string;
  description?: string;
}

interface Execution {
  executionId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  startTime: number;
  agentId: string;
  metadata?: any;
}

export default function ExecutionLauncher() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [input, setInput] = useState<Record<string, any>>({});
  const [launching, setLaunching] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Load agents and executions
  useEffect(() => {
    loadAgents();
    loadExecutions();
    
    // Poll executions every 5 seconds
    const interval = setInterval(loadExecutions, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadAgents = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/agents/list');
      const data = await response.json();
      setAgents(data);
    } catch (err: any) {
      setError(`Failed to load agents: ${err.message}`);
    }
  };

  const loadExecutions = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/executions');
      const data = await response.json();
      setExecutions(data);
    } catch (err: any) {
      console.error('Failed to load executions:', err);
    }
  };

  const launchExecution = async () => {
    if (!selectedAgent) {
      setError('Please select an agent');
      return;
    }

    setLaunching(true);
    setError('');

    try {
      const executionId = `exec_${selectedAgent}_${Date.now()}`;
      
      // Create execution
      await fetch(`http://localhost:3001/api/executions/${executionId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            agentId: selectedAgent,
            launchedBy: 'execution-launcher',
            input
          }
        })
      });

      // Run the agent
      const runResponse = await fetch(`http://localhost:3001/api/agents/run/${selectedAgent}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input,
          executionId 
        })
      });

      const runData = await runResponse.json();
      
      if (!runData.success) {
        throw new Error(runData.error || 'Agent execution failed');
      }

      // Open execution monitor
      openExecutionMonitor(executionId);
      
    } catch (err: any) {
      setError(`Launch failed: ${err.message}`);
    } finally {
      setLaunching(false);
    }
  };

  const openExecutionMonitor = (executionId: string) => {
    // Navigate to execution monitor in same window
    const monitorUrl = `/execution/${executionId}`;
    window.history.pushState({}, '', monitorUrl);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleInputChange = (key: string, value: any) => {
    setInput(prev => ({ ...prev, [key]: value }));
  };

  const getStatusIcon = (status: Execution['status']) => {
    switch (status) {
      case 'running': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'paused': return '⏸️';
      default: return '❓';
    }
  };

  const formatDuration = (startTime: number) => {
    const seconds = Math.floor((Date.now() - startTime) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const clearInactiveExecutions = async () => {
    setClearing(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/executions/clear-inactive', {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Clear failed');
      }

      // Refresh executions list
      await loadExecutions();
      console.log(`🧹 Cleared ${data.cleared} inactive executions`);
      
    } catch (err: any) {
      setError(`Clear failed: ${err.message}`);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="execution-launcher">
      <div className="page-header">
        <h1>🚀 Execution Launcher</h1>
        <p>Launch agents with real-time monitoring and interactive decision flows</p>
      </div>

      {error && (
        <div className="error-banner">
          ❌ {error}
        </div>
      )}

      <div className="launcher-content">
        {/* Launch Form */}
        <div className="launch-section">
          <h2>🤖 Launch Agent</h2>
          
          <div className="form-grid">
            <div className="form-field">
              <label>Agent</label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                disabled={launching}
                className="form-select"
              >
                <option value="">Select an agent...</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.id}
                  </option>
                ))}
              </select>
            </div>

            {selectedAgent === 'smart-inbox-v2' && (
              <div className="form-field">
                <label>Email Count</label>
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={input.count || 10}
                  onChange={(e) => handleInputChange('count', parseInt(e.target.value))}
                  disabled={launching}
                  className="form-input"
                />
              </div>
            )}

            {selectedAgent === 'weather-agent' && (
              <div className="form-field">
                <label>Location</label>
                <input
                  type="text"
                  value={input.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  disabled={launching}
                  placeholder="e.g. San Francisco, CA"
                  className="form-input"
                />
              </div>
            )}
          </div>

          <button
            onClick={launchExecution}
            disabled={launching || !selectedAgent}
            className="launch-button"
          >
            {launching ? '🔄 Launching...' : '🚀 Launch Execution'}
          </button>
        </div>

        {/* Active Executions */}
        <div className="executions-section">
          <div className="executions-header">
            <h2>⚡ Active Executions</h2>
            <button
              onClick={clearInactiveExecutions}
              disabled={clearing}
              className="clear-button"
              title="Clear completed and failed executions"
            >
              {clearing ? '🔄 Clearing...' : '🧹 Clear Inactive'}
            </button>
          </div>
          
          {executions.length === 0 ? (
            <div className="empty-executions">
              <span>No active executions</span>
            </div>
          ) : (
            <div className="executions-list">
              {executions
                .sort((a, b) => b.startTime - a.startTime)
                .slice(0, 10)
                .map((execution) => (
                  <div key={execution.executionId} className={`execution-card ${execution.status}`}>
                    <div className="execution-header">
                      <div className="execution-info">
                        <strong>{execution.executionId}</strong>
                        <span className="agent-name">{execution.metadata?.agentId || 'unknown'}</span>
                      </div>
                      <div className="execution-status">
                        {getStatusIcon(execution.status)} {execution.status}
                      </div>
                    </div>
                    
                    <div className="execution-footer">
                      <span className="execution-duration">
                        {formatDuration(execution.startTime)}
                      </span>
                      <button
                        onClick={() => openExecutionMonitor(execution.executionId)}
                        className="monitor-button"
                      >
                        📊 Monitor
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .execution-launcher {
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
          margin: 0;
        }

        .error-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px;
          border-radius: 6px;
          margin: 20px 0;
        }

        .launcher-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-top: 32px;
        }

        .launch-section, .executions-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
        }

        .launch-section h2, .executions-section h2 {
          margin: 0 0 20px 0;
          color: #111827;
          font-size: 18px;
        }

        .executions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .executions-header h2 {
          margin: 0;
        }

        .clear-button {
          background: #dc2626;
          color: white;
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .clear-button:hover:not(:disabled) {
          background: #b91c1c;
        }

        .clear-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .form-grid {
          display: grid;
          gap: 16px;
          margin-bottom: 24px;
        }

        .form-field label {
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
          color: #374151;
        }

        .form-select, .form-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
        }

        .form-select:focus, .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .launch-button {
          width: 100%;
          background: #2563eb;
          color: white;
          padding: 16px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .launch-button:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-2px);
        }

        .launch-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
        }

        .empty-executions {
          text-align: center;
          color: #6b7280;
          font-style: italic;
          padding: 40px 20px;
        }

        .executions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .execution-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
        }

        .execution-card.running {
          background: #eff6ff;
          border-color: #93c5fd;
        }

        .execution-card.completed {
          background: #f0fdf4;
          border-color: #86efac;
        }

        .execution-card.failed {
          background: #fef2f2;
          border-color: #fca5a5;
        }

        .execution-card.paused {
          background: #fff7ed;
          border-color: #fdba74;
        }

        .execution-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .execution-info strong {
          display: block;
          color: #111827;
          font-size: 14px;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .agent-name {
          color: #6b7280;
          font-size: 12px;
        }

        .execution-status {
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .execution-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .execution-duration {
          color: #6b7280;
          font-size: 12px;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .monitor-button {
          background: #059669;
          color: white;
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
        }

        .monitor-button:hover {
          background: #047857;
        }

        @media (max-width: 768px) {
          .launcher-content {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }
      `}</style>
    </div>
  );
}