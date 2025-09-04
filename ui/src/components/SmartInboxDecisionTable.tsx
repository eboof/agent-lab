// ui/src/components/SmartInboxDecisionTable.tsx
// React component for Smart Inbox decision making interface

import React, { useState } from 'react';

interface Email {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  classification: string;
  recommend?: string;
}

interface SmartInboxDecisionTableProps {
  emails: Email[];
  onSubmit: (decisions: Record<string, string>) => void;
  loading?: boolean;
}

const SmartInboxDecisionTable: React.FC<SmartInboxDecisionTableProps> = ({ 
  emails, 
  onSubmit, 
  loading = false 
}) => {
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

  const getDecisionCount = () => {
    return Object.values(decisions).filter(action => action !== "keep").length;
  };

  return (
    <div className="smart-inbox-decision-table">
      <div className="table-header">
        <h3>📧 Smart Inbox Decisions</h3>
        <p className="table-subtitle">
          {emails.length} emails found • {getDecisionCount()} actions selected
        </p>
      </div>

      <div className="emails-table">
        {emails.map((email) => (
          <div key={email.id} className="email-row">
            <div className="email-content">
              <div className="email-subject">
                <strong>{email.subject}</strong>
              </div>
              <div className="email-from">
                From: {email.from}
              </div>
              <div className="email-snippet">
                {email.snippet}
              </div>
              <div className="email-classification">
                <span className={`classification-badge ${email.classification.toLowerCase()}`}>
                  {email.classification}
                </span>
                {email.recommend && (
                  <span className="recommendation">
                    Recommended: {email.recommend}
                  </span>
                )}
              </div>
            </div>
            
            <div className="email-action">
              <label htmlFor={`action-${email.id}`}>Action:</label>
              <select
                id={`action-${email.id}`}
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

      <div className="table-footer">
        <button
          onClick={applyDecisions}
          disabled={loading || getDecisionCount() === 0}
          className="apply-decisions-btn"
        >
          {loading ? "🔄 Applying..." : `🚀 Apply ${getDecisionCount()} Decision(s)`}
        </button>
      </div>

      <style jsx>{`
        .smart-inbox-decision-table {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          margin-top: 20px;
        }

        .table-header h3 {
          margin-top: 0;
          margin-bottom: 4px;
          color: #1f2937;
        }

        .table-subtitle {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .emails-table {
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

        .email-subject {
          font-size: 16px;
          margin-bottom: 6px;
          color: #1f2937;
        }

        .email-from {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 6px;
        }

        .email-snippet {
          font-size: 14px;
          color: #374151;
          margin-bottom: 8px;
          line-height: 1.4;
        }

        .email-classification {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .classification-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .classification-badge.important {
          background: #fef3c7;
          color: #92400e;
        }

        .classification-badge.promotions {
          background: #dbeafe;
          color: #1e40af;
        }

        .classification-badge.social {
          background: #ecfdf5;
          color: #065f46;
        }

        .classification-badge.updates {
          background: #f3e8ff;
          color: #7c3aed;
        }

        .classification-badge.spam {
          background: #fee2e2;
          color: #dc2626;
        }

        .recommendation {
          font-size: 12px;
          color: #059669;
          background: #ecfdf5;
          padding: 2px 6px;
          border-radius: 6px;
        }

        .email-action {
          flex-shrink: 0;
          width: 180px;
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
          padding: 8px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          background: white;
        }

        .action-select:disabled {
          background: #f9fafb;
          color: #9ca3af;
        }

        .table-footer {
          text-align: center;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
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
      `}</style>
    </div>
  );
};

export default SmartInboxDecisionTable;