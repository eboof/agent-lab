// ui/src/pages/execution/ExecutionLogs.tsx
import React from 'react';

interface LogEntry {
  timestamp: number;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  agentId?: string;
  data?: any;
}

interface ExecutionLogsProps {
  logs: LogEntry[];
}

export default function ExecutionLogs({ logs }: ExecutionLogsProps) {
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'info': return 'ℹ️';
      case 'warn': return '⚠️';
      case 'error': return '❌';
      case 'debug': return '🔍';
      default: return '📝';
    }
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'info': return 'text-blue-300';
      case 'warn': return 'text-yellow-300';
      case 'error': return 'text-red-300';
      case 'debug': return 'text-gray-400';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="execution-logs">
      <div className="logs-header">
        <h3>📜 Execution Logs</h3>
        <span className="log-count">{logs.length} entries</span>
      </div>
      
      <div className="logs-container">
        {logs.length === 0 ? (
          <div className="empty-logs">
            <span>No logs yet...</span>
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={`log-entry ${log.level}`}>
              <span className="log-timestamp">{formatTimestamp(log.timestamp)}</span>
              <span className={`log-level ${getLevelColor(log.level)}`}>
                {getLevelIcon(log.level)} {log.level.toUpperCase()}
              </span>
              {log.agentId && (
                <span className="log-agent">[{log.agentId}]</span>
              )}
              <span className="log-message">{log.message}</span>
              {log.data && (
                <details className="log-data">
                  <summary>Data</summary>
                  <pre>{JSON.stringify(log.data, null, 2)}</pre>
                </details>
              )}
            </div>
          ))
        )}
      </div>

      <style>{`
        .execution-logs {
          height: 100%;
          background: #1a1a1a;
          color: #e5e5e5;
          display: flex;
          flex-direction: column;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .logs-header {
          padding: 12px 16px;
          background: #2a2a2a;
          border-bottom: 1px solid #404040;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logs-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
        }

        .log-count {
          font-size: 12px;
          color: #999;
        }

        .logs-container {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }

        .empty-logs {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100px;
          color: #666;
          font-style: italic;
        }

        .log-entry {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 4px 8px;
          border-radius: 4px;
          margin-bottom: 2px;
          font-size: 12px;
          line-height: 1.4;
        }

        .log-entry:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .log-entry.error {
          background: rgba(239, 68, 68, 0.1);
        }

        .log-entry.warn {
          background: rgba(245, 158, 11, 0.1);
        }

        .log-timestamp {
          color: #999;
          font-size: 11px;
          flex-shrink: 0;
          width: 80px;
        }

        .log-level {
          flex-shrink: 0;
          font-weight: 500;
          width: 70px;
        }

        .log-agent {
          color: #8b5cf6;
          font-weight: 500;
          flex-shrink: 0;
        }

        .log-message {
          flex: 1;
          word-break: break-word;
        }

        .log-data {
          margin-top: 4px;
          width: 100%;
        }

        .log-data summary {
          cursor: pointer;
          color: #60a5fa;
          font-size: 11px;
        }

        .log-data pre {
          background: rgba(0, 0, 0, 0.3);
          padding: 8px;
          border-radius: 4px;
          margin-top: 4px;
          overflow-x: auto;
          font-size: 11px;
          color: #d1d5db;
        }

        /* Scrollbar styling */
        .logs-container::-webkit-scrollbar {
          width: 6px;
        }

        .logs-container::-webkit-scrollbar-track {
          background: #2a2a2a;
        }

        .logs-container::-webkit-scrollbar-thumb {
          background: #555;
          border-radius: 3px;
        }

        .logs-container::-webkit-scrollbar-thumb:hover {
          background: #777;
        }
      `}</style>
    </div>
  );
}