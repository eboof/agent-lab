// ui/src/pages/agents/AgentLibrary.tsx  
// Browse, edit, and manage existing agents

import React, { useState, useEffect } from 'react';

interface Agent {
  id: string;
  file: string;
}

interface AgentDetails {
  id: string;
  name: string;
  role: string;
  model: string;
  tools: string[];
  metadata?: {
    version: string;
    author: string;
    created: string;
    description: string;
    tags: string[];
    category: string;
  };
}

const AgentLibrary: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentDetails, setAgentDetails] = useState<Record<string, AgentDetails>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/agents/list');
      const data = await response.json();
      setAgents(data);
      
      // Load details for each agent
      const details: Record<string, AgentDetails> = {};
      for (const agent of data) {
        try {
          const detailResponse = await fetch(`http://localhost:3001/api/agents/load/${agent.id}`);
          if (detailResponse.ok) {
            const detailData = await detailResponse.json();
            const yaml = await import('js-yaml');
            const config = yaml.load(detailData.content) as any;
            details[agent.id] = config;
          }
        } catch (err) {
          console.error(`Failed to load details for ${agent.id}:`, err);
        }
      }
      setAgentDetails(details);
      
    } catch (err: any) {
      setError(`Failed to load agents: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteAgent = async (agentId: string) => {
    if (!confirm(`Are you sure you want to delete agent "${agentId}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3001/api/agents/delete/${agentId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete agent');
      }
      
      // Refresh list
      await fetchAgents();
      
    } catch (err: any) {
      setError(`Failed to delete agent: ${err.message}`);
    }
  };

  const editAgent = (agentId: string) => {
    // Navigate to BuildAgent with this agent loaded
    window.location.hash = `#/agents/build?edit=${agentId}`;
  };

  const runAgent = (agentId: string) => {
    // Navigate to RunAgents with this agent selected
    window.location.hash = `#/agents/run?agent=${agentId}`;
  };

  const getCategories = () => {
    const categories = new Set<string>();
    Object.values(agentDetails).forEach(agent => {
      if (agent.metadata?.category) {
        categories.add(agent.metadata.category);
      }
    });
    return ["all", ...Array.from(categories).sort()];
  };

  const getFilteredAgents = () => {
    return agents.filter(agent => {
      const details = agentDetails[agent.id];
      if (!details) return true;
      
      // Category filter
      if (selectedCategory !== "all" && details.metadata?.category !== selectedCategory) {
        return false;
      }
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          details.name.toLowerCase().includes(searchLower) ||
          details.role.toLowerCase().includes(searchLower) ||
          details.metadata?.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      
      return true;
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="agent-library-page">
        <div className="loading">🔄 Loading agents...</div>
      </div>
    );
  }

  const filteredAgents = getFilteredAgents();
  const categories = getCategories();

  return (
    <div className="agent-library-page">
      <div className="page-header">
        <h1>📚 Agent Library</h1>
        <p>Browse, edit, and manage your agents</p>
      </div>

      {error && (
        <div className="error-banner">
          ❌ {error}
        </div>
      )}

      <div className="library-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="category-filter">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === "all" ? "All Categories" : category}
              </option>
            ))}
          </select>
        </div>
        
        <button
          onClick={() => window.location.hash = "#/agents/build"}
          className="new-agent-button"
        >
          ➕ New Agent
        </button>
      </div>

      <div className="agents-grid">
        {filteredAgents.length === 0 ? (
          <div className="empty-state">
            <h3>No agents found</h3>
            <p>
              {searchTerm || selectedCategory !== "all" 
                ? "Try adjusting your search or filter"
                : "Create your first agent to get started"
              }
            </p>
            <button
              onClick={() => window.location.hash = "#/agents/build"}
              className="create-first-button"
            >
              🔧 Create Agent
            </button>
          </div>
        ) : (
          filteredAgents.map(agent => {
            const details = agentDetails[agent.id];
            return (
              <div key={agent.id} className="agent-card">
                <div className="agent-header">
                  <h3>{details?.name || agent.id}</h3>
                  <div className="agent-actions">
                    <button
                      onClick={() => runAgent(agent.id)}
                      className="action-button run"
                      title="Run agent"
                    >
                      ▶️
                    </button>
                    <button
                      onClick={() => editAgent(agent.id)}
                      className="action-button edit"
                      title="Edit agent"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteAgent(agent.id)}
                      className="action-button delete"
                      title="Delete agent"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                {details && (
                  <>
                    <p className="agent-role">{details.role}</p>
                    
                    <div className="agent-meta">
                      <div className="meta-row">
                        <span className="meta-label">Model:</span>
                        <span className="meta-value">{details.model}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">Tools:</span>
                        <span className="meta-value">{details.tools.length} tools</span>
                      </div>
                      {details.metadata?.created && (
                        <div className="meta-row">
                          <span className="meta-label">Created:</span>
                          <span className="meta-value">{formatDate(details.metadata.created)}</span>
                        </div>
                      )}
                    </div>
                    
                    {details.metadata?.tags && details.metadata.tags.length > 0 && (
                      <div className="agent-tags">
                        {details.metadata.tags.map(tag => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </>
                )}
                
                {!details && (
                  <p className="loading-details">Loading details...</p>
                )}
              </div>
            );
          })
        )}
      </div>

      <style jsx>{`
        .agent-library-page {
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

        .loading {
          text-align: center;
          padding: 40px;
          color: #6b7280;
        }

        .library-controls {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          align-items: center;
        }

        .search-bar {
          flex: 1;
        }

        .search-bar input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }

        .category-filter select {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
        }

        .new-agent-button {
          background: #10b981;
          color: white;
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }

        .agents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .create-first-button {
          background: #2563eb;
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 16px;
        }

        .agent-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          transition: all 0.2s;
        }

        .agent-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .agent-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .agent-header h3 {
          margin: 0;
          color: #111827;
          font-size: 18px;
        }

        .agent-actions {
          display: flex;
          gap: 8px;
        }

        .action-button {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          padding: 6px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .action-button:hover {
          background: #e5e7eb;
        }

        .action-button.run:hover {
          background: #dbeafe;
          border-color: #3b82f6;
        }

        .action-button.edit:hover {
          background: #fef3c7;
          border-color: #f59e0b;
        }

        .action-button.delete:hover {
          background: #fee2e2;
          border-color: #ef4444;
        }

        .agent-role {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 16px;
          line-height: 1.4;
        }

        .agent-meta {
          margin-bottom: 12px;
        }

        .meta-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .meta-label {
          color: #6b7280;
        }

        .meta-value {
          color: #111827;
          font-weight: 500;
        }

        .agent-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .tag {
          background: #eff6ff;
          color: #1d4ed8;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .loading-details {
          color: #9ca3af;
          font-style: italic;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default AgentLibrary;