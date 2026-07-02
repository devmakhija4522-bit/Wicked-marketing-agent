import { useState } from 'react';
import { api } from '../utils/api.js';
import './LinkedInDrafts.css';

export default function LinkedInDrafts() {
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setDraft('');
    try {
      const { job_id } = await api.generateGrestLinkedInDraft();
      
      const poll = setInterval(async () => {
        try {
          const status = await api.getJobStatus(job_id);
          if (status.status === 'completed') {
            clearInterval(poll);
            if (status.result && status.result.draft) {
              setDraft(status.result.draft);
            }
            setLoading(false);
          } else if (status.status === 'failed') {
            clearInterval(poll);
            throw new Error(status.error);
          }
        } catch (err) {
          clearInterval(poll);
          console.error(err);
          alert('Failed to generate draft. Check console for details.');
          setLoading(false);
        }
      }, 3000);
    } catch (e) {
      console.error(e);
      alert('Failed to start draft generation. Check console for details.');
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(draft);
    alert('Copied to clipboard!');
  };

  return (
    <div className="linkedin-page">
      <div className="page-header">
        <div className="linkedin-header-row">
          <div>
            <h1><span className="gradient-text">Grest LinkedIn</span> Agent</h1>
            <p>Automated B2B/B2C content drafted from the absolute latest Apple News.</p>
          </div>
          <div className="linkedin-controls">
            <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
              {loading ? 'Agent is Hunting News...' : '✨ Fetch News & Draft'}
            </button>
          </div>
        </div>
      </div>

      <div className="draft-container" style={{ marginTop: '2rem' }}>
        {loading && (
          <div className="drafts-loading" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="skeleton skeleton-text" style={{ width: '100%', height: '40px' }} />
            <div className="skeleton skeleton-text" style={{ width: '80%', height: '20px' }} />
            <div className="skeleton skeleton-text" style={{ width: '90%', height: '20px' }} />
            <div className="skeleton skeleton-text" style={{ width: '100%', height: '150px' }} />
          </div>
        )}

        {!loading && draft && (
          <div className="draft-card glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3>Latest Draft</h3>
            <textarea 
              className="glass-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              style={{ minHeight: '400px', fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-primary)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={handleCopy}>
                📋 Copy to Clipboard
              </button>
            </div>
          </div>
        )}

        {!loading && !draft && (
          <div className="empty-state glass" style={{ padding: '4rem 2rem', textAlign: 'center', borderRadius: '12px' }}>
            <span className="empty-state-icon" style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>💼</span>
            <h3>No Drafts Yet</h3>
            <p style={{ color: 'var(--text-muted)' }}>Click "Fetch News & Draft" to pull the latest Apple news and generate LinkedIn hooks in your voice.</p>
          </div>
        )}
      </div>
    </div>
  );
}
