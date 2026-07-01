import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api.js';
import './Trends.css';

const MOCK_TRENDS = [
  { id: 1, title: 'iPhone 16 Pro Max Durability Tests Going Viral', platform: 'YouTube', category: 'Product Review', engagement: '2.4M views', signal: 'high', description: 'Drop tests and durability comparisons trending across tech YouTube.' },
  { id: 2, title: 'Refurbished Tech Market Booming in India', platform: 'Google', category: 'Market Trend', engagement: '89K searches', signal: 'high', description: 'Search volume for refurbished electronics up 340% YoY in India.' },
  { id: 3, title: '"Is Refurbished Worth It?" Debate Thread', platform: 'Reddit', category: 'Discussion', engagement: '15.2K upvotes', signal: 'medium', description: 'Massive debate on r/IndianGaming about refurbished Apple devices.' },
  { id: 4, title: 'MacBook Air M3 vs M2 — Which to Buy?', platform: 'YouTube', category: 'Comparison', engagement: '1.8M views', signal: 'high', description: 'Comparison videos dominating tech YouTube, perfect for refurb angle.' },
  { id: 5, title: 'Apple Certified Refurbished India Launch', platform: 'Google', category: 'News', engagement: '120K searches', signal: 'high', description: 'Apple expanding certified refurbished program to India.' },
  { id: 6, title: 'Budget Apple Setup Under ₹50K', platform: 'Instagram', category: 'Lifestyle', engagement: '340K likes', signal: 'medium', description: 'Reels showing complete Apple setups built with refurbished devices.' },
  { id: 7, title: 'E-Waste Crisis: Refurbished as Solution', platform: 'Reddit', category: 'Sustainability', engagement: '8.9K upvotes', signal: 'medium', description: 'Environmental angle gaining traction in sustainability communities.' },
  { id: 8, title: 'AirPods Pro 2 Sound Quality Comparison', platform: 'YouTube', category: 'Product Review', engagement: '950K views', signal: 'medium', description: 'Audio quality tests comparing new vs refurbished AirPods Pro 2.' },
  { id: 9, title: 'Student Apple Deals for College Season', platform: 'Instagram', category: 'Deals', engagement: '280K likes', signal: 'high', description: 'College season driving massive interest in affordable Apple gear.' },
];

const PLATFORMS = ['All', 'YouTube', 'Reddit', 'Instagram', 'Google'];
const CATEGORIES = ['All', 'Product Review', 'Market Trend', 'Discussion', 'Comparison', 'News', 'Lifestyle', 'Sustainability', 'Deals'];

export default function Trends() {
  const navigate = useNavigate();
  const [trends, setTrends] = useState(MOCK_TRENDS);
  const [loading, setLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.discoverTrends();
      if (data && data.trends && data.trends.length > 0) {
        setTrends(data.trends.map((t, i) => ({
          id: i + 1,
          title: t.title || t.topic || 'Trending Topic',
          platform: t.platform || t.source || 'YouTube',
          category: t.category || 'General',
          engagement: t.engagement || t.metrics || 'Trending',
          signal: t.signal || (t.score > 0.7 ? 'high' : 'medium'),
          description: t.description || t.summary || '',
        })));
      }
      setLastRefresh(new Date());
    } catch (e) {
      // keep mock data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchTrends, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchTrends]);

  const filteredTrends = trends.filter(t => {
    if (selectedPlatform !== 'All' && t.platform !== selectedPlatform) return false;
    if (selectedCategory !== 'All' && t.category !== selectedCategory) return false;
    return true;
  });

  const getPlatformClass = (platform) => {
    const map = { YouTube: 'badge-crimson', Reddit: 'badge-amber', Instagram: 'badge-purple', Google: 'badge-blue' };
    return map[platform] || 'badge-blue';
  };

  const getSignalClass = (signal) => {
    return signal === 'high' ? 'signal-high' : signal === 'medium' ? 'signal-medium' : 'signal-low';
  };

  const handleGenerateFromTrend = (trend) => {
    navigate('/lab', { state: { trend } });
  };

  return (
    <div className="trends-page">
      <div className="page-header">
        <div className="trends-header-row">
          <div>
            <h1><span className="gradient-text">Trend</span> Discovery</h1>
            <p>Discover trending Instagram Reels (Entertainment & Infographic) for brand awareness.</p>
          </div>
          <div className="trends-header-actions">
            <div className="auto-refresh-toggle">
              <button
                className={`toggle-btn ${autoRefresh ? 'toggle-active' : ''}`}
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <span className="toggle-track">
                  <span className="toggle-thumb" />
                </span>
              </button>
              <span className="toggle-label">Auto-refresh</span>
            </div>
            <button className="btn btn-primary" onClick={fetchTrends} disabled={loading}>
              {loading ? <span className="btn-spinner" /> : '🔄'} Refresh
            </button>
          </div>
        </div>
        <div className="refresh-info">
          <span className="refresh-dot" />
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
      </div>

      {/* Filter Bar */}
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
        <div className="filter-group">
          <label className="filter-label">Category</label>
          <div className="filter-chips">
            {CATEGORIES.map(c => (
              <button
                key={c}
                className={`filter-chip ${selectedCategory === c ? 'filter-chip-active' : ''}`}
                onClick={() => setSelectedCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="trends-loading">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      )}

      {/* Trends Grid */}
      {!loading && (
        <div className="trends-grid">
          {filteredTrends.map((trend, i) => (
            <div
              key={trend.id}
              className="trend-card"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="trend-card-top">
                <span className={`badge ${getPlatformClass(trend.platform)}`}>
                  {trend.platform}
                </span>
                <div className={`signal-indicator ${getSignalClass(trend.signal)}`}>
                  <span className="signal-dot" />
                  {trend.signal}
                </div>
              </div>
              <h3 className="trend-title">{trend.title}</h3>
              <p className="trend-description">{trend.description}</p>
              <div className="trend-meta">
                <span className="trend-category">{trend.category}</span>
                <span className="trend-engagement">{trend.engagement}</span>
              </div>
              <button
                className="btn btn-secondary btn-sm trend-generate-btn"
                onClick={() => handleGenerateFromTrend(trend)}
              >
                ⚡ Generate Content
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredTrends.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon">🔍</span>
          <h3>No trends found</h3>
          <p>Try adjusting your filters or refresh to discover new trends.</p>
        </div>
      )}
    </div>
  );
}
