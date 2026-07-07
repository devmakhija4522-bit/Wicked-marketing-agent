import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import './InfluencerScout.css';

export default function InfluencerScout() {
  const [criteria, setCriteria] = useState({
    platform: 'YouTube and Instagram',
    category: 'Tech',
    followerCount: '10k - 50k (Micro)',
    city: 'Delhi NCR'
  });
  
  // New state to hold custom inputs when "Other" is selected
  const [customCriteria, setCustomCriteria] = useState({
    category: '',
    followerCount: '',
    city: ''
  });

  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCriteria(prev => ({ ...prev, [name]: value }));
  };

  const handleCustomInputChange = (e) => {
    const { name, value } = e.target;
    setCustomCriteria(prev => ({ ...prev, [name]: value }));
  };

  const handleScout = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    
    // Use custom criteria if "Other" is selected
    const finalCriteria = {
      platform: criteria.platform,
      category: criteria.category === 'Other' && customCriteria.category ? customCriteria.category : criteria.category,
      followerCount: criteria.followerCount === 'Other' && customCriteria.followerCount ? customCriteria.followerCount : criteria.followerCount,
      city: criteria.city === 'Other' && customCriteria.city ? customCriteria.city : criteria.city
    };

    try {
      const response = await api.searchInfluencers(finalCriteria);
      setJobId(response.job_id);
    } catch (err) {
      setError(err.message || 'Failed to start scout job');
      setLoading(false);
    }
  };

  // Poll for job status
  useEffect(() => {
    let interval;
    if (jobId) {
      interval = setInterval(async () => {
        try {
          const statusRes = await api.getJobStatus(jobId);
          if (statusRes.status === 'completed') {
            try {
              const parsedData = JSON.parse(statusRes.result.draft);
              setResults(parsedData);
            } catch (e) {
              setError('Failed to parse agent response as JSON.');
              console.error(e, statusRes.result.draft);
            }
            setLoading(false);
            setJobId(null);
            clearInterval(interval);
          } else if (statusRes.status === 'failed') {
            setError(statusRes.error || 'Agent execution failed.');
            setLoading(false);
            setJobId(null);
            clearInterval(interval);
          }
        } catch (err) {
          setError('Failed to fetch job status.');
          setLoading(false);
          setJobId(null);
          clearInterval(interval);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [jobId]);

  return (
    <div className="influencer-page">
      <div className="influencer-header">
        <h1><span className="gradient-text">Influencer</span> Scout</h1>
        <p>Strategic Creator Discovery</p>
      </div>

      <div className="influencer-card">
        <div className="influencer-form-grid">
          
          <div className="form-group full-width">
            <label>Platform</label>
            <select name="platform" value={criteria.platform} onChange={handleInputChange}>
              <option value="YouTube and Instagram">YouTube & Instagram</option>
              <option value="YouTube Only">YouTube Only</option>
              <option value="Instagram Only">Instagram Only</option>
            </select>
          </div>

          <div className="form-group">
            <label>Influencer Category / Niche</label>
            <select name="category" value={criteria.category} onChange={handleInputChange}>
              <option value="Tech">Tech</option>
              <option value="Lifestyle">Lifestyle</option>
              <option value="Gaming">Gaming</option>
              <option value="Review and experience">Review and experience</option>
              <option value="GenZ creators">GenZ creators</option>
              <option value="Corporate employee influencer">Corporate employee influencer</option>
              <option value="Unboxing & Reviews">Unboxing & Reviews</option>
              <option value="Vlogs">Vlogs</option>
              <option value="Reels & Shorts">Reels & Shorts</option>
              <option value="Dedicated Integration">Dedicated Integration</option>
              <option value="General">General</option>
              <option value="All">All</option>
              <option value="Other">Other</option>
            </select>
            {criteria.category === 'Other' && (
              <input 
                type="text" 
                name="category" 
                value={customCriteria.category} 
                onChange={handleCustomInputChange} 
                placeholder="Type custom category..."
                style={{ marginTop: '0.5rem' }}
              />
            )}
          </div>

          <div className="form-group">
            <label>Follower Count</label>
            <select name="followerCount" value={criteria.followerCount} onChange={handleInputChange}>
              <option value="10k - 50k (Micro)">10k - 50k (Micro)</option>
              <option value="50k - 100k">50k - 100k</option>
              <option value="100k - 500k (Mid-tier)">100k - 500k (Mid-tier)</option>
              <option value="500k - 1M (Macro)">500k - 1M (Macro)</option>
              <option value="1M+ (Mega)">1M+ (Mega)</option>
              <option value="Other">Other</option>
            </select>
            {criteria.followerCount === 'Other' && (
              <input 
                type="text" 
                name="followerCount" 
                value={customCriteria.followerCount} 
                onChange={handleCustomInputChange} 
                placeholder="Type custom follower count..."
                style={{ marginTop: '0.5rem' }}
              />
            )}
          </div>

          <div className="form-group">
            <label>Target City (Influencer & Audience Location)</label>
            <select name="city" value={criteria.city} onChange={handleInputChange}>
              <option value="Delhi NCR">Delhi NCR</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Pune">Pune</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="All India">All India</option>
              <option value="Other">Other</option>
            </select>
            {criteria.city === 'Other' && (
              <input 
                type="text" 
                name="city" 
                value={customCriteria.city} 
                onChange={handleCustomInputChange} 
                placeholder="Type custom city..."
                style={{ marginTop: '0.5rem' }}
              />
            )}
          </div>
        </div>

        <button 
          className="scout-button" 
          onClick={handleScout}
          disabled={loading}
        >
          {loading ? 'Scouting Profiles...' : 'Find Strategic Influencers'}
        </button>

        {error && <div className="error-message" style={{ color: '#ef4444', marginTop: '1rem' }}>{error}</div>}
      </div>

      {/* Render Structured Data Cards */}
      {results && Array.isArray(results) && results.length === 0 && (
        <div className="influencer-card" style={{ marginTop: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>
          No verified influencers found for this criteria. Try a broader category,
          follower range, or city, then search again.
        </div>
      )}

      {results && Array.isArray(results) && results.length > 0 && (
        <div className="results-grid">
          {results.map((inf, idx) => (
            <div key={idx} className="data-card fade-in">
              <div className="data-card-header">
                <div className="data-card-avatar">
                  {inf.name ? inf.name.charAt(0).toUpperCase() : 'I'}
                </div>
                <div className="data-card-title">
                  <h3>{inf.name}</h3>
                  <span>{inf.handle} • {inf.platform}</span>
                </div>
              </div>
              
              <div className="data-card-stats">
                <div className="stat-item">
                  <span className="stat-label">Followers</span>
                  <span className="stat-value">{inf.followers}</span>
                </div>
              </div>
              
              <div className="data-card-reasoning">
                <strong>Why them?</strong><br />
                {inf.reasoning}
              </div>
              
              <div className="data-card-action">
                <a href={inf.url} target="_blank" rel="noopener noreferrer">
                  View Profile
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
