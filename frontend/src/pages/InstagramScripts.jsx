import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClient } from '../context/ClientContext.jsx';
import { api } from '../utils/api.js';
import './GMMConsole.css';
import './InstagramScripts.css';

/** Shared, clean rendering for a GeneratedScript — heading, hook, each
 * section as a subheading + body, and a trailing caption — used by both
 * Content Generator's Script Writer stage and the independent Remix
 * feature, so saved/displayed scripts look identical everywhere. */
function ScriptCard({ script, actions }) {
  return (
    <div className="script-container glass sw-script-card">
      <div className="script-header">
        <h2>{script.title}</h2>
        <div className="script-meta-badges">
          <span className="badge badge-purple">{script.total_duration_seconds}s</span>
          {script.hashtags && script.hashtags.length > 0 && (
            <span className="badge badge-blue">{script.hashtags.length} hashtags</span>
          )}
          {script.category && (
            <span className="badge badge-crimson">{script.category.charAt(0).toUpperCase() + script.category.slice(1)}</span>
          )}
        </div>
      </div>

      {script.hook_line && (
        <div className="script-section">
          <h3>Hook</h3>
          <p className="sd-hook">{script.hook_line}</p>
        </div>
      )}

      {script.sections && script.sections.length > 0 ? (
        script.sections.map((sec, idx) => (
          <div className="script-section" key={idx}>
            <h3>{sec.section_name}</h3>
            <p>{sec.dialogue}</p>
          </div>
        ))
      ) : (
        <div className="script-content">
          <p>{script.full_script_text || 'No script text returned.'}</p>
        </div>
      )}

      {script.caption_suggestion && (
        <div className="script-section">
          <h3>Caption</h3>
          <p>{script.caption_suggestion}</p>
        </div>
      )}

      {actions}
    </div>
  );
}

export default function InstagramScripts() {
  const { activeClient } = useClient();
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState('content-generator');

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  // --- Voice Sample category (required — Satire/Emotional/Infographic) ---
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    api.getVoiceCategories().then(setCategories).catch((e) => console.error(e));
  }, []);

  // --- Content Generator: Keyword Planner ---
  const [kpLoading, setKpLoading] = useState(false);
  const [kpResult, setKpResult] = useState(null);
  const [selectedKeywords, setSelectedKeywords] = useState({});
  const [moving, setMoving] = useState(false);
  const [movedKeywords, setMovedKeywords] = useState(null);

  // --- Content Generator: AI Idea Chat (alternative to Fetch Trending Keywords) ---
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatJobId, setChatJobId] = useState(null);
  const [chatError, setChatError] = useState(null);
  const [movingChatTopicIds, setMovingChatTopicIds] = useState({});
  const [movedChatTopicIds, setMovedChatTopicIds] = useState({});

  // --- Content Generator: Structural Designer ---
  const [sdLoading, setSdLoading] = useState(false);
  const [sdResult, setSdResult] = useState(null);
  const [selectedStructures, setSelectedStructures] = useState({});
  const [movingStructures, setMovingStructures] = useState(false);
  const [movedStructures, setMovedStructures] = useState(null);

  // --- Content Generator: Script Writer ---
  const [swLoading, setSwLoading] = useState(false);
  const [swResult, setSwResult] = useState(null);
  const [savingScriptIds, setSavingScriptIds] = useState({});
  const [savedScriptIds, setSavedScriptIds] = useState({});

  const hasMovedKeywords = movedKeywords !== null && movedKeywords.length > 0;
  const hasMovedStructures = movedStructures !== null && movedStructures.length > 0;

  const findKeywordForStructure = (structure) =>
    (movedKeywords || []).find((k) => k.phrase === structure?.source_keyword) || null;

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

  const handleSendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text || !activeClient || chatSending) return;
    const nextMessages = [...chatMessages, { role: 'user', content: text }];
    setChatMessages(nextMessages);
    setChatInput('');
    setChatSending(true);
    setChatError(null);
    try {
      const { job_id } = await api.runIdeaChat(
        activeClient.id,
        nextMessages.map((m) => ({ role: m.role, content: m.content }))
      );
      setChatJobId(job_id);
    } catch (e) {
      setChatError(e.message || 'Failed to send message.');
      setChatSending(false);
    }
  };

  useEffect(() => {
    if (!chatJobId) return;
    const interval = setInterval(async () => {
      try {
        const status = await api.getJobStatus(chatJobId);
        if (status.status === 'completed') {
          clearInterval(interval);
          const r = status.result;
          setChatMessages((prev) => [
            ...prev,
            { role: 'assistant', content: r.reply, ready: r.ready, topic: r.topic },
          ]);
          setChatSending(false);
          setChatJobId(null);
        } else if (status.status === 'failed') {
          clearInterval(interval);
          setChatError(status.error || 'Chat failed.');
          setChatSending(false);
          setChatJobId(null);
        }
      } catch (e) {
        clearInterval(interval);
        setChatError(e.message || 'Failed to fetch job status.');
        setChatSending(false);
        setChatJobId(null);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [chatJobId]);

  const handleMoveChatTopicToStructuralDesigner = async (topic, idx) => {
    if (!activeClient || !topic) return;
    const keyword = { phrase: topic, source_note: 'From AI chat' };
    setMovingChatTopicIds((prev) => ({ ...prev, [idx]: true }));
    try {
      await api.saveCreativeStudioState({
        client_id: activeClient.id,
        selected_keywords: [keyword],
        selected_structures: [],
      });
      setMovedKeywords([keyword]);
      setSdResult(null);
      setSelectedStructures({});
      setMovedStructures(null);
      setSwResult(null);
      setMovedChatTopicIds((prev) => ({ ...prev, [idx]: true }));
    } catch (e) {
      console.error(e);
      alert('Failed to move to Structural Designer.');
    } finally {
      setMovingChatTopicIds((prev) => ({ ...prev, [idx]: false }));
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
      setMovedStructures(null);
      setSwResult(null);
    } catch (e) {
      console.error(e);
    } finally {
      setMoving(false);
    }
  };

  const handleDesignStructures = async () => {
    if (!activeClient || !hasMovedKeywords || !selectedCategory) return;
    setSdLoading(true);
    setSdResult(null);
    setSelectedStructures({});
    setMovedStructures(null);
    try {
      const data = await api.runStructuralDesigner(activeClient.id, selectedCategory);
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
      setMovedStructures(chosen);
      setSwResult(null);
      setSavingScriptIds({});
      setSavedScriptIds({});
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
    setSavingScriptIds({});
    setSavedScriptIds({});
    try {
      const data = await api.runCreativeStudioScriptWriter(activeClient.id, selectedCategory);
      setSwResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setSwLoading(false);
    }
  };

  const handleSaveScript = async (script, index) => {
    if (!activeClient) return;
    const structure = (movedStructures || [])[index] || null;
    const keyword = findKeywordForStructure(structure);
    const dateStr = new Date().toLocaleDateString();
    const nameSource = structure?.source_keyword || script.title || 'Script';
    const title = `${activeClient.brand_name} — ${nameSource} — ${dateStr}`;

    setSavingScriptIds((prev) => ({ ...prev, [script.id]: true }));
    try {
      await api.saveToVault({
        client_id: activeClient.id,
        title,
        format: 'Creative Studio',
        content: { keyword, structure, script },
      });
      setSavedScriptIds((prev) => ({ ...prev, [script.id]: true }));
    } catch (e) {
      console.error(e);
      alert('Failed to save to Vault.');
    } finally {
      setSavingScriptIds((prev) => ({ ...prev, [script.id]: false }));
    }
  };

  // --- Remix: fully independent feature, beside Content Generator ---
  const [remixUrl, setRemixUrl] = useState('');
  const [remixTone, setRemixTone] = useState('');
  const [remixLoading, setRemixLoading] = useState(false);
  const [remixJobId, setRemixJobId] = useState(null);
  const [remixResult, setRemixResult] = useState(null);
  const [remixError, setRemixError] = useState(null);
  const [remixSelected, setRemixSelected] = useState(false);
  const [remixMoving, setRemixMoving] = useState(false);
  const [remixMoved, setRemixMoved] = useState(false);
  const [remixCategory, setRemixCategory] = useState('');

  const handleRemixVideo = () => {
    if (!remixUrl.trim() || !activeClient || !remixCategory) return;
    setRemixLoading(true);
    setRemixError(null);
    setRemixResult(null);
    setRemixSelected(false);
    setRemixMoved(false);
    api.runCreativeStudioRemix(activeClient.id, remixUrl.trim(), remixTone, remixCategory)
      .then((response) => setRemixJobId(response.job_id))
      .catch((err) => {
        setRemixError(err.message || 'Failed to start remix job.');
        setRemixLoading(false);
      });
  };

  useEffect(() => {
    if (!remixJobId) return;
    const interval = setInterval(async () => {
      try {
        const status = await api.getJobStatus(remixJobId);
        if (status.status === 'completed') {
          clearInterval(interval);
          setRemixResult(status.result);
          setRemixLoading(false);
          setRemixJobId(null);
        } else if (status.status === 'failed') {
          clearInterval(interval);
          setRemixError(status.error || 'Remix failed.');
          setRemixLoading(false);
          setRemixJobId(null);
        }
      } catch (err) {
        clearInterval(interval);
        console.error(err);
        setRemixError('Failed to fetch job status.');
        setRemixLoading(false);
        setRemixJobId(null);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [remixJobId]);

  const handleMoveRemixToVault = async () => {
    if (!activeClient || !remixResult?.script || !remixSelected) return;
    const dateStr = new Date().toLocaleDateString();
    const nameSource = remixResult.script.title || remixResult.structure?.source_keyword || 'Remix';
    const title = `${activeClient.brand_name} — ${nameSource} — ${dateStr}`;

    setRemixMoving(true);
    try {
      await api.saveToVault({
        client_id: activeClient.id,
        title,
        format: 'Creative Studio',
        content: { keyword: null, structure: remixResult.structure, script: remixResult.script },
      });
      setRemixMoved(true);
    } catch (e) {
      console.error(e);
      alert('Failed to save to Vault.');
    } finally {
      setRemixMoving(false);
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
            <p>Content Generator builds a script from scratch; Remix turns any pasted video into one instead.</p>
          </div>
        </div>
      </div>

      <div className="tabs creative-studio-tabs">
        <button
          className={`tab ${activeFeature === 'content-generator' ? 'active' : ''}`}
          onClick={() => setActiveFeature('content-generator')}
        >
          📦 Content Generator
        </button>
        <button
          className={`tab ${activeFeature === 'remix' ? 'active' : ''}`}
          onClick={() => setActiveFeature('remix')}
        >
          🎬 Remix
        </button>
      </div>

      {activeFeature === 'content-generator' && (
      <section className="creative-studio-feature">
        <p className="creative-studio-feature-subtitle">Keyword Planner → Structural Designer → Script Writer.</p>

        <div className="kp-section glass category-picker-section">
          <label className="voice-category-notes-label">Category (required)</label>
          <p className="field-hint">Every structure and script is written through one of these — pick before designing structures.</p>
          <div className="category-picker-row">
            {categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                className={`category-pill ${selectedCategory === cat.key ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.key)}
                title={cat.short_description}
              >
                {cat.label}
                <span className="category-pill-concept">{cat.concept_name}</span>
              </button>
            ))}
          </div>
        </div>

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

            <div className="idea-chat-panel">
              <div className="idea-chat-divider"><span>or chat with AI</span></div>
              <p className="idea-chat-subtitle">
                Riff on an idea like you're brainstorming with a creative partner — WICKED will
                ask questions, then once it's got enough to work with, you can move that topic
                straight to Structural Designer below (pick a category above first).
              </p>

              <div className="idea-chat-messages">
                {chatMessages.length === 0 && !chatSending && (
                  <p className="idea-chat-empty">
                    Try something like "give me an idea about our new trade-in offer" to get started.
                  </p>
                )}
                {chatMessages.map((m, idx) => (
                  <div key={idx} className={`idea-chat-bubble ${m.role}`}>
                    <p>{m.content}</p>
                    {m.ready && m.topic && (
                      <div className="idea-chat-move-row">
                        <span className="kp-source-note">Topic: {m.topic}</span>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleMoveChatTopicToStructuralDesigner(m.topic, idx)}
                          disabled={movingChatTopicIds[idx] || movedChatTopicIds[idx]}
                        >
                          {movingChatTopicIds[idx] ? <span className="btn-spinner" /> : null}
                          {movedChatTopicIds[idx] ? '✅ Moved' : 'Move to Structural Designer →'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {chatSending && (
                  <div className="idea-chat-bubble assistant idea-chat-typing">
                    <span className="btn-spinner" /> thinking…
                  </div>
                )}
              </div>

              {chatError && <p className="kp-note remix-error-note">{chatError}</p>}

              <div className="idea-chat-input-row">
                <input
                  type="text"
                  placeholder="Tell WICKED what you're thinking…"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                  disabled={chatSending}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSendChatMessage}
                  disabled={chatSending || !chatInput.trim()}
                >
                  {chatSending ? <span className="btn-spinner" /> : 'Send'}
                </button>
              </div>
            </div>
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
                  <button className="btn btn-primary" onClick={handleDesignStructures} disabled={sdLoading || !selectedCategory}>
                    {sdLoading ? <span className="btn-spinner" /> : '🧱'} Design Structures
                  </button>
                </div>
                {!selectedCategory && <p className="kp-note">Pick a category above first.</p>}

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
                  <span className="kp-moved-indicator">Carried forward: {movedStructures.length} structure{movedStructures.length === 1 ? '' : 's'} ✓</span>
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
                        {swResult.scripts.map((script, index) => (
                          <ScriptCard
                            key={script.id}
                            script={script}
                            actions={(
                              <div className="sw-script-actions">
                                <button className="btn btn-secondary" onClick={() => handleCopy(script.full_script_text)}>
                                  📋 Copy Script
                                </button>
                                <button
                                  className="btn btn-primary"
                                  onClick={() => handleSaveScript(script, index)}
                                  disabled={savingScriptIds[script.id] || savedScriptIds[script.id]}
                                >
                                  {savingScriptIds[script.id] ? <span className="btn-spinner" /> : null}
                                  {savedScriptIds[script.id] ? '✅ Saved' : '💾 Save'}
                                </button>
                              </div>
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </section>
      )}

      {activeFeature === 'remix' && (
      <section className="creative-studio-feature remix-feature">
        <p className="creative-studio-feature-subtitle">Paste a Reel, TikTok, or YouTube link — Wicked transcribes it and writes a full script from it in your Voice Sample, applied through the same Script Writer used above.</p>

        <div className="kp-section glass">
          <div className="kp-search-row">
            <input
              type="text"
              className="glass-input"
              placeholder="Paste an Instagram Reel, TikTok, or YouTube link…"
              value={remixUrl}
              onChange={(e) => setRemixUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRemixVideo()}
            />
          </div>

          <div className="kp-search-row remix-tone-row">
            <label htmlFor="cs-remix-tone">Tone (optional)</label>
            <select id="cs-remix-tone" value={remixTone} onChange={(e) => setRemixTone(e.target.value)}>
              <option value="">Default (Voice Sample as-is)</option>
              <option value="punchy">Punchy</option>
              <option value="story-driven">Story-driven</option>
              <option value="educational">Educational</option>
            </select>
          </div>

          <div className="kp-search-row category-picker-row">
            {categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                className={`category-pill ${remixCategory === cat.key ? 'active' : ''}`}
                onClick={() => setRemixCategory(cat.key)}
                title={cat.short_description}
              >
                {cat.label}
                <span className="category-pill-concept">{cat.concept_name}</span>
              </button>
            ))}
          </div>
          {!remixCategory && <p className="kp-note">Pick a category above first.</p>}

          <div className="kp-search-row">
            <button className="btn btn-primary" onClick={handleRemixVideo} disabled={remixLoading || !remixUrl.trim() || !remixCategory}>
              {remixLoading ? <span className="btn-spinner" /> : '🎬'} {remixLoading ? 'Transcribing & writing…' : 'Remix this video'}
            </button>
          </div>

          {remixError && <p className="kp-note remix-error-note">{remixError}</p>}

          {remixLoading && (
            <div className="scripts-loading" style={{ marginTop: '1rem' }}>
              <div className="skeleton skeleton-text" style={{ height: '40px', width: '60%' }} />
              <div className="skeleton skeleton-text" style={{ height: '200px' }} />
            </div>
          )}

          {!remixLoading && remixResult && (
            <div className="remix-result-block">
              {remixResult.summary && (
                <p className="kp-note">Source ({remixResult.platform}): {remixResult.summary}</p>
              )}

              {remixResult.script && remixResult.script.full_script_text ? (
                <ScriptCard
                  script={remixResult.script}
                  actions={(
                    <div className="sw-script-actions">
                      <label className="kp-checkbox-label">
                        <input
                          type="checkbox"
                          checked={remixSelected}
                          onChange={() => setRemixSelected((prev) => !prev)}
                        />
                        <span className="kp-phrase">Add</span>
                      </label>
                      <button
                        className="btn btn-primary"
                        onClick={handleMoveRemixToVault}
                        disabled={remixMoving || remixMoved || !remixSelected}
                      >
                        {remixMoving ? <span className="btn-spinner" /> : null}
                        {remixMoved ? '✅ Saved to Vault' : 'Move to Vault →'}
                      </button>
                    </div>
                  )}
                />
              ) : (
                <div className="empty-state">
                  <h3>No speech detected</h3>
                  <p>This clip may be music-only or the audio couldn't be transcribed.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
      )}
    </div>
  );
}
