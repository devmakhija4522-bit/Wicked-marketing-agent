import { useState } from 'react';
import { api } from '../utils/api.js';
import './InstagramScripts.css';

export default function InstagramScripts() {
  const [scriptData, setScriptData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setScriptData(null);
    try {
      const data = await api.generateInstagramScript();
      if (data) setScriptData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="instagram-page">
      <div className="page-header">
        <div className="instagram-header-row">
          <div>
            <h1><span className="gradient-text">Instagram</span> Scripts</h1>
            <p>Generate viral Reels scripts by combining Apple News with proven storytelling formats.</p>
          </div>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
            {loading ? <span className="btn-spinner" /> : '🎬'} Generate Script
          </button>
        </div>
      </div>

      {loading && (
        <div className="scripts-loading">
          <div className="skeleton skeleton-text" style={{ height: '40px', width: '60%' }} />
          <div className="skeleton skeleton-text" style={{ height: '200px' }} />
          <div className="skeleton skeleton-text" style={{ height: '100px' }} />
        </div>
      )}

      {!loading && scriptData && (
        <div className="script-container glass">
          <div className="script-header">
            <h2>{scriptData.title}</h2>
            <div className="script-meta-badges">
              <span className="badge badge-purple">Format: {scriptData.format_used}</span>
              <span className="badge badge-blue">News: {scriptData.source_news_title}</span>
            </div>
          </div>
          
          <div className="script-body">
            <div className="script-section">
              <h3>🗣️ Spoken Script</h3>
              <div className="script-content">
                <p>{scriptData.script}</p>
              </div>
            </div>

            <div className="script-sidebar">
              <div className="script-section">
                <h3>🎥 Visual Cues</h3>
                <ul className="visual-cues-list">
                  {scriptData.visual_cues.map((cue, index) => (
                    <li key={index}>{cue}</li>
                  ))}
                </ul>
              </div>

              <div className="script-section">
                <h3>🎵 Audio Suggestion</h3>
                <div className="audio-suggestion">
                  {scriptData.suggested_audio}
                </div>
              </div>

              <button className="btn btn-secondary btn-full" onClick={() => handleCopy(scriptData.script)}>
                📋 Copy Script
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && !scriptData && (
        <div className="empty-state">
          <span className="empty-state-icon">📱</span>
          <h3>No Script Generated</h3>
          <p>Click "Generate Script" to automatically pull the latest Apple news, apply a high-converting storytelling structure, and draft a Reel for your brand.</p>
        </div>
      )}
    </div>
  );
}
