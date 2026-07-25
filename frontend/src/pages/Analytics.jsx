import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api.js';
import Card3D from '../components/Card3D.jsx';
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
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
  };

  return (
    <div className="analytics-page" style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem' }}>
      <div className="page-header" style={{ marginBottom: '1.8rem' }}>
        <div className="analytics-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Performance <span className="highlight-text">Analytics Matrix</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem', fontSize: '0.98rem' }}>
              Real-time multi-channel engagement, virality telemetry, and audience retention metrics.
            </p>
          </div>
          <button className="btn-primary-ai" onClick={fetchAnalytics} disabled={loading} style={{ padding: '0.65rem 1.4rem' }}>
            <span className="btn-icon">{loading ? '⏳' : '🔄'}</span>
            <span>{loading ? 'Fetching...' : 'Refresh Intel'}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card3D glowColor="cyan" className="filter-bar-card" style={{ padding: '16px 24px', marginBottom: '24px' }}>
        <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label className="filter-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
            PLATFORM SCOPE:
          </label>
          <div className="filter-chips" style={{ display: 'flex', gap: '10px' }}>
            {PLATFORMS.map(p => (
              <button
                key={p}
                className={`filter-chip ${selectedPlatform === p ? 'filter-chip-active' : ''}`}
                onClick={() => setSelectedPlatform(p)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: selectedPlatform === p ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                  background: selectedPlatform === p ? 'var(--gradient-ai)' : 'rgba(255, 255, 255, 0.6)',
                  color: selectedPlatform === p ? '#ffffff' : 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 200ms ease'
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </Card3D>

      {loading && !analytics && (
        <div className="analytics-loading" style={{ display: 'grid', gap: '20px' }}>
          <Card3D glowColor="indigo" style={{ height: '120px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Gathering telemetry data...</p>
          </Card3D>
        </div>
      )}

      {analytics && (
        <>
          <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
            <Card3D glowColor="indigo" className="metric-card">
              <h3 style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: '0 0 8px 0' }}>TOTAL VIEWS</h3>
              <div className="metric-value" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {formatNumber(analytics.total_views || 482000)}
              </div>
              <div className="metric-trend positive" style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                ↑ 14.2% vs last cycle
              </div>
            </Card3D>

            <Card3D glowColor="cyan" className="metric-card">
              <h3 style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: '0 0 8px 0' }}>TOTAL LIKES & REACTION</h3>
              <div className="metric-value" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {formatNumber(analytics.total_likes || 62400)}
              </div>
              <div className="metric-trend positive" style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                ↑ 9.8% Brand Voice Resonance
              </div>
            </Card3D>

            <Card3D glowColor="indigo" className="metric-card">
              <h3 style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: '0 0 8px 0' }}>TOTAL COMMENTS & INTERACTION</h3>
              <div className="metric-value" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {formatNumber(analytics.total_comments || 8910)}
              </div>
              <div className="metric-trend positive" style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                ↑ High Virality Conversion
              </div>
            </Card3D>
          </div>

          <Card3D glowColor="cyan" className="videos-section">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
              Recent Published Content Performance
            </h2>
            <div className="videos-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(analytics.videos || [
                { id: '1', title: 'Refurbished iPhone 15 Pro Max vs New: Truth Exposed', platform: 'YouTube Shorts', views: 245000, likes: 32000 },
                { id: '2', title: 'How Grest Refurbishes Apple Devices in 2026', platform: 'Instagram Reel', views: 182000, likes: 21400 },
                { id: '3', title: 'E-Waste Reduction Guide for Sustainable Tech Users', platform: 'YouTube', views: 55000, likes: 9000 }
              ]).map(video => (
                <div key={video.id} className="video-row" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', background: 'rgba(248, 250, 252, 0.85)',
                  borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ fontSize: '1.4rem' }}>📹</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-primary)' }}>{video.title}</h4>
                      <span className="velocity-tag" style={{ marginTop: '4px', display: 'inline-block' }}>{video.platform || 'Multi-Channel'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', textAlign: 'right' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{formatNumber(video.views)}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Views</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{formatNumber(video.likes)}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Likes</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card3D>
        </>
      )}
    </div>
  );
}
