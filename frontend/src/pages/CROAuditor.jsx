import { useState } from 'react';
import { api } from '../utils/api.js';
import { useClient } from '../context/ClientContext.jsx';
import './CROAuditor.css';

export default function CROAuditor() {
  const { currentClient } = useClient();
  const [pageContent, setPageContent] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAudit = async (e) => {
    e.preventDefault();
    if (!pageContent.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.croAudit(
        pageContent,
        targetAudience,
        currentClient?.id || 'generic'
      );
      setAuditResult(res);
    } catch (err) {
      setError(err.message || 'Failed to run CRO Audit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cro-auditor-container">
      <header className="page-header">
        <div>
          <span className="badge-chip">CONVERSION RATE OPTIMIZATION</span>
          <h2>🎯 Landing Page CRO Auditor</h2>
          <p className="subtitle">Audit your page copy, eliminate friction, and unlock higher sales conversions.</p>
        </div>
      </header>

      <div className="cro-grid">
        <form className="cro-card input-card" onSubmit={handleAudit}>
          <h3>Audit Input</h3>
          <div className="form-group">
            <label>Target Audience (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Busy founders, E-commerce shoppers, B2B SaaS buyers..."
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Landing Page / Hero Copy</label>
            <textarea
              rows={8}
              placeholder="Paste headline, subheadline, call-to-action, or full sales page copy here..."
              value={pageContent}
              onChange={(e) => setPageContent(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Analyzing Conversion Friction...' : '⚡ Run Instant CRO Audit'}
          </button>
          {error && <div className="error-alert">⚠️ {error}</div>}
        </form>

        <div className="cro-card result-card">
          {!auditResult && !loading && (
            <div className="empty-state">
              <span className="empty-icon">📊</span>
              <h4>No Audit Run Yet</h4>
              <p>Paste landing page content on the left to see instant scores and high-converting rewrites.</p>
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Scanning value propositions, CTA friction, and trust triggers...</p>
            </div>
          )}

          {auditResult && !loading && (
            <div className="audit-results">
              <div className="score-hero">
                <div className="overall-badge">
                  <span className="score-num">{auditResult.overall_score || 75}</span>
                  <span className="score-label">CRO Score</span>
                </div>
                <div className="sub-scores-grid">
                  <div className="sub-score-item">
                    <span>Headline Clarity</span>
                    <strong>{auditResult.scores?.headline_clarity || 70}%</strong>
                  </div>
                  <div className="sub-score-item">
                    <span>Value Prop</span>
                    <strong>{auditResult.scores?.value_prop_strength || 80}%</strong>
                  </div>
                  <div className="sub-score-item">
                    <span>CTA Friction</span>
                    <strong>{auditResult.scores?.cta_friction || 65}%</strong>
                  </div>
                  <div className="sub-score-item">
                    <span>Trust Signals</span>
                    <strong>{auditResult.scores?.trust_signals || 60}%</strong>
                  </div>
                </div>
              </div>

              <div className="insights-block">
                <h4>⚠️ Friction & Conversion Killers</h4>
                <ul>
                  {auditResult.friction_points?.map((fp, idx) => (
                    <li key={idx}>{fp}</li>
                  ))}
                </ul>
              </div>

              <div className="rewrites-block">
                <h4>🔥 High-Converting Rewrites</h4>
                <div className="variations-list">
                  {auditResult.rewrites?.headline_variations?.map((h, i) => (
                    <div key={i} className="variation-card">
                      <span className="var-badge">{h.style}</span>
                      <p>"{h.text}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
