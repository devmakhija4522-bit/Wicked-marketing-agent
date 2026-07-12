import { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import './VoiceSample.css';

export default function VoiceSample() {
  const [categories, setCategories] = useState([]);
  const [notes, setNotes] = useState({ satire: '', emotional: '', infographic: '' });
  const [referenceProfiles, setReferenceProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);

  // --- Reference Reels: one link at a time -> analyze -> Approve saves it ---
  const [referenceUrl, setReferenceUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisJobId, setAnalysisJobId] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [profileName, setProfileName] = useState('');
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState(null);
  const [justApproved, setJustApproved] = useState(null);

  useEffect(() => {
    fetchVoiceCategories();
    fetchVoiceSample();
  }, []);

  const fetchVoiceCategories = async () => {
    try {
      const data = await api.getVoiceCategories();
      setCategories(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVoiceSample = async () => {
    try {
      setLoading(true);
      const data = await api.getVoiceSample();
      setNotes({
        satire: data.satire_notes || '',
        emotional: data.emotional_notes || '',
        infographic: data.infographic_notes || '',
      });
      setReferenceProfiles(data.reference_profiles || []);
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
        satire_notes: notes.satire,
        emotional_notes: notes.emotional,
        infographic_notes: notes.infographic,
      });
      setSavedAt(data.updated_at);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyzeReference = async () => {
    const url = referenceUrl.trim();
    if (!url) return;
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    setApproveError(null);
    setJustApproved(null);
    try {
      const { job_id } = await api.analyzeReferenceReel(url);
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
          setProfileName(status.result?.suggested_name || '');
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

  const handleApproveReference = async () => {
    if (!analysisResult?.pattern_analysis || !profileName.trim()) return;
    setApproving(true);
    setApproveError(null);
    try {
      const data = await api.approveReferenceProfile({
        name: profileName.trim(),
        url: analysisResult.url,
        platform: analysisResult.platform,
        analysis: analysisResult.pattern_analysis,
      });
      setReferenceProfiles(data.reference_profiles || []);
      setSavedAt(data.updated_at);
      setJustApproved(profileName.trim());
      // Reset for the next link — "and so on".
      setReferenceUrl('');
      setAnalysisResult(null);
      setProfileName('');
    } catch (err) {
      setApproveError(err.message || 'Failed to approve.');
    } finally {
      setApproving(false);
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
          Account-wide creative reference. Every script is written through
          one of the 3 categories below — Structural Designer and Script
          Writer combine the selected category's concept with that
          client's own brand profile. Picking a category is required when
          generating; the notes here are optional extra tuning.
        </p>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="voice-sample-field glass-panel reference-reels-field">
        <label>Learn From Reference Reels</label>
        <p className="field-hint">
          Paste one reel/video link whose storytelling you want WICKED to
          learn from. It gets transcribed and analyzed, then Approve saves
          it straight to Voice Sample as its own named profile — paste the
          next link and repeat to keep building the library.
        </p>

        <div className="reference-url-row">
          <input
            type="text"
            placeholder="Paste a Reel, TikTok, or YouTube link…"
            value={referenceUrl}
            onChange={(e) => setReferenceUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeReference()}
            disabled={analyzing}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAnalyzeReference}
            disabled={analyzing || !referenceUrl.trim()}
          >
            {analyzing ? <span className="btn-spinner" /> : null}
            {analyzing ? 'Analyzing…' : 'Analyze'}
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
            {!analysisResult.transcribed ? (
              <p className="reference-error-note">
                {analysisResult.note || 'Could not get a usable transcript from that link.'}
              </p>
            ) : analysisResult.pattern_analysis ? (
              <>
                <p className="field-hint">Pattern analysis:</p>
                <div className="reference-pattern-preview">{analysisResult.pattern_analysis}</div>

                <label className="reference-name-label" htmlFor="reference-profile-name">
                  Save as
                </label>
                <div className="reference-approve-row">
                  <input
                    id="reference-profile-name"
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    disabled={approving}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleApproveReference}
                    disabled={approving || !profileName.trim()}
                  >
                    {approving ? <span className="btn-spinner" /> : null}
                    {approving ? 'Approving…' : 'Approve'}
                  </button>
                </div>
                {approveError && <p className="reference-error-note">{approveError}</p>}
              </>
            ) : (
              <p className="reference-error-note">
                {analysisResult.note || 'Analysis did not return usable output.'}
              </p>
            )}
          </div>
        )}

        {justApproved && (
          <p className="reference-approved-note">
            ✅ Approved as {justApproved} — saved straight to Voice Sample below.
          </p>
        )}

        {referenceProfiles.length > 0 && (
          <div className="reference-profile-library">
            <p className="field-hint">Approved profiles ({referenceProfiles.length}):</p>
            <ul className="reference-profile-list">
              {referenceProfiles.map((p, i) => (
                <li key={i}>
                  <span className="reference-profile-name">{p.name}</span>
                  <span className="reference-profile-url">{p.url}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="voice-category-grid">
        {categories.map((cat) => (
          <div key={cat.key} className="voice-category-card glass-panel">
            <div className="voice-category-card-header">
              <span className="voice-category-label">{cat.label}</span>
              <span className="voice-category-concept">{cat.concept_name}</span>
            </div>
            <p className="voice-category-description">{cat.short_description}</p>
            <label htmlFor={`notes-${cat.key}`} className="voice-category-notes-label">
              Your notes for this category (optional)
            </label>
            <textarea
              id={`notes-${cat.key}`}
              value={notes[cat.key] || ''}
              onChange={(e) => setNotes((prev) => ({ ...prev, [cat.key]: e.target.value }))}
              rows={8}
              placeholder="Add brand-specific tuning, examples, or reminders for this category…"
            />
          </div>
        ))}
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
