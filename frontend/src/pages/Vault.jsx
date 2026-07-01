import { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import './Vault.css';

export default function Vault() {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedScript, setExpandedScript] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getVaultHistory();
      setScripts(data.history || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="vault-container">
        <header className="vault-header">
          <h1>Script Vault</h1>
          <p>Loading your past generations...</p>
        </header>
        <div className="shimmer-card vault-shimmer"></div>
        <div className="shimmer-card vault-shimmer"></div>
      </div>
    );
  }

  return (
    <div className="vault-container">
      <header className="vault-header">
        <h1>Script Vault</h1>
        <p>Review and export your previously generated WICKED scripts.</p>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {scripts.length === 0 && !loading && !error && (
        <div className="empty-state">
          <h2>No scripts yet</h2>
          <p>Head over to the Content Lab to generate your first script.</p>
        </div>
      )}

      <div className="vault-list">
        {scripts.map((script, idx) => (
          <div key={idx} className={`vault-item glass-panel ${expandedScript === idx ? 'expanded' : ''}`}>
            <div className="vault-item-header" onClick={() => setExpandedScript(expandedScript === idx ? null : idx)}>
              <div className="vault-item-title">
                <h3>{script.title || `Generated Script #${scripts.length - idx}`}</h3>
                <span className="date-tag">{new Date(script.created_at || Date.now()).toLocaleDateString()}</span>
              </div>
              <div className="vault-item-badges">
                {script.brand_score && (
                  <span className={`score-badge ${script.brand_score >= 80 ? 'high' : script.brand_score >= 50 ? 'medium' : 'low'}`}>
                    Brand Score: {script.brand_score}/100
                  </span>
                )}
                <button className="btn-icon">
                  {expandedScript === idx ? '▲' : '▼'}
                </button>
              </div>
            </div>

            {expandedScript === idx && script.content && (
              <div className="vault-item-content">
                <div className="script-body whitespace-pre-wrap">
                  {script.content}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
