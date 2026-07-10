import { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import './Remix.css';

export default function Remix() {
  const [videoUrl, setVideoUrl] = useState('');
  const [tone, setTone] = useState('');
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleRemix = async () => {
    if (!videoUrl.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await api.runRemix(videoUrl.trim(), tone);
      setJobId(response.job_id);
    } catch (err) {
      setError(err.message || 'Failed to start remix job.');
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
            setResult(statusRes.result);
            setLoading(false);
            setJobId(null);
            clearInterval(interval);
          } else if (statusRes.status === 'failed') {
            setError(statusRes.error || 'Remix failed.');
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
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [jobId]);

  const hasRemix = result && result.remixed_script;

  return (
    <div className="remix-page">
      <div className="page-header">
        <h1><span className="gradient-text">Remix</span></h1>
        <p>Paste any Instagram Reel, TikTok, or YouTube link. Wicked transcribes it and rewrites it in your Voice Sample — ready to record.</p>
      </div>

      <div className="remix-card glass">
        <div className="remix-form-row">
          <input
            type="text"
            className="remix-url-input"
            placeholder="Paste an Instagram Reel, TikTok, or YouTube link…"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRemix()}
          />
        </div>

        <div className="remix-form-row remix-tone-row">
          <label htmlFor="remix-tone">Tone (optional)</label>
          <select id="remix-tone" value={tone} onChange={(e) => setTone(e.target.value)}>
            <option value="">Default (Voice Sample as-is)</option>
            <option value="punchy">Punchy</option>
            <option value="story-driven">Story-driven</option>
            <option value="educational">Educational</option>
          </select>
        </div>

        <button className="btn btn-primary remix-submit" onClick={handleRemix} disabled={loading || !videoUrl.trim()}>
          {loading ? <span className="btn-spinner" /> : '🎬'} {loading ? 'Transcribing & remixing…' : 'Remix this video'}
        </button>

        {error && <div className="error-message">{error}</div>}
      </div>

      {loading && !result && (
        <div className="remix-card glass" style={{ marginTop: '1.5rem' }}>
          <div className="skeleton skeleton-text" style={{ height: '24px', width: '40%' }} />
          <div className="skeleton skeleton-text" style={{ height: '150px', marginTop: '1rem' }} />
        </div>
      )}

      {result && (
        <div className="remix-results">
          <div className="remix-card glass">
            <div className="remix-result-header">
              <h2>📝 Original Transcript</h2>
              <span className="badge badge-blue">{result.platform}</span>
              {result.estimated_duration_seconds > 0 && (
                <span className="badge badge-purple">{result.estimated_duration_seconds}s</span>
              )}
            </div>
            {result.summary && <p className="remix-summary">{result.summary}</p>}
            {result.transcript ? (
              <p className="remix-transcript-text">{result.transcript}</p>
            ) : (
              <div className="empty-state">
                <span className="empty-state-icon">🔇</span>
                <h3>No speech detected</h3>
                <p>This clip may be music-only or the audio couldn't be transcribed.</p>
              </div>
            )}
            {result.transcript && (
              <button className="btn btn-secondary btn-sm" onClick={() => handleCopy(result.transcript, 'transcript')}>
                {copiedField === 'transcript' ? '✅ Copied' : '📋 Copy Transcript'}
              </button>
            )}
          </div>

          {hasRemix && (
            <div className="remix-card glass remix-output-card">
              <div className="remix-result-header">
                <h2>✨ Remixed — In Your Voice</h2>
                {result.hook_pattern && <span className="badge badge-green">{result.hook_pattern}</span>}
              </div>

              {result.remixed_hook && (
                <div className="remix-section">
                  <h3>Hook</h3>
                  <p className="remix-hook-text">{result.remixed_hook}</p>
                </div>
              )}

              <div className="remix-section">
                <h3>Full Script</h3>
                <p className="remix-script-text">{result.remixed_script}</p>
              </div>

              {result.caption_options && result.caption_options.length > 0 && (
                <div className="remix-section">
                  <h3>Caption Options</h3>
                  <ul className="remix-caption-list">
                    {result.caption_options.map((cap, idx) => (
                      <li key={idx} className="remix-caption-item">
                        <span>{cap}</span>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleCopy(cap, `caption-${idx}`)}>
                          {copiedField === `caption-${idx}` ? '✅' : '📋'}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="remix-actions">
                <button className="btn btn-primary" onClick={() => handleCopy(result.remixed_script, 'script')}>
                  {copiedField === 'script' ? '✅ Copied' : '📋 Copy Script'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
