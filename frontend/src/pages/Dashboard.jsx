import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api.js';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalScripts: 0,
    trendsScanned: 0,
    avgBrandScore: 0,
    activePipelines: 0,
  });

  useEffect(() => {
    api.getStats()
      .then(data => {
        if (data) setStats(data);
      })
      .catch(() => {});


  }, []);





  return (
    <div className="dashboard">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            AI-Powered Marketing
          </div>
          <h1 className="hero-title">
            <span className="gradient-text">WICKED</span> Marketing Agent
          </h1>
          <p className="hero-subtitle">
            Your AI marketing command center.
          </p>

        </div>
        <div className="hero-visual">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-orb hero-orb-3" />
          <div className="hero-graphic">
            <div className="graphic-ring graphic-ring-1" />
            <div className="graphic-ring graphic-ring-2" />
            <div className="graphic-ring graphic-ring-3" />
            <div className="graphic-center">⚡</div>
          </div>
        </div>
      </section>


      {/* Stats Grid */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card" style={{ animationDelay: '0.1s' }}>
            <div className="stat-icon stat-icon-crimson">📝</div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalScripts}</span>
              <span className="stat-label">Total Scripts</span>
            </div>
            <div className="stat-trend stat-trend-up">+12%</div>
          </div>
          <div className="stat-card" style={{ animationDelay: '0.2s' }}>
            <div className="stat-icon stat-icon-purple">🔍</div>
            <div className="stat-info">
              <span className="stat-value">{stats.trendsScanned}</span>
              <span className="stat-label">Trends Scanned</span>
            </div>
            <div className="stat-trend stat-trend-up">+28%</div>
          </div>
          <div className="stat-card" style={{ animationDelay: '0.3s' }}>
            <div className="stat-icon stat-icon-blue">⭐</div>
            <div className="stat-info">
              <span className="stat-value">{stats.avgBrandScore}</span>
              <span className="stat-label">Avg Brand Score</span>
            </div>
            <div className="stat-trend stat-trend-up">+5%</div>
          </div>
          <div className="stat-card" style={{ animationDelay: '0.4s' }}>
            <div className="stat-icon stat-icon-green">🚀</div>
            <div className="stat-info">
              <span className="stat-value">{stats.activePipelines}</span>
              <span className="stat-label">Active Pipelines</span>
            </div>
            <div className="stat-trend">Idle</div>
          </div>
        </div>
      </section>



      {/* Quick Actions */}
      <section className="actions-section">
        <div className="section-header">
          <h2 className="section-title">Quick Actions</h2>
        </div>
        <div className="actions-grid">
          <button className="action-card" onClick={() => navigate('/trends')}>
            <span className="action-icon">🔥</span>
            <span className="action-label">Discover Trends</span>
            <span className="action-desc">Scan platforms for viral topics</span>
          </button>
          <button className="action-card" onClick={() => navigate('/lab')}>
            <span className="action-icon">⚗️</span>
            <span className="action-label">Content Lab</span>
            <span className="action-desc">Full pipeline visualization</span>
          </button>
          <button className="action-card" onClick={() => navigate('/style')}>
            <span className="action-icon">✨</span>
            <span className="action-label">Analyze Style</span>
            <span className="action-desc">Train your writing profile</span>
          </button>
          <button className="action-card" onClick={() => navigate('/settings')}>
            <span className="action-icon">🔑</span>
            <span className="action-label">API Keys</span>
            <span className="action-desc">Configure connections</span>
          </button>
        </div>
      </section>
    </div>
  );
}
