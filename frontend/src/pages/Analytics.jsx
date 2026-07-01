import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api.js';
import './Analytics.css';

const PLATFORMS = ['All', 'YouTube', 'Instagram'];

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('All');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAnalyticsSummary(selectedPlatform);
      if (data) setAnalytics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedPlatform]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
  };

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div className="analytics-header-row">
          <div>
            <h1><span className="gradient-text">Platform</span> Analytics</h1>
            <p>Track the performance of your published content.</p>
          </div>
          <button className="btn btn-primary" onClick={fetchAnalytics} disabled={loading}>
            {loading ? <span className="btn-spinner" /> : '🔄'} Refresh Data
          </button>
        </div>
      </div>

      <div className="filter-bar glass">
        <div className="filter-group">
          <label className="filter-label">Platform</label>
          <div className="filter-chips">
            {PLATFORMS.map(p => (
              <button
                key={p}
                className={`filter-chip ${selectedPlatform === p ? 'filter-chip-active' : ''}`}
                onClick={() => setSelectedPlatform(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && !analytics && (
        <div className="analytics-loading">
          <div className="skeleton skeleton-card" style={{ height: '120px' }} />
          <div className="skeleton skeleton-card" style={{ height: '300px' }} />
        </div>
      )}

      {analytics && (
        <>
          <div className="metrics-grid">
            <div className="metric-card glass">
              <h3>Total Views</h3>
              <div className="metric-value">{formatNumber(analytics.total_views)}</div>
              <div className="metric-trend positive">↑ 12% vs last period</div>
            </div>
            <div className="metric-card glass">
              <h3>Total Likes</h3>
              <div className="metric-value">{formatNumber(analytics.total_likes)}</div>
              <div className="metric-trend positive">↑ 8% vs last period</div>
            </div>
            <div className="metric-card glass">
              <h3>Total Comments</h3>
              <div className="metric-value">{formatNumber(analytics.total_comments)}</div>
              <div className="metric-trend neutral">- 2% vs last period</div>
            </div>
          </div>

          <div className="videos-section">
            <h2>Recent Content Performance</h2>
            <div className="videos-list">
              {analytics.videos.map(video => (
                <div key={video.id} className="video-row glass">
                  <div className="video-thumbnail">
                    <img src={video.thumbnail_url} alt={video.title} />
                  </div>
                  <div className="video-info">
                    <h4>{video.title}</h4>
                    <span className={`badge ${video.platform === 'YouTube' ? 'badge-crimson' : 'badge-purple'}`}>
                      {video.platform}
                    </span>
                    <span className="video-date">
                      {new Date(video.posted_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="video-stats">
                    <div className="stat">
                      <span className="stat-label">Views</span>
                      <span className="stat-value">{formatNumber(video.views)}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Likes</span>
                      <span className="stat-value">{formatNumber(video.likes)}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Comments</span>
                      <span className="stat-value">{formatNumber(video.comments)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {analytics.videos.length === 0 && (
              <div className="empty-state">
                <span className="empty-state-icon">📊</span>
                <h3>No videos found</h3>
                <p>No content data available for the selected platform.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
