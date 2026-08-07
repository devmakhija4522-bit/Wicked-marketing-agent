import { useState } from 'react';
import { api } from '../utils/api.js';
import { useClient } from '../context/ClientContext.jsx';
import './CampaignPlanner.css';

export default function CampaignPlanner() {
  const { currentClient } = useClient();
  const [goal, setGoal] = useState('');
  const [duration, setDuration] = useState(14);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!goal.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.campaignPlan(
        goal,
        duration,
        ['LinkedIn', 'Instagram', 'X/Twitter', 'Email'],
        currentClient?.id || 'generic'
      );
      setPlan(res);
    } catch (err) {
      setError(err.message || 'Failed to generate campaign plan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="campaign-planner-container">
      <header className="page-header">
        <div>
          <span className="badge-chip">MULTI-CHANNEL STRATEGY</span>
          <h2>🎈 Campaign Planner</h2>
          <p className="subtitle">Build cohesive, multi-week launch sequences across all your social & email channels.</p>
        </div>
      </header>

      <div className="planner-grid">
        <form className="planner-card input-card" onSubmit={handleGenerate}>
          <h3>Campaign Objectives</h3>
          <div className="form-group">
            <label>Campaign Goal / Product Launch</label>
            <textarea
              rows={4}
              placeholder="e.g., Launching a new refurbished iPhone 15 sale campaign with a 15% discount for 2 weeks..."
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Duration (Days)</label>
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
              <option value={7}>7 Days (Sprint)</option>
              <option value={14}>14 Days (Standard Launch)</option>
              <option value={30}>30 Days (Full Growth Push)</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Designing Campaign Blueprint...' : '🚀 Generate Campaign Blueprint'}
          </button>
          {error && <div className="error-alert">⚠️ {error}</div>}
        </form>

        <div className="planner-card result-card">
          {!plan && !loading && (
            <div className="empty-state">
              <span className="empty-icon">📅</span>
              <h4>No Campaign Generated</h4>
              <p>Enter your campaign launch goal on the left to build a full multi-week timeline.</p>
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Mapping phases, social posts, and email sequences...</p>
            </div>
          )}

          {plan && !loading && (
            <div className="plan-results">
              <div className="campaign-hero">
                <h3>{plan.campaign_name || 'Multi-Channel Launch'}</h3>
                <p className="tagline">"{plan.tagline}"</p>
              </div>

              <div className="phases-container">
                <h4>Phase Roadmap</h4>
                <div className="phases-grid">
                  {plan.phases?.map((ph, idx) => (
                    <div key={idx} className="phase-card">
                      <span className="phase-days">{ph.days}</span>
                      <h5>{ph.phase_name}</h5>
                      <p>{ph.focus}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="schedule-container">
                <h4>Content Schedule</h4>
                <div className="schedule-list">
                  {plan.schedule?.map((item, idx) => (
                    <div key={idx} className="schedule-item">
                      <div className="day-badge">Day {item.day}</div>
                      <div className="schedule-details">
                        <div className="schedule-meta">
                          <span className="channel-pill">{item.channel}</span>
                          <span className="type-pill">{item.content_type}</span>
                        </div>
                        <p className="hook-text"><strong>Hook:</strong> "{item.hook}"</p>
                      </div>
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
