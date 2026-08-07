import { useState } from 'react';
import { api } from '../utils/api.js';
import { useClient } from '../context/ClientContext.jsx';
import './BrandVoiceManager.css';

export default function BrandVoiceManager() {
  const { currentClient } = useClient();
  const [draft, setDraft] = useState('');
  const [channel, setChannel] = useState('Instagram');
  const [loading, setLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);
  const [error, setError] = useState(null);

  const handleReview = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.ccoReview(
        draft,
        channel,
        currentClient?.id || 'generic'
      );
      setReviewResult(res);
    } catch (err) {
      setError(err.message || 'Failed to complete CCO review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="brand-voice-container">
      <header className="page-header">
        <div>
          <span className="badge-chip">EDITORIAL GOVERNANCE</span>
          <h2>👮‍♂️ Chief Content Officer (Voice Boss)</h2>
          <p className="subtitle">Ensure 100% brand voice alignment and optimal content ratio balance before posting.</p>
        </div>
      </header>

      <div className="voice-grid">
        <form className="voice-card input-card" onSubmit={handleReview}>
          <h3>Content Review Queue</h3>
          <div className="form-group">
            <label>Target Channel</label>
            <select value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="Instagram">Instagram Reel / Post</option>
              <option value="LinkedIn">LinkedIn Thought Leadership</option>
              <option value="X/Twitter">X / Twitter Thread</option>
              <option value="Email">Email Broadcast</option>
            </select>
          </div>

          <div className="form-group">
            <label>Draft Content to Audit</label>
            <textarea
              rows={8}
              placeholder="Paste your draft script, post, or article for CCO editorial sign-off..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'CCO Reviewing Content...' : '🛡️ Request CCO Sign-Off'}
          </button>
          {error && <div className="error-alert">⚠️ {error}</div>}
        </form>

        <div className="voice-card result-card">
          {!reviewResult && !loading && (
            <div className="empty-state">
              <span className="empty-icon">👮‍♂️</span>
              <h4>No Draft Reviewed</h4>
              <p>Submit draft content on the left to get a Chief Content Officer verdict and approved revision.</p>
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Checking brand voice compliance, ratio balance, and tone alignment...</p>
            </div>
          )}

          {reviewResult && !loading && (
            <div className="review-results">
              <div className={`verdict-banner ${reviewResult.approved ? 'approved' : 'edits-needed'}`}>
                <span className="verdict-icon">{reviewResult.approved ? '✅' : '⚠️'}</span>
                <div>
                  <h4>{reviewResult.approved ? 'APPROVED BY CCO' : 'REVISIONS REQUIRED'}</h4>
                  <p>{reviewResult.cco_verdict}</p>
                </div>
              </div>

              <div className="metrics-grid">
                <div className="metric-card">
                  <span>Brand Alignment</span>
                  <strong>{reviewResult.brand_voice_alignment || 90}%</strong>
                </div>
                <div className="metric-card">
                  <span>Content Category</span>
                  <strong>{reviewResult.content_category || 'Educational'}</strong>
                </div>
              </div>

              <div className="edits-block">
                <h4>✏️ Required Edits</h4>
                <ul>
                  {reviewResult.required_edits?.map((edit, idx) => (
                    <li key={idx}>{edit}</li>
                  ))}
                </ul>
              </div>

              <div className="approved-copy-block">
                <h4>✨ CCO Approved Revision</h4>
                <div className="copy-box">
                  "{reviewResult.cco_approved_revision || reviewResult.draft}"
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
