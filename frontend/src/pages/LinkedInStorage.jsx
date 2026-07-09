import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useClient } from '../context/ClientContext.jsx';
import { api } from '../utils/api.js';
import './LinkedInStorage.css';
import './LinkedInDrafts.css'; // Reuse Mockup UI CSS

// Source/reference links in generated drafts should open in a new tab,
// not navigate the user away from the app.
const markdownLinkComponents = {
  a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
};

export default function LinkedInStorage() {
  const { activeClient } = useClient();
  const [drafts, setDrafts] = useState([]);
  const [selectedDraftId, setSelectedDraftId] = useState(null);
  const [draftContent, setDraftContent] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    if (activeClient) {
      fetchDraftsList();
      setSelectedDraftId(null);
      setDraftContent('');
    }
  }, [activeClient]);

  const fetchDraftsList = async () => {
    if (!activeClient) return;
    try {
      setLoadingList(true);
      const res = await api.getLinkedInStorageDrafts(activeClient.id);
      setDrafts(res.drafts || []);
    } catch (err) {
      console.error('Failed to load drafts:', err);
    } finally {
      setLoadingList(false);
    }
  };

  const loadDraftContent = async (id) => {
    if (!activeClient) return;
    try {
      setSelectedDraftId(id);
      setLoadingContent(true);
      const res = await api.getLinkedInStorageDraft(id, activeClient.id);
      setDraftContent(res.content || '');
    } catch (err) {
      console.error('Failed to load draft content:', err);
      setDraftContent('Error loading draft content.');
    } finally {
      setLoadingContent(false);
    }
  };

  const handleCopy = () => {
    if (!draftContent) return;
    navigator.clipboard.writeText(draftContent);
    alert('Draft copied to clipboard!');
  };

  return (
    <div className="linkedin-storage-page">
      <div className="page-header">
        <div>
          <h2>LinkedIn Storage 🗄️</h2>
          <p className="subtitle">Review your daily automated news drafts.</p>
        </div>
      </div>

      <div className="storage-layout">
        {/* Left Panel: List of Dates */}
        <div className="storage-sidebar glass">
          <h3>History</h3>
          {loadingList ? (
            <p style={{ padding: '1rem', color: 'var(--text-muted)' }}>Loading...</p>
          ) : drafts.length === 0 ? (
            <p style={{ padding: '1rem', color: 'var(--text-muted)' }}>No drafts saved yet.</p>
          ) : (
            <ul className="storage-list">
              {drafts.map((d) => (
                <li 
                  key={d} 
                  className={`storage-item ${selectedDraftId === d ? 'active' : ''}`}
                  onClick={() => loadDraftContent(d)}
                >
                  <span className="storage-icon">📄</span>
                  <span className="storage-name">{d}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right Panel: Content View */}
        <div className="storage-content">
          {!selectedDraftId ? (
            <div className="empty-state glass">
              <p>Select a date from the left to view its draft.</p>
            </div>
          ) : loadingContent ? (
            <div className="empty-state glass">
              <div className="spinner"></div>
              <p>Loading draft...</p>
            </div>
          ) : (
            <div className="draft-card glass" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>{selectedDraftId}</h3>
                <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
                  📋 Copy to Clipboard
                </button>
              </div>

              {/* Reuse Premium Mockup UI from LinkedInDrafts.jsx */}
              <div className="linkedin-mockup-card">
                <div className="linkedin-mockup-header">
                  <div className="linkedin-avatar">{activeClient?.brand_name?.[0] || 'G'}</div>
                  <div className="linkedin-author-info">
                    <span className="linkedin-author-name">{activeClient?.brand_name || 'Grest'} Marketing</span>
                    <span className="linkedin-author-meta">{selectedDraftId.replace('OUTPUT- ', '')} • 🌐</span>
                  </div>
                </div>
                <div className="linkedin-mockup-body">
                  <ReactMarkdown components={markdownLinkComponents}>{draftContent}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
