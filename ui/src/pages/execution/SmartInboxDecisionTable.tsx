// ui/src/pages/execution/SmartInboxDecisionTable.tsx
import React, { useState } from 'react';

interface Email {
  id: string;
  subject: string;
  from: string;
  snippet?: string;
  classification?: string;
}

interface SmartInboxDecisionTableProps {
  emails: Email[];
  onSubmit: (decisions: Record<string, string>) => void;
  loading?: boolean;
}

export default function SmartInboxDecisionTable({ emails, onSubmit, loading = false }: SmartInboxDecisionTableProps) {
  console.log('📊 SmartInboxDecisionTable rendering with:', { 
    emailCount: emails?.length || 0, 
    emails: emails, 
    loading 
  });
  
  const [decisions, setDecisions] = useState<Record<string, string>>({});

  const handleActionChange = (emailId: string, action: string) => {
    setDecisions(prev => ({ ...prev, [emailId]: action }));
  };

  const handleSubmit = () => {
    // Filter out "keep" decisions as they require no action
    const filteredDecisions = Object.fromEntries(
      Object.entries(decisions).filter(([_, action]) => action !== 'keep')
    );
    onSubmit(filteredDecisions);
  };

  const getClassificationColor = (classification: string | undefined) => {
    if (!classification) return 'bg-gray-100 text-gray-800';
    switch (classification.toLowerCase()) {
      case 'important': return 'bg-yellow-100 text-yellow-800';
      case 'promotions': return 'bg-blue-100 text-blue-800';
      case 'social': return 'bg-purple-100 text-purple-800';
      case 'updates': return 'bg-green-100 text-green-800';
      case 'spam': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'delete': return '🗑️';
      case 'label:STARRED': return '⭐';
      case 'label:IMPORTANT': return '❗';
      case 'label:CATEGORY_PROMOTIONS': return '📢';
      case 'label:CATEGORY_SOCIAL': return '👥';
      case 'label:CATEGORY_UPDATES': return '📝';
      case 'label:SPAM': return '🚫';
      default: return '📧';
    }
  };

  if (!emails || emails.length === 0) {
    return (
      <div className="decision-table-empty">
        <div className="empty-icon">📧</div>
        <h3>No emails to review</h3>
        <p>The agent didn't find any emails that need decisions.</p>
        
        <style>{`
          .decision-table-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            text-align: center;
            color: #6b7280;
          }
          .empty-icon {
            font-size: 48px;
            margin-bottom: 16px;
            opacity: 0.5;
          }
          .decision-table-empty h3 {
            margin: 0 0 8px 0;
            font-size: 18px;
            color: #374151;
          }
          .decision-table-empty p {
            margin: 0;
            font-size: 14px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="smart-inbox-decision-table">
      <div className="table-header">
        <h3>📧 Smart Inbox Decisions</h3>
        <p>Review and take action on {emails.length} email{emails.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="table-container">
        <table className="decision-table">
          <thead>
            <tr>
              <th>From</th>
              <th>Subject</th>
              <th>Classification</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {emails.map((email) => (
              <tr key={email.id}>
                <td className="from-cell">
                  <div className="from-address">{email.from}</div>
                </td>
                <td className="subject-cell">
                  <div className="subject-text">{email.subject}</div>
                  {email.snippet && (
                    <div className="snippet-text">{email.snippet}</div>
                  )}
                </td>
                <td className="classification-cell">
                  <span className={`classification-badge ${getClassificationColor(email.classification)}`}>
                    {email.classification || 'Unclassified'}
                  </span>
                </td>
                <td className="action-cell">
                  <select
                    value={decisions[email.id] || 'keep'}
                    onChange={(e) => handleActionChange(email.id, e.target.value)}
                    disabled={loading}
                    className="action-select"
                  >
                    <option value="keep">📧 Keep</option>
                    <option value="delete">🗑️ Delete</option>
                    <option value="label:STARRED">⭐ Star</option>
                    <option value="label:IMPORTANT">❗ Important</option>
                    <option value="label:CATEGORY_PROMOTIONS">📢 Promotions</option>
                    <option value="label:CATEGORY_SOCIAL">👥 Social</option>
                    <option value="label:CATEGORY_UPDATES">📝 Updates</option>
                    <option value="label:SPAM">🚫 Spam</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <div className="decision-summary">
          {Object.keys(decisions).length === 0 ? (
            <span>No actions selected</span>
          ) : (
            <span>
              {Object.keys(decisions).length} action{Object.keys(decisions).length !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading || Object.keys(decisions).length === 0}
          className="apply-button"
        >
          {loading ? (
            <>
              <span className="spinner">⏳</span>
              Applying...
            </>
          ) : (
            <>
              🚀 Apply Decisions
            </>
          )}
        </button>
      </div>

      <style>{`
        .smart-inbox-decision-table {
          background: white;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
          margin-top: 16px;
        }

        .table-header {
          padding: 20px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .table-header h3 {
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }

        .table-header p {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
        }

        .table-container {
          overflow-x: auto;
        }

        .decision-table {
          width: 100%;
          border-collapse: collapse;
        }

        .decision-table th {
          background: #f3f4f6;
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          font-size: 14px;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
        }

        .decision-table td {
          padding: 16px;
          border-bottom: 1px solid #f3f4f6;
          vertical-align: top;
        }

        .decision-table tr:hover {
          background: #f9fafb;
        }

        .from-cell {
          min-width: 200px;
        }

        .from-address {
          font-weight: 500;
          color: #374151;
          font-size: 14px;
        }

        .subject-cell {
          min-width: 300px;
        }

        .subject-text {
          font-weight: 500;
          color: #111827;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .snippet-text {
          color: #6b7280;
          font-size: 12px;
          line-height: 1.4;
          max-width: 400px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .classification-cell {
          min-width: 120px;
        }

        .classification-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .action-cell {
          min-width: 160px;
        }

        .action-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          background: white;
          cursor: pointer;
        }

        .action-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .action-select:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .table-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }

        .decision-summary {
          font-size: 14px;
          color: #6b7280;
        }

        .apply-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .apply-button:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .apply-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}