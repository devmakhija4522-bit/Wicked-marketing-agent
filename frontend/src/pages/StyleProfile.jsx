import { useState } from 'react';
import Card3D from '../components/Card3D.jsx';
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
    <div className="style-profile-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem' }}>
      <header className="style-header" style={{ marginBottom: '1.8rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          Brand Voice <span className="highlight-text">Persona Matrix</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem', fontSize: '0.98rem' }}>
          Train WICKED's 5-agent engine on your unique tone, vocabulary, pacing, and brand rules.
        </p>
      </header>

      <div className="style-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <Card3D glowColor="indigo" className="input-section">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>Writing Samples</h2>
          <p className="subtitle" style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
            Paste 2-3 examples of your top performing scripts or founder posts.
          </p>
          <textarea 
            className="samples-input" 
            placeholder="Paste your past viral scripts, hooks, or captions here..."
            value={samples}
            onChange={(e) => setSamples(e.target.value)}
            rows={8}
            style={{
              width: '100%', padding: '1rem', background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)', fontSize: '0.92rem', outline: 'none', resize: 'vertical',
              marginBottom: '16px'
            }}
          />
          <button 
            className="btn-primary-ai" 
            onClick={handleAnalyze}
            disabled={loading || !samples.trim()}
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
          >
            <span className="btn-icon">{loading ? '⏳' : '⚡'}</span>
            <span>{loading ? 'Extracting Brand Persona...' : 'Analyze & Calibrate Voice'}</span>
          </button>
          {error && <div className="error-text" style={{ color: 'var(--accent-primary)', fontSize: '0.8rem', marginTop: '10px' }}>{error}</div>}
        </Card3D>

        <Card3D glowColor="cyan" className="profile-section">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Calibrated Persona Telemetry</h2>
          {loading ? (
            <div className="profile-loading" style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="status-indicator" style={{ margin: '0 auto 12px auto', width: '16px', height: '16px' }}></div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Deconstructing vocabulary, emotional hooks, and pacing...</p>
            </div>
          ) : profile ? (
            <div className="profile-results" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="trait-card" style={{ padding: '12px 16px', background: 'rgba(248, 250, 252, 0.85)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>TONE OVERVIEW</h3>
                <p style={{ margin: 0, fontSize: '0.94rem', fontWeight: 600, color: 'var(--text-primary)' }}>{profile.tone_description || 'Casual, engaging, and subtly humorous.'}</p>
              </div>
              <div className="trait-card" style={{ padding: '12px 16px', background: 'rgba(248, 250, 252, 0.85)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>KEY VOCABULARY TAGS</h3>
                <div className="tags-container" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(profile.vocabulary || ['relatable', 'hook-driven', 'story-first', 'high-retention']).map(word => (
                    <span key={word} className="velocity-tag">{word}</span>
                  ))}
                </div>
              </div>
              <div className="trait-card" style={{ padding: '12px 16px', background: 'rgba(248, 250, 252, 0.85)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>SENTENCE STRUCTURE & PACING</h3>
                <p style={{ margin: 0, fontSize: '0.94rem', fontWeight: 600, color: 'var(--text-primary)' }}>{profile.sentence_structure || 'Short, punchy sentences with strategic pauses.'}</p>
              </div>
            </div>
          ) : (
            <div className="empty-profile" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              <p>Your calibrated brand persona will populate here after running analysis.</p>
            </div>
          )}
        </Card3D>
      </div>
    </div>
  );
}
