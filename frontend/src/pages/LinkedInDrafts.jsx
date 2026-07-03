import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useClient } from '../context/ClientContext.jsx';
import { api } from '../utils/api.js';
import './LinkedInDrafts.css';

export default function LinkedInDrafts() {
  const { activeClient, refreshClients } = useClient();
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newReference, setNewReference] = useState('');
  const [showReferences, setShowReferences] = useState(false);

  const clientReferences = activeClient?.linkedin_references || [];

  const handleGenerate = async () => {
    setLoading(true);
    setDraft('');
    try {
      const { job_id } = await api.generateLinkedInDraft({
        client_id: activeClient?.id || 'generic',
        references: clientReferences.join('\n\n--- NEXT REFERENCE ---\n\n')
      });
      
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
            <h1><span className="gradient-text">{activeClient?.brand_name || 'Grest'} LinkedIn</span> Agent</h1>
            <p>Automated B2B/B2C content drafted from the absolute latest industry news.</p>
          </div>
          <div className="linkedin-controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={() => setShowReferences(!showReferences)}>
              {showReferences ? 'Hide References' : '📝 Add Style References'}
            </button>
            <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
              {loading ? 'Agent is Hunting News...' : '✨ Fetch News & Draft'}
            </button>
          </div>
        </div>

        {showReferences && (
          <div className="references-section glass" style={{ marginTop: '1.5rem', padding: '1.5rem', borderRadius: '12px', animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>Saved Style References</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Add sample posts below. The agent will analyze their structure and tone for all future {activeClient?.brand_name || 'this client'} drafts.
            </p>

            {clientReferences.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {clientReferences.map((ref, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong>Reference {idx + 1}</strong>
                      <div style={{ marginTop: '0.25rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', maxHeight: '100px', overflowY: 'auto' }}>
                        {ref}
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        const updated = clientReferences.filter((_, i) => i !== idx);
                        await api.updateClient(activeClient.id, { linkedin_references: updated });
                        refreshClients();
                      }}
                      style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', padding: '0.25rem' }}
                      title="Remove Reference"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <textarea
                className="glass-input"
                placeholder="Paste a new sample post here..."
                value={newReference}
                onChange={(e) => setNewReference(e.target.value)}
                style={{ minHeight: '100px', fontSize: '0.95rem' }}
              />
              <button 
                className="btn btn-secondary" 
                style={{ alignSelf: 'flex-end' }}
                onClick={async () => {
                  if (!newReference.trim() || !activeClient) return;
                  const updated = [...clientReferences, newReference.trim()];
                  try {
                    await api.updateClient(activeClient.id, { linkedin_references: updated });
                    setNewReference('');
                    refreshClients(); // Refresh context to get new client data
                  } catch (e) {
                    console.error(e);
                    alert("Failed to save reference");
                  }
                }}
                disabled={!newReference.trim() || !activeClient}
              >
                💾 Save Reference
              </button>
            </div>
          </div>
        )}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Latest Draft</h3>
              <button 
                className="btn btn-sm btn-secondary" 
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? '👀 Preview Mode' : '✏️ Edit Draft'}
              </button>
            </div>

            {editMode ? (
              <textarea 
                className="glass-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                style={{ minHeight: '400px', fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-primary)' }}
              />
            ) : (
              <div className="linkedin-mockup-card">
                <div className="linkedin-mockup-header">
                  <div className="linkedin-avatar">{activeClient?.brand_name?.[0] || 'G'}</div>
                  <div className="linkedin-author-info">
                    <span className="linkedin-author-name">{activeClient?.brand_name || 'Grest'} Marketing</span>
                    <span className="linkedin-author-meta">Just now • 🌐</span>
                  </div>
                </div>
                <div className="linkedin-mockup-body">
                  <ReactMarkdown>{draft}</ReactMarkdown>
                </div>
              </div>
            )}

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
            <p style={{ color: 'var(--text-muted)' }}>Click "Fetch News & Draft" to pull the latest industry news and generate LinkedIn hooks in your voice.</p>
          </div>
        )}
      </div>
    </div>
  );
}
