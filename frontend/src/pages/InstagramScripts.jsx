import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClient } from '../context/ClientContext.jsx';
import { api } from '../utils/api.js';
import './GMMConsole.css';
import './InstagramScripts.css';

const TABS = [
  { id: 'reel-generator', label: 'Reel Generator' },
  { id: 'instagram', label: 'Instagram' },
];

export default function InstagramScripts() {
  const { activeClient } = useClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('instagram');

  // --- Reel Generator tab (existing news + format Reel generator) ---
  const [scriptData, setScriptData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateReelScript = async () => {
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

  // --- Instagram tab: Keyword Planner ---
  const [kpLoading, setKpLoading] = useState(false);
  const [kpResult, setKpResult] = useState(null);
  const [selectedKeywords, setSelectedKeywords] = useState({});
  const [moving, setMoving] = useState(false);
  const [movedKeywords, setMovedKeywords] = useState(null);

  // --- Instagram tab: Structural Designer ---
  const [sdLoading, setSdLoading] = useState(false);
  const [sdResult, setSdResult] = useState(null);
  const [selectedStructures, setSelectedStructures] = useState({});
  const [movingStructures, setMovingStructures] = useState(false);
  const [movedStructuresCount, setMovedStructuresCount] = useState(null);

  // --- Instagram tab: Script Writer ---
  const [swLoading, setSwLoading] = useState(false);
  const [swResult, setSwResult] = useState(null);

  const hasMovedKeywords = movedKeywords !== null && movedKeywords.length > 0;
  const hasMovedStructures = movedStructuresCount !== null && movedStructuresCount > 0;

  const handleFetchTrendingKeywords = async () => {
    if (!activeClient) return;
    setKpLoading(true);
    setKpResult(null);
    setSelectedKeywords({});
    setMovedKeywords(null);
    try {
      const data = await api.runKeywordPlanner(activeClient.id);
      setKpResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setKpLoading(false);
    }
  };

  const toggleKeyword = (kw) => {
    setSelectedKeywords((prev) => {
      const next = { ...prev };
      if (next[kw.phrase]) {
        delete next[kw.phrase];
      } else {
        next[kw.phrase] = kw;
      }
      return next;
    });
  };

  const handleMoveToStructuralDesigner = async () => {
    const chosen = Object.values(selectedKeywords);
    if (chosen.length === 0 || !activeClient) return;
    setMoving(true);
    try {
      await api.saveCreativeStudioState({
        client_id: activeClient.id,
        selected_keywords: chosen,
        selected_structures: [],
      });
      setMovedKeywords(chosen);
      setSdResult(null);
      setSelectedStructures({});
      setMovedStructuresCount(null);
      setSwResult(null);
    } catch (e) {
      console.error(e);
    } finally {
      setMoving(false);
    }
  };

  const handleDesignStructures = async () => {
    if (!activeClient || !hasMovedKeywords) return;
    setSdLoading(true);
    setSdResult(null);
    setSelectedStructures({});
    setMovedStructuresCount(null);
    try {
      const data = await api.runStructuralDesigner(activeClient.id);
      setSdResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setSdLoading(false);
    }
  };

  const toggleStructure = (structure) => {
    setSelectedStructures((prev) => {
      const next = { ...prev };
      if (next[structure.hook_direction]) {
        delete next[structure.hook_direction];
      } else {
        next[structure.hook_direction] = structure;
      }
      return next;
    });
  };

  const handleMoveToScriptWriter = async () => {
    const chosen = Object.values(selectedStructures);
    if (chosen.length === 0 || !activeClient) return;
    setMovingStructures(true);
    try {
      await api.saveCreativeStudioState({
        client_id: activeClient.id,
        selected_keywords: movedKeywords || [],
        selected_structures: chosen,
      });
      setMovedStructuresCount(chosen.length);
      setSwResult(null);
    } catch (e) {
      console.error(e);
    } finally {
      setMovingStructures(false);
    }
  };

  const handleWriteScripts = async () => {
    if (!activeClient || !hasMovedStructures) return;
    setSwLoading(true);
    setSwResult(null);
    try {
      const data = await api.runCreativeStudioScriptWriter(activeClient.id);
      setSwResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setSwLoading(false);
    }
  };

  if (!activeClient) {
    return (
      <div className="instagram-page">
        <div className="empty-state">
          <span className="empty-state-icon">🎬</span>
          <h3>No Client Selected</h3>
          <p>Select a client to use Creative Studio.</p>
          <button className="btn btn-primary" onClick={() => navigate('/clients')}>Go to Clients</button>
        </div>
      </div>
    );
  }

  return (
    <div className="instagram-page">
      <div className="page-header">
        <div className="instagram-header-row">
          <div>
            <h1><span className="gradient-text">{activeClient?.brand_name}</span> Creative Studio</h1>
            <p>Reel generation and the Instagram keyword → structure → script pipeline.</p>
          </div>
          {activeTab === 'reel-generator' && (
            <button className="btn btn-primary" onClick={handleGenerateReelScript} disabled={loading}>
              {loading ? <span className="btn-spinner" /> : '🎬'} Generate Script
            </button>
          )}
        </div>
      </div>

      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'reel-generator' && (
        <>
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
        </>
      )}

      {activeTab === 'instagram' && (
        <div className="pipeline-stages">
          {/* Stage 1: Keyword Planner — always active */}
          <div className="kp-section glass">
            <div className="pipeline-stage-label">Stage 1 of 3</div>
            <h2>🔑 Keyword Planner</h2>
            <p>Automatically fetches what's genuinely trending right now — any creator, any topic — and reshapes it into video-style keyword phrases, the way real, currently-performing videos actually get searched.</p>

            <div className="kp-search-row">
              <button className="btn btn-primary" onClick={handleFetchTrendingKeywords} disabled={kpLoading}>
                {kpLoading ? <span className="btn-spinner" /> : '✨'} Fetch Trending Keywords
              </button>
            </div>

            {kpLoading && <div className="skeleton skeleton-text" style={{ height: '150px', marginTop: '1rem' }} />}

            {!kpLoading && kpResult && (
              <>
                {kpResult.note && <p className="kp-note">{kpResult.note}</p>}

                {kpResult.keywords.length === 0 ? (
                  <div className="empty-state">
                    <h3>No Keywords Generated</h3>
                    <p>Try fetching again in a moment.</p>
                  </div>
                ) : (
                  <ul className="kp-results-list">
                    {kpResult.keywords.map((kw, idx) => (
                      <li key={idx} className={`kp-result-row ${selectedKeywords[kw.phrase] ? 'selected' : ''}`}>
                        <label className="kp-checkbox-label">
                          <input
                            type="checkbox"
                            checked={!!selectedKeywords[kw.phrase]}
                            onChange={() => toggleKeyword(kw)}
                          />
                          <span className="kp-phrase">{kw.phrase}</span>
                        </label>
                        {kw.source_note && <span className="kp-source-note">{kw.source_note}</span>}
                      </li>
                    ))}
                  </ul>
                )}

                {kpResult.keywords.length > 0 && (
                  <div className="kp-actions">
                    <button
                      className="btn btn-primary"
                      onClick={handleMoveToStructuralDesigner}
                      disabled={moving || Object.keys(selectedKeywords).length === 0}
                    >
                      {moving ? <span className="btn-spinner" /> : null} Move to Structural Designer →
                    </button>
                  </div>
                )}
              </>
            )}

            {!kpLoading && !kpResult && (
              <div className="empty-state">
                <span className="empty-state-icon">🔑</span>
                <h3>No Keywords Yet</h3>
                <p>Click "Fetch Trending Keywords" above to discover what's currently trending.</p>
              </div>
            )}

            {hasMovedKeywords && (
              <span className="kp-moved-indicator">Carried forward: {movedKeywords.length} keyword{movedKeywords.length === 1 ? '' : 's'} ✓</span>
            )}
          </div>

          {/* Stage 2: Structural Designer — locked until keywords are moved forward */}
          <div className={`kp-section glass sd-section ${!hasMovedKeywords ? 'pipeline-stage-locked' : ''}`}>
            <div className="pipeline-stage-label">Stage 2 of 3</div>
            <h2>🧱 Structural Designer</h2>
            <p>Generate script structures — hook direction + beat outline — from the keywords carried forward above.</p>

            {!hasMovedKeywords ? (
              <div className="empty-state">
                <span className="empty-state-icon">🔒</span>
                <h3>Locked</h3>
                <p>Select keywords in Stage 1 and click "Move to Structural Designer →" to unlock this stage.</p>
              </div>
            ) : (
              <>
                <div className="kp-search-row">
                  <button className="btn btn-primary" onClick={handleDesignStructures} disabled={sdLoading}>
                    {sdLoading ? <span className="btn-spinner" /> : '🧱'} Design Structures
                  </button>
                </div>

                {sdLoading && <div className="skeleton skeleton-text" style={{ height: '150px', marginTop: '1rem' }} />}

                {!sdLoading && sdResult && (
                  <>
                    {sdResult.note && <p className="kp-note">{sdResult.note}</p>}

                    {sdResult.structures.length === 0 ? (
                      <div className="empty-state">
                        <h3>No Structures Generated</h3>
                        <p>Try designing again, or move different keywords forward.</p>
                      </div>
                    ) : (
                      <ul className="sd-results-list">
                        {sdResult.structures.map((s, idx) => (
                          <li key={idx} className={`sd-result-row ${selectedStructures[s.hook_direction] ? 'selected' : ''}`}>
                            <label className="kp-checkbox-label sd-checkbox-label">
                              <input
                                type="checkbox"
                                checked={!!selectedStructures[s.hook_direction]}
                                onChange={() => toggleStructure(s)}
                              />
                              <div>
                                <p className="sd-hook">{s.hook_direction}</p>
                                <ul className="sd-beats">
                                  {s.beat_outline.map((beat, bIdx) => (
                                    <li key={bIdx}>{beat}</li>
                                  ))}
                                </ul>
                                {s.source_keyword && <span className="kp-source-note">From: {s.source_keyword}</span>}
                              </div>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}

                    {sdResult.structures.length > 0 && (
                      <div className="kp-actions">
                        <button
                          className="btn btn-primary"
                          onClick={handleMoveToScriptWriter}
                          disabled={movingStructures || Object.keys(selectedStructures).length === 0}
                        >
                          {movingStructures ? <span className="btn-spinner" /> : null} Move to Script Writer →
                        </button>
                      </div>
                    )}
                  </>
                )}

                {hasMovedStructures && (
                  <span className="kp-moved-indicator">Carried forward: {movedStructuresCount} structure{movedStructuresCount === 1 ? '' : 's'} ✓</span>
                )}
              </>
            )}
          </div>

          {/* Stage 3: Script Writer — locked until structures are moved forward */}
          <div className={`kp-section glass sd-section ${!hasMovedStructures ? 'pipeline-stage-locked' : ''}`}>
            <div className="pipeline-stage-label">Stage 3 of 3</div>
            <h2>✍️ Script Writer</h2>
            <p>Write full scripts from the structures carried forward above, applying the Script Writing Voice strictly.</p>

            {!hasMovedStructures ? (
              <div className="empty-state">
                <span className="empty-state-icon">🔒</span>
                <h3>Locked</h3>
                <p>Select structures in Stage 2 and click "Move to Script Writer →" to unlock this stage.</p>
              </div>
            ) : (
              <>
                <div className="kp-search-row">
                  <button className="btn btn-primary" onClick={handleWriteScripts} disabled={swLoading}>
                    {swLoading ? <span className="btn-spinner" /> : '✍️'} Write Scripts
                  </button>
                </div>

                {swLoading && (
                  <div className="scripts-loading" style={{ marginTop: '1rem' }}>
                    <div className="skeleton skeleton-text" style={{ height: '40px', width: '60%' }} />
                    <div className="skeleton skeleton-text" style={{ height: '200px' }} />
                  </div>
                )}

                {!swLoading && swResult && (
                  <>
                    {swResult.note && <p className="kp-note">{swResult.note}</p>}

                    {swResult.scripts.length === 0 ? (
                      <div className="empty-state">
                        <h3>No Scripts Generated</h3>
                        <p>Try writing again, or move different structures forward.</p>
                      </div>
                    ) : (
                      <div className="sw-scripts-list">
                        {swResult.scripts.map((script) => (
                          <div key={script.id} className="script-container glass sw-script-card">
                            <div className="script-header">
                              <h2>{script.title}</h2>
                              <div className="script-meta-badges">
                                <span className="badge badge-purple">{script.total_duration_seconds}s</span>
                                {script.hashtags && script.hashtags.length > 0 && (
                                  <span className="badge badge-blue">{script.hashtags.length} hashtags</span>
                                )}
                              </div>
                            </div>

                            <div className="script-content">
                              <p>{script.full_script_text || 'No script text returned.'}</p>
                            </div>

                            {script.caption_suggestion && (
                              <div className="script-section">
                                <h3>📝 Caption</h3>
                                <p>{script.caption_suggestion}</p>
                              </div>
                            )}

                            <button className="btn btn-secondary btn-full" onClick={() => handleCopy(script.full_script_text)}>
                              📋 Copy Script
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
