import { useState } from 'react';
import './StyleProfile.css';

export default function StyleProfile() {
  const [samples, setSamples] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!samples.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_BASE}/api/style-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ samples: [samples] })
      });
      
      if (!res.ok) throw new Error('Failed to analyze style');
      const data = await res.json();
      setProfile(data.profile);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="style-profile-container">
      <header className="style-header">
        <h1>Style Profile</h1>
        <p>Teach WICKED how to write like you. Paste some of your past scripts or content.</p>
      </header>

      <div className="style-content">
        <div className="input-section glass-panel">
          <h2>Your Writing Samples</h2>
          <p className="subtitle">Paste 2-3 examples of your best content here.</p>
          <textarea 
            className="samples-input" 
            placeholder="Paste your scripts here..."
            value={samples}
            onChange={(e) => setSamples(e.target.value)}
          ></textarea>
          <button 
            className="btn-primary analyze-btn" 
            onClick={handleAnalyze}
            disabled={loading || !samples.trim()}
          >
            {loading ? 'Analyzing...' : 'Analyze My Style'}
          </button>
          {error && <div className="error-text">{error}</div>}
        </div>

        <div className="profile-section glass-panel">
          <h2>Your WICKED Persona</h2>
          {loading ? (
            <div className="profile-loading">
              <div className="shimmer-card pulse-circle"></div>
              <p>Analyzing vocabulary, tone, and pacing...</p>
            </div>
          ) : profile ? (
            <div className="profile-results">
              <div className="trait-card">
                <h3>Tone Overview</h3>
                <p>{profile.tone_description || 'Casual, engaging, and subtly humorous.'}</p>
              </div>
              <div className="trait-card">
                <h3>Key Vocabulary</h3>
                <div className="tags-container">
                  {(profile.vocabulary || ['relatable', 'hook-driven', 'story-first']).map(word => (
                    <span key={word} className="vocab-tag">{word}</span>
                  ))}
                </div>
              </div>
              <div className="trait-card">
                <h3>Sentence Structure</h3>
                <p>{profile.sentence_structure || 'Short, punchy sentences with strategic pauses.'}</p>
              </div>
            </div>
          ) : (
            <div className="empty-profile">
              <p>Your persona profile will appear here after analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
