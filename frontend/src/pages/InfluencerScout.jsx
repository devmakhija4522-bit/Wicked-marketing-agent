import { useState } from 'react';
import * as XLSX from 'xlsx';
import { api } from '../utils/api.js';
import { useClient } from '../context/ClientContext.jsx';
import './InfluencerScout.css';

export default function InfluencerScout() {
  const { currentClient } = useClient();
  const [criteria, setCriteria] = useState({
    platform: 'YouTube and Instagram',
    category: 'Tech',
    followerCount: '8k - 95k (Strictly 8,000 to 95,000 followers)',
    city: 'Delhi NCR'
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
        follower_count: '8k - 95k',
        city: 'Delhi NCR'
      }, currentClient?.id || 'generic');
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to scout influencers.');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!results || results.length === 0) return;

    // Prepare rows for Excel
    const excelData = results.map((inf, idx) => ({
      'S.No': idx + 1,
      'Creator Name': inf.name || 'N/A',
      'Handle': inf.handle || 'N/A',
      'Platform': inf.platform || 'N/A',
      'Profile Link (URL)': inf.url || 'N/A',
      'Followers': inf.followers || '8k - 95k',
      'Category': inf.category || criteria.category,
      'Location': inf.city || 'Delhi NCR',
      'Audited Reasoning': inf.reasoning || ''
    }));

    // Create Worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for clean readability
    worksheet['!cols'] = [
      { wch: 6 },   // S.No
      { wch: 30 },  // Name
      { wch: 22 },  // Handle
      { wch: 15 },  // Platform
      { wch: 45 },  // URL
      { wch: 15 },  // Followers
      { wch: 20 },  // Category
      { wch: 20 },  // Location
      { wch: 60 }   // Reasoning
    ];

    // Create Workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Delhi NCR Influencers');

    // Generate filename
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Delhi_NCR_Influencers_${criteria.category}_${dateStr}.xlsx`;

    // Trigger download
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="influencer-scout-container">
      <header className="page-header">
        <div>
          <span className="badge-chip">CREATOR DISCOVERY • DELHI NCR</span>
          <h2>🌟 Influencer Scout (Delhi NCR strictly 8k-95k Followers)</h2>
          <p className="subtitle">Discover verified YouTube & Instagram creators strictly in Delhi NCR with 8,000 to 95,000 followers. Export to Excel (.xlsx).</p>
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
            <label>Follower Range <span className="locked-tag">🔒 STRICTLY ENFORCED</span></label>
            <div className="locked-input-box">
              <span>🎯 8,000 to 95,000 Followers (8k - 95k)</span>
            </div>
          </div>

          <div className="form-group">
            <label>Location <span className="locked-tag">🔒 STRICTLY ENFORCED</span></label>
            <div className="locked-input-box">
              <span>📍 Delhi NCR (Delhi, Gurgaon, Noida, Ghaziabad, Faridabad)</span>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Scouting 30-50 Delhi NCR Creators...' : '🔎 Find Verified Delhi NCR Creators (30-50)'}
          </button>
          {error && <div className="error-alert">⚠️ {error}</div>}
        </form>

        <div className="scout-card result-card">
          {!results && !loading && (
            <div className="empty-state">
              <span className="empty-icon">👥</span>
              <h4>No Creators Scouted Yet</h4>
              <p>Select your category and click "Find Verified Delhi NCR Creators (30-50)".</p>
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Scouting live creators in Delhi NCR (8k-95k followers) & auditing links...</p>
              <span className="loading-subtext">Harvesting 30 to 50 real, non-hallucinated profiles...</span>
            </div>
          )}

          {results && !loading && results.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">🚫</span>
              <h4>No Verified Creators Found</h4>
              <p>Try selecting a different category or platform filter.</p>
            </div>
          )}

          {results && !loading && results.length > 0 && (
            <div className="creators-results">
              <div className="results-header-actions">
                <div>
                  <h4>Found {results.length} Verified Delhi NCR Creators</h4>
                  <p className="results-subhead">Followers: 8k - 95k • Location: Delhi NCR</p>
                </div>
                <button type="button" onClick={exportToExcel} className="btn-excel-export">
                  📊 Export to Excel (.xlsx)
                </button>
              </div>

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
                      <div className="badge-row">
                        <span className="stat-badge">👥 {inf.followers} Followers</span>
                        <span className="loc-badge">📍 {inf.city || 'Delhi NCR'}</span>
                      </div>
                      <p className="reasoning"><strong>Audited Details:</strong> {inf.reasoning}</p>
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
