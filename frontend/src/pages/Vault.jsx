import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClient } from '../context/ClientContext.jsx';
import { api } from '../utils/api.js';
import './Vault.css';

function VaultContent({ content }) {
  if (typeof content === 'string') {
    return <div className="script-body whitespace-pre-wrap">{content}</div>;
  }

  if (content && typeof content === 'object' && content.script) {
    const { keyword, structure, script } = content;
    return (
      <div className="vault-bundle">
        {keyword && (
          <div className="vault-bundle-section">
            <h4>🔑 Keyword</h4>
            <p>{keyword.phrase}</p>
          </div>
        )}
        {structure && (
          <div className="vault-bundle-section">
            <h4>🧱 Structure</h4>
            <p className="vault-bundle-hook">{structure.hook_direction}</p>
            {structure.beat_outline && (
              <ul>
                {structure.beat_outline.map((beat, i) => <li key={i}>{beat}</li>)}
              </ul>
            )}
          </div>
        )}
        <div className="vault-bundle-section">
          <h4>✍️ Script</h4>
          <div className="script-body whitespace-pre-wrap">{script.full_script_text || 'No script text.'}</div>
          {script.caption_suggestion && (
            <p className="vault-bundle-caption"><strong>Caption:</strong> {script.caption_suggestion}</p>
          )}
        </div>
      </div>
    );
  }

  return <div className="script-body whitespace-pre-wrap">{JSON.stringify(content, null, 2)}</div>;
}

export default function Vault() {
  const navigate = useNavigate();
  const { activeClient } = useClient();
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
        <button
          className="btn btn-sm btn-secondary"
          onClick={() => navigate(activeClient ? `/gmm/${activeClient.id}` : '/clients')}
          style={{ marginBottom: '1rem' }}
        >
          ← Back
        </button>
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
                <VaultContent content={script.content} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
