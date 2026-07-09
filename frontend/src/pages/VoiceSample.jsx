import { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import './VoiceSample.css';

export default function VoiceSample() {
  const [scriptWritingVoice, setScriptWritingVoice] = useState('');
  const [ideaCategorizationVoice, setIdeaCategorizationVoice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    fetchVoiceSample();
  }, []);

  const fetchVoiceSample = async () => {
    try {
      setLoading(true);
      const data = await api.getVoiceSample();
      setScriptWritingVoice(data.script_writing_voice || '');
      setIdeaCategorizationVoice(data.idea_categorization_voice || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const data = await api.saveVoiceSample({
        script_writing_voice: scriptWritingVoice,
        idea_categorization_voice: ideaCategorizationVoice,
      });
      setSavedAt(data.updated_at);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="voice-sample-container">
        <header className="voice-sample-header">
          <h1>Voice Sample</h1>
          <p>Loading account-wide voice reference...</p>
        </header>
        <div className="shimmer-card voice-sample-shimmer"></div>
        <div className="shimmer-card voice-sample-shimmer"></div>
      </div>
    );
  }

  return (
    <div className="voice-sample-container">
      <header className="voice-sample-header">
        <h1>Voice Sample</h1>
        <p>
          Account-wide creative reference — how scripts get written and how
          ideas get categorized. Every client's Structural Designer and
          Script Writer combine this with that client's own brand profile.
        </p>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="voice-sample-field glass-panel">
        <label htmlFor="script-writing-voice">Script Writing Voice</label>
        <p className="field-hint">Hook distance from brand, bridge technique, tone rules.</p>
        <textarea
          id="script-writing-voice"
          value={scriptWritingVoice}
          onChange={(e) => setScriptWritingVoice(e.target.value)}
          rows={20}
        />
      </div>

      <div className="voice-sample-field glass-panel">
        <label htmlFor="idea-categorization-voice">Idea Categorization Voice</label>
        <p className="field-hint">How topics get broken into content categories/characters.</p>
        <textarea
          id="idea-categorization-voice"
          value={ideaCategorizationVoice}
          onChange={(e) => setIdeaCategorizationVoice(e.target.value)}
          rows={20}
        />
      </div>

      <div className="voice-sample-actions">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <span className="btn-spinner" /> : null} Save
        </button>
        {savedAt && !saving && (
          <span className="saved-indicator">Saved {new Date(savedAt).toLocaleTimeString()}</span>
        )}
      </div>
    </div>
  );
}
