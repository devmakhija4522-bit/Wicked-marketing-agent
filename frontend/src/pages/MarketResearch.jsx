import { useState } from 'react';
import { api } from '../utils/api.js';
import { useClient } from '../context/ClientContext.jsx';
import './MarketResearch.css';

export default function MarketResearch() {
  const { currentClient } = useClient();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [researchData, setResearchData] = useState(null);
  const [error, setError] = useState(null);

  const handleResearch = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.marketResearch(
        topic,
        currentClient?.id || 'generic'
      );
      setResearchData(res);
    } catch (err) {
      setError(err.message || 'Failed to complete market research.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="market-research-container">
      <header className="page-header">
        <div>
          <span className="badge-chip">AUDIENCE & COMPETITOR INTELLIGENCE</span>
          <h2>🕵️‍♂️ Market Research Detective</h2>
          <p className="subtitle">Discover customer pain points, viral hooks, objections, and competitor gaps.</p>
        </div>
      </header>

      <div className="research-grid">
        <form className="research-card input-card" onSubmit={handleResearch}>
          <h3>Research Target</h3>
          <div className="form-group">
            <label>Niche, Product, or Keyword</label>
            <input
              type="text"
              placeholder="e.g. Refurbished iPhones, AI copywriting software, Eco-friendly sneakers..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Mining Audience Insights...' : '🔎 Run Detective Audit'}
          </button>
          {error && <div className="error-alert">⚠️ {error}</div>}
        </form>

        <div className="research-card result-card">
          {!researchData && !loading && (
            <div className="empty-state">
              <span className="empty-icon">💡</span>
              <h4>No Research Loaded</h4>
              <p>Type a topic or niche on the left to extract audience pain points and market intelligence.</p>
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Extracting customer complaints, viral hooks, and objection patterns...</p>
            </div>
          )}

          {researchData && !loading && (
            <div className="research-results">
              <div className="persona-card">
                <h4>🎯 Target Persona Profile</h4>
                <p><strong>Demographic:</strong> {researchData.target_persona?.primary_demographic}</p>
                <p><strong>Core Desire:</strong> {researchData.target_persona?.core_desire}</p>
                <p><strong>Biggest Fear:</strong> {researchData.target_persona?.biggest_fear}</p>
              </div>

              <div className="pain-points-block">
                <h4>🔥 Top Customer Pain Points</h4>
                <div className="points-list">
                  {researchData.top_pain_points?.map((pt, i) => (
                    <div key={i} className="point-item">
                      <span className="severity-badge">{pt.severity}</span>
                      <div>
                        <strong>{pt.point}</strong>
                        <p className="quote">"{pt.customer_quote}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hooks-block">
                <h4>⚡ Viral Hooks Working Now</h4>
                <ul>
                  {researchData.viral_hooks_working_now?.map((hook, i) => (
                    <li key={i}>"{hook}"</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
