import { useState } from 'react';
import { api } from '../utils/api.js';
import { useClient } from '../context/ClientContext.jsx';
import './CopyPolisher.css';

export default function CopyPolisher() {
  const { currentClient } = useClient();
  const [text, setText] = useState('');
  const [mode, setMode] = useState('punchy');
  const [loading, setLoading] = useState(false);
  const [polishedData, setPolishedData] = useState(null);
  const [error, setError] = useState(null);

  const handlePolish = async (selectedMode) => {
    if (!text.trim()) return;
    const activeMode = selectedMode || mode;
    setLoading(true);
    setError(null);
    try {
      const res = await api.copyPolish(
        text,
        activeMode,
        currentClient?.id || 'generic'
      );
      setPolishedData(res);
    } catch (err) {
      setError(err.message || 'Failed to polish copy.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="copy-polisher-container">
      <header className="page-header">
        <div>
          <span className="badge-chip">INSTANT COPY ENHANCER</span>
          <h2>✏️ Copy & UX Polish Teacher</h2>
          <p className="subtitle">Transform boring copy into punchy, high-converting messaging with one click.</p>
        </div>
      </header>

      <div className="polisher-grid">
        <div className="polisher-card input-card">
          <h3>Input Marketing Draft</h3>
          <div className="form-group">
            <textarea
              rows={8}
              placeholder="Paste your ad copy, social post, email headline, or CTA button text..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="action-buttons">
            <button
              className="btn-mode"
              onClick={() => { setMode('punchy'); handlePolish('punchy'); }}
              disabled={loading}
            >
              💥 Make Punchy
            </button>
            <button
              className="btn-mode"
              onClick={() => { setMode('urgency'); handlePolish('urgency'); }}
              disabled={loading}
            >
              🔥 Add Urgency
            </button>
            <button
              className="btn-mode"
              onClick={() => { setMode('simplified'); handlePolish('simplified'); }}
              disabled={loading}
            >
              👶 Simplify Text
            </button>
            <button
              className="btn-mode"
              onClick={() => { setMode('premium'); handlePolish('premium'); }}
              disabled={loading}
            >
              👑 Make Premium
            </button>
          </div>
          {error && <div className="error-alert">⚠️ {error}</div>}
        </div>

        <div className="polisher-card result-card">
          {!polishedData && !loading && (
            <div className="empty-state">
              <span className="empty-icon">✨</span>
              <h4>No Copy Polished</h4>
              <p>Type copy on the left and click any enhancement button to see instant variations.</p>
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Polishing readability, punchiness, and emotional impact...</p>
            </div>
          )}

          {polishedData && !loading && (
            <div className="polished-results">
              <div className="scores-row">
                <div className="metric-box">
                  <span>Punchiness</span>
                  <strong>{polishedData.punchiness_score || 85}%</strong>
                </div>
                <div className="metric-box">
                  <span>Persuasion</span>
                  <strong>{polishedData.persuasion_score || 90}%</strong>
                </div>
                <div className="metric-box">
                  <span>Readability</span>
                  <strong>{polishedData.readability_score || 92}%</strong>
                </div>
              </div>

              <div className="rewrites-grid">
                <div className="rewrite-card active-mode">
                  <h4>💥 Punchy Version</h4>
                  <p>"{polishedData.rewrites?.punchy}"</p>
                </div>
                <div className="rewrite-card">
                  <h4>🔥 High Urgency</h4>
                  <p>"{polishedData.rewrites?.urgency}"</p>
                </div>
                <div className="rewrite-card">
                  <h4>👶 Super Simplified</h4>
                  <p>"{polishedData.rewrites?.simplified}"</p>
                </div>
                <div className="rewrite-card">
                  <h4>👑 Premium & Elite</h4>
                  <p>"{polishedData.rewrites?.premium}"</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
