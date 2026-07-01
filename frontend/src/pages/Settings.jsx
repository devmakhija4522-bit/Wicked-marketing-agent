import { useState, useEffect } from 'react';
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

  // We would normally fetch settings from the backend here
  // For this demo we'll use local state to simulate it

  const handleSave = () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      setMessage('Settings saved successfully!');
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
    <div className="settings-container">
      <header className="settings-header">
        <h1>Configuration</h1>
        <p>Manage your API keys, language preferences, and generation formats.</p>
      </header>

      <div className="settings-grid">
        <div className="settings-card glass-panel">
          <h2>API Keys</h2>
          <p className="settings-desc">Connect external services to power WICKED.</p>
          
          <div className="form-group">
            <label>Google Gemini API Key <span className="required">*</span></label>
            <input 
              type="password" 
              value={settings.geminiKey} 
              onChange={e => setSettings({...settings, geminiKey: e.target.value})}
              placeholder="AIzaSy..."
            />
            <span className="help-text">Required for all LLM operations. Get it from ai.google.dev</span>
          </div>

          <div className="form-group">
            <label>YouTube Data API v3 (Optional)</label>
            <input 
              type="password" 
              value={settings.youtubeKey} 
              onChange={e => setSettings({...settings, youtubeKey: e.target.value})}
              placeholder="AIzaSy..."
            />
          </div>

          <div className="form-group">
            <label>Reddit API (PRAW) (Optional)</label>
            <input 
              type="password" 
              value={settings.redditKey} 
              onChange={e => setSettings({...settings, redditKey: e.target.value})}
              placeholder="Client ID / Secret..."
            />
          </div>

          <div className="form-group">
            <label>RapidAPI Key (Instagram) (Optional)</label>
            <input 
              type="password" 
              value={settings.rapidApiKey} 
              onChange={e => setSettings({...settings, rapidApiKey: e.target.value})}
              placeholder="x-rapidapi-key..."
            />
          </div>
        </div>

        <div className="settings-col">
          <div className="settings-card glass-panel">
            <h2>Output Preferences</h2>
            
            <div className="form-group">
              <label>Default Language</label>
              <select 
                value={settings.language} 
                onChange={e => setSettings({...settings, language: e.target.value})}
                className="custom-select"
              >
                <option value="Hinglish">Hinglish (Recommended for India)</option>
                <option value="English">Pure English</option>
                <option value="Hindi">Pure Hindi</option>
              </select>
            </div>
          </div>

          <div className="settings-card glass-panel">
            <h2>Content Formats</h2>
            <p className="settings-desc">Select which formats the Content Strategist should consider.</p>
            
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input type="checkbox" checked={settings.formats.reels} onChange={() => handleFormatChange('reels')} />
                <span className="checkbox-text">Instagram Reels (30s-90s)</span>
              </label>
              
              <label className="checkbox-label">
                <input type="checkbox" checked={settings.formats.shorts} onChange={() => handleFormatChange('shorts')} />
                <span className="checkbox-text">YouTube Shorts</span>
              </label>

              <label className="checkbox-label">
                <input type="checkbox" checked={settings.formats.longform} onChange={() => handleFormatChange('longform')} />
                <span className="checkbox-text">Long-form YouTube Videos</span>
              </label>

              <label className="checkbox-label">
                <input type="checkbox" checked={settings.formats.carousel} onChange={() => handleFormatChange('carousel')} />
                <span className="checkbox-text">Instagram Carousels</span>
              </label>

              <label className="checkbox-label">
                <input type="checkbox" checked={settings.formats.threads} onChange={() => handleFormatChange('threads')} />
                <span className="checkbox-text">X / Twitter Threads</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        {message && <span className="success-message">{message}</span>}
        <button className="btn-primary save-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}
