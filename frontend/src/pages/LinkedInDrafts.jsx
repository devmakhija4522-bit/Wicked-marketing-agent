import { useState } from 'react';
import { api } from '../utils/api.js';
import './LinkedInDrafts.css';

export default function LinkedInDrafts() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [frequency, setFrequency] = useState('2');

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await api.generateLinkedInDrafts(3);
      if (data) setDrafts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="linkedin-page">
      <div className="page-header">
        <div className="linkedin-header-row">
          <div>
            <h1><span className="gradient-text">LinkedIn</span> Drafts</h1>
            <p>Automated B2B/B2C content drafted from the latest Apple News.</p>
          </div>
          <div className="linkedin-controls">
            <div className="frequency-selector">
              <label>Run Frequency (per week):</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="4">4</option>
                <option value="7">Everyday</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
              {loading ? <span className="btn-spinner" /> : '✨'} Fetch News & Draft
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="drafts-loading">
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text" />
        </div>
      )}

      {!loading && drafts.length > 0 && (
        <div className="drafts-grid">
          {drafts.map((draft, i) => (
            <div key={i} className="draft-card glass">
              <div className="draft-meta">
                <span className="badge badge-crimson">Apple News</span>
                <a href={draft.source_url} target="_blank" rel="noreferrer" className="source-link">
                  {draft.news_title}
                </a>
              </div>
              <div className="draft-content">
                <p>{draft.draft_text}</p>
              </div>
              <div className="draft-footer">
                <div className="hashtags">
                  {draft.suggested_hashtags.map((tag, j) => (
                    <span key={j} className="hashtag">#{tag}</span>
                  ))}
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => handleCopy(draft.draft_text)}>
                  📋 Copy
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && drafts.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon">💼</span>
          <h3>No Drafts Yet</h3>
          <p>Click "Fetch News & Draft" to pull the latest Apple news and generate LinkedIn posts.</p>
        </div>
      )}
    </div>
  );
}
