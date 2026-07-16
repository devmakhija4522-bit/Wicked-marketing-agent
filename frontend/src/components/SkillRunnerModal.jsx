import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useClient } from '../context/ClientContext.jsx';
import { api } from '../utils/api.js';
import './SkillRunnerModal.css';

const MAX_POLL_ATTEMPTS = 150; // ~5 minutes at 2s/attempt

function extractHtmlBlocks(markdown) {
  const blocks = [];
  const regex = /```html\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    blocks.push(match[1]);
  }
  return blocks;
}

export default function SkillRunnerModal({ skill, onClose, historyEntry = null }) {
  const { clients, activeClient } = useClient();

  const [brief, setBrief] = useState(historyEntry?.brief || '');
  const [selectedClientId, setSelectedClientId] = useState(activeClient?.id || '');
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [result, setResult] = useState(historyEntry?.markdown || null);
  const [error, setError] = useState(null);
  const [timedOut, setTimedOut] = useState(false);

  const readOnly = Boolean(historyEntry);

  const handleRun = async () => {
    if (!brief.trim()) {
      setError('Please describe what you need before running this skill.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setTimedOut(false);

    try {
      const response = await api.runMarketingSkill(skill.id, brief, selectedClientId || null);
      setJobId(response.job_id);
    } catch (err) {
      setError(err.message || 'Failed to start this skill.');
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval;
    let attempts = 0;
    if (jobId) {
      interval = setInterval(async () => {
        attempts += 1;
        try {
          const statusRes = await api.getJobStatus(jobId);
          if (statusRes.status === 'completed') {
            setResult(statusRes.result?.markdown || '');
            setLoading(false);
            setJobId(null);
            clearInterval(interval);
          } else if (statusRes.status === 'failed') {
            setError(statusRes.error || 'This skill failed to run.');
            setLoading(false);
            setJobId(null);
            clearInterval(interval);
          } else if (attempts >= MAX_POLL_ATTEMPTS) {
            setTimedOut(true);
            setLoading(false);
            setJobId(null);
            clearInterval(interval);
          }
        } catch (err) {
          setError('Failed to check on this run.');
          setLoading(false);
          setJobId(null);
          clearInterval(interval);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [jobId]);

  const htmlBlocks = skill.id === 'ad-creative' && result ? extractHtmlBlocks(result) : [];

  return (
    <div className="skill-modal-overlay" onClick={onClose}>
      <div className="skill-modal" onClick={(e) => e.stopPropagation()}>
        <div className="skill-modal-header">
          <div>
            <span className="badge badge-purple">{skill.category_label}</span>
            <h2>{skill.label}</h2>
            <p>{skill.description}</p>
          </div>
          <button className="btn btn-icon btn-ghost skill-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="skill-modal-body">
          {!readOnly && !result && (
            <>
              <label className="skill-modal-label">Brief</label>
              <textarea
                className="input-field"
                rows={5}
                placeholder={skill.input_hint}
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                disabled={loading}
              />

              {clients?.length > 0 && (
                <>
                  <label className="skill-modal-label">Client (optional — adds brand context)</label>
                  <select
                    className="input-field"
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">None — account-wide</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.brand_name || c.id}</option>
                    ))}
                  </select>
                </>
              )}

              <button className="btn btn-primary skill-modal-run" onClick={handleRun} disabled={loading}>
                {loading ? 'Running…' : 'Run Skill'}
              </button>

              {loading && (
                <p className="skill-modal-hint">
                  This can take a minute or two — it's doing real web research, not just generating text.
                </p>
              )}
              {timedOut && (
                <p className="skill-modal-hint">
                  Still running in the background. Close this and check "View past runs" shortly —
                  it'll be saved there once it finishes.
                </p>
              )}
              {error && <p className="skill-modal-error">{error}</p>}
            </>
          )}

          {result && (
            <div className="skill-modal-result">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ children }) => (
                    <div className="skill-modal-table-wrap"><table>{children}</table></div>
                  ),
                }}
              >
                {result}
              </ReactMarkdown>

              {htmlBlocks.map((html, idx) => (
                <div key={idx} className="skill-ad-preview">
                  <p className="skill-modal-label">Ad {idx + 1} preview</p>
                  <iframe
                    className="skill-ad-preview-frame"
                    srcDoc={html}
                    sandbox=""
                    title={`Ad concept ${idx + 1}`}
                  />
                </div>
              ))}

              {!readOnly && (
                <button className="btn btn-secondary" onClick={() => setResult(null)}>
                  Run again
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
