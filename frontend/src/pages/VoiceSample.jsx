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

  // --- Reference Reels: transcribe + analyze a batch of example links ---
  const [referenceUrls, setReferenceUrls] = useState(['']);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisJobId, setAnalysisJobId] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [applied, setApplied] = useState(false);

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

  const updateReferenceUrl = (index, value) => {
    setReferenceUrls((prev) => prev.map((u, i) => (i === index ? value : u)));
  };

  const addReferenceUrlField = () => {
    setReferenceUrls((prev) => [...prev, '']);
  };

  const removeReferenceUrlField = (index) => {
    setReferenceUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnalyzeReferences = async () => {
    const urls = referenceUrls.map((u) => u.trim()).filter(Boolean);
    if (urls.length === 0) return;
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    setApplied(false);
    try {
      const { job_id } = await api.analyzeReferenceReels(urls);
      setAnalysisJobId(job_id);
    } catch (err) {
      setAnalysisError(err.message || 'Failed to start analysis.');
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!analysisJobId) return;
    const interval = setInterval(async () => {
      try {
        const status = await api.getJobStatus(analysisJobId);
        if (status.status === 'completed') {
          clearInterval(interval);
          setAnalysisResult(status.result);
          setAnalyzing(false);
          setAnalysisJobId(null);
        } else if (status.status === 'failed') {
          clearInterval(interval);
          setAnalysisError(status.error || 'Analysis failed.');
          setAnalyzing(false);
          setAnalysisJobId(null);
        }
      } catch (err) {
        clearInterval(interval);
        setAnalysisError(err.message || 'Failed to fetch job status.');
        setAnalyzing(false);
        setAnalysisJobId(null);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [analysisJobId]);

  const handleApplyAnalysis = () => {
    if (!analysisResult?.updated_script_writing_voice) return;
    setScriptWritingVoice(analysisResult.updated_script_writing_voice);
    setApplied(true);
    document
      .getElementById('script-writing-voice')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

      <div className="voice-sample-field glass-panel reference-reels-field">
        <label>Learn From Reference Reels</label>
        <p className="field-hint">
          Paste links to reels/videos whose storytelling you want WICKED to
          learn from. Each one gets transcribed, and the shared pattern
          across them — hook style, how long it stays ambiguous, how the
          reveal lands — gets folded into Script Writing Voice below for
          you to review before saving.
        </p>

        <div className="reference-url-list">
          {referenceUrls.map((url, index) => (
            <div className="reference-url-row" key={index}>
              <input
                type="text"
                placeholder="Paste a Reel, TikTok, or YouTube link…"
                value={url}
                onChange={(e) => updateReferenceUrl(index, e.target.value)}
                disabled={analyzing}
              />
              {referenceUrls.length > 1 && (
                <button
                  type="button"
                  className="btn btn-icon reference-url-remove"
                  onClick={() => removeReferenceUrlField(index)}
                  disabled={analyzing}
                  aria-label="Remove this link"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="reference-reels-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={addReferenceUrlField}
            disabled={analyzing}
          >
            + Add another
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAnalyzeReferences}
            disabled={analyzing || referenceUrls.every((u) => !u.trim())}
          >
            {analyzing ? <span className="btn-spinner" /> : null}
            {analyzing ? 'Transcribing & analyzing…' : 'Analyze Reels'}
          </button>
        </div>

        {analysisError && <p className="reference-error-note">{analysisError}</p>}

        {analyzing && (
          <div className="reference-loading">
            <div className="skeleton skeleton-text" style={{ height: '20px', width: '40%' }} />
            <div className="skeleton skeleton-text" style={{ height: '100px' }} />
          </div>
        )}

        {!analyzing && analysisResult && (
          <div className="reference-analysis-result">
            <ul className="reference-video-status-list">
              {analysisResult.videos.map((v, i) => (
                <li key={i} className={v.transcribed ? 'transcribed' : 'not-transcribed'}>
                  <span className="reference-video-status-icon">{v.transcribed ? '✓' : '⚠'}</span>
                  <span className="reference-video-url">{v.url}</span>
                  {v.note && <span className="reference-video-note">{v.note}</span>}
                </li>
              ))}
            </ul>

            {analysisResult.pattern_analysis ? (
              <>
                <p className="field-hint" style={{ marginTop: '1rem' }}>Pattern analysis:</p>
                <div className="reference-pattern-preview">{analysisResult.pattern_analysis}</div>
                <button type="button" className="btn btn-primary" onClick={handleApplyAnalysis}>
                  {applied ? '✅ Applied — review below and Save' : 'Apply to Script Writing Voice'}
                </button>
              </>
            ) : (
              <p className="kp-note">
                {analysisResult.note || 'No usable speech found in those links to analyze.'}
              </p>
            )}
          </div>
        )}
      </div>

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
