import { useState } from 'react';
import { api } from '../utils/api.js';
import { useClient } from '../context/ClientContext.jsx';
import './InfluencerScout.css';

export default function InfluencerScout() {
  const { currentClient } = useClient();
  const [criteria, setCriteria] = useState({
    platform: 'YouTube and Instagram',
    category: 'Tech',
    followerCount: '50k - 100k',
    city: 'All India'
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCriteria((prev) => ({ ...prev, [name]: value }));
  };

  const handleScout = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const data = await api.searchInfluencers({
        platform: criteria.platform,
        category: criteria.category,
        follower_count: criteria.followerCount,
        city: criteria.city
      }, currentClient?.id || 'generic');
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to scout influencers.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="influencer-scout-container">
      <header className="page-header">
        <div>
          <span className="badge-chip">CREATOR DISCOVERY</span>
          <h2>🌟 Influencer Scout</h2>
          <p className="subtitle">Discover verified YouTube & Instagram creators with authentic engagement.</p>
        </div>
      </header>

      <div className="scout-grid">
        <form className="scout-card input-card" onSubmit={handleScout}>
          <h3>Target Criteria</h3>
          
          <div className="form-group">
            <label>Platform</label>
            <select name="platform" value={criteria.platform} onChange={handleInputChange}>
              <option value="YouTube and Instagram">YouTube & Instagram</option>
              <option value="YouTube Only">YouTube Only</option>
              <option value="Instagram Only">Instagram Only</option>
            </select>
          </div>

          <div className="form-group">
            <label>Category / Niche</label>
            <select name="category" value={criteria.category} onChange={handleInputChange}>
              <option value="Tech">Tech & Gadgets</option>
              <option value="Lifestyle">Lifestyle & Fashion</option>
              <option value="Gaming">Gaming & Esports</option>
              <option value="Review and experience">Reviews & Experiences</option>
              <option value="GenZ creators">GenZ Creators</option>
              <option value="Unboxing & Reviews">Unboxing & Reviews</option>
              <option value="Finance & Business">Finance & Business</option>
            </select>
          </div>

          <div className="form-group">
            <label>Follower Count</label>
            <select name="followerCount" value={criteria.followerCount} onChange={handleInputChange}>
              <option value="10k - 50k (Micro)">10k - 50k (Micro)</option>
              <option value="50k - 100k">50k - 100k (Rising Stars)</option>
              <option value="100k - 500k (Mid-tier)">100k - 500k (Mid-tier)</option>
              <option value="500k - 1M (Macro)">500k - 1M (Macro)</option>
              <option value="1M+ (Mega)">1M+ (Mega Stars)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Location</label>
            <select name="city" value={criteria.city} onChange={handleInputChange}>
              <option value="All India">All India</option>
              <option value="Delhi NCR">Delhi NCR</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Hyderabad">Hyderabad</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Auditing & Scouting Creators...' : '🔎 Find Verified Creators'}
          </button>
          {error && <div className="error-alert">⚠️ {error}</div>}
        </form>

        <div className="scout-card result-card">
          {!results && !loading && (
            <div className="empty-state">
              <span className="empty-icon">👥</span>
              <h4>No Creators Scouted Yet</h4>
              <p>Set your target criteria on the left and click "Find Verified Creators".</p>
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Scouting live creators & auditing for fake bot engagement...</p>
            </div>
          )}

          {results && !loading && results.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">🚫</span>
              <h4>No Verified Creators Found</h4>
              <p>Try widening your category or follower range criteria.</p>
            </div>
          )}

          {results && !loading && results.length > 0 && (
            <div className="creators-results">
              <h4>Found {results.length} Verified Creators</h4>
              <div className="creators-grid">
                {results.map((inf, idx) => (
                  <div key={idx} className="creator-item-card">
                    <div className="creator-header">
                      <div className="creator-avatar">
                        {inf.name ? inf.name.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div>
                        <h5>{inf.name}</h5>
                        <span className="handle-tag">{inf.handle} • {inf.platform}</span>
                      </div>
                    </div>
                    <div className="creator-body">
                      <span className="stat-badge">👥 {inf.followers} Followers</span>
                      <p className="reasoning"><strong>Why them:</strong> {inf.reasoning}</p>
                      {inf.url && (
                        <a href={inf.url} target="_blank" rel="noopener noreferrer" className="profile-link">
                          🔗 View Profile ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
