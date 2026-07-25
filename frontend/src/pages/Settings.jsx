import { useState } from 'react';
import Card3D from '../components/Card3D.jsx';
import './Settings.css';

export default function Settings() {
  const [settings, setSettings] = useState({
    geminiKey: '',
    youtubeKey: '',
    redditKey: '',
    rapidApiKey: '',
    language: 'Hinglish',
    formats: { reels: true, shorts: true, longform: false, carousel: false, threads: false }
  });
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setMessage('Configuration parameters saved & deployed!');
      setTimeout(() => setMessage(''), 3000);
    }, 800);
  };

  const handleFormatChange = (format) => {
    setSettings(prev => ({
      ...prev,
      formats: { ...prev.formats, [format]: !prev.formats[format] }
    }));
  };

  return (
    <div className="settings-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem' }}>
      <header className="settings-header" style={{ marginBottom: '1.8rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          System <span className="highlight-text">Configuration & API Keys</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem', fontSize: '0.98rem' }}>
          Manage your Gemini models, API keys, regional language presets, and agent execution formats.
        </p>
      </header>

      <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        <Card3D glowColor="indigo" className="settings-card">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>API Key Matrix</h2>
          <p className="settings-desc" style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginBottom: '20px' }}>
            Connect external providers to power real-time web search and video scraping.
          </p>
          
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '6px' }}>
              GOOGLE GEMINI API KEY <span style={{ color: 'var(--accent-primary)' }}>*</span>
            </label>
            <input 
              type="password" 
              value={settings.geminiKey} 
              onChange={e => setSettings({...settings, geminiKey: e.target.value})}
              placeholder="AIzaSy..."
              style={{
                width: '100%', padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)', fontSize: '0.92rem', outline: 'none'
              }}
            />
            <span className="help-text" style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
              Primary key for Gemini 1.5 Pro & Search Grounding (ai.google.dev)
            </span>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '6px' }}>
              YOUTUBE DATA API v3 (OPTIONAL)
            </label>
            <input 
              type="password" 
              value={settings.youtubeKey} 
              onChange={e => setSettings({...settings, youtubeKey: e.target.value})}
              placeholder="AIzaSy..."
              style={{
                width: '100%', padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)', fontSize: '0.92rem', outline: 'none'
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '6px' }}>
              REDDIT PRAW CLIENT CREDENTIALS (OPTIONAL)
            </label>
            <input 
              type="password" 
              value={settings.redditKey} 
              onChange={e => setSettings({...settings, redditKey: e.target.value})}
              placeholder="Client ID / Secret..."
              style={{
                width: '100%', padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)', fontSize: '0.92rem', outline: 'none'
              }}
            />
          </div>
        </Card3D>

        <div className="settings-col" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Card3D glowColor="cyan" className="settings-card">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Output Language & Region</h2>
            
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                PRIMARY VOICE DIALECT
              </label>
              <select 
                value={settings.language} 
                onChange={e => setSettings({...settings, language: e.target.value})}
                style={{
                  width: '100%', padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)', fontSize: '0.92rem', outline: 'none'
                }}
              >
                <option value="Hinglish">Hinglish (Recommended for India Tech / Gen Z)</option>
                <option value="English">Global English</option>
                <option value="Hindi">Pure Hindi</option>
              </select>
            </div>
          </Card3D>

          <Card3D glowColor="indigo" className="settings-card">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>Target Content Formats</h2>
            <p className="settings-desc" style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
              Select active platforms for 5-agent content output generation.
            </p>
            
            <div className="checkbox-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.keys(settings.formats).map(fmtKey => (
                <label key={fmtKey} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={settings.formats[fmtKey]}
                    onChange={() => handleFormatChange(fmtKey)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-cyan)' }}
                  />
                  <span>{fmtKey.toUpperCase()} Target Pipeline</span>
                </label>
              ))}
            </div>
          </Card3D>
        </div>
      </div>

      <div className="settings-actions" style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
        {message && <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.9rem' }}>{message}</span>}
        <button className="btn-primary-ai" onClick={handleSave} disabled={saving} style={{ padding: '0.75rem 2rem' }}>
          <span className="btn-icon">{saving ? '⏳' : '⚡'}</span>
          <span>{saving ? 'Saving...' : 'Deploy Configuration'}</span>
        </button>
      </div>
    </div>
  );
}
