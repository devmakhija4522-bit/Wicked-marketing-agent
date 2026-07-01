import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../utils/api.js';
import './ContentLab.css';

const PIPELINE_STAGES = [
  { key: 'trend', label: 'Trend', icon: '🔥', description: 'Select or discover a trending topic' },
  { key: 'insight', label: 'Insight', icon: '🧠', description: 'AI analyzes the trend for content angles' },
  { key: 'concepts', label: 'Concepts', icon: '💡', description: 'Generate multiple creative concepts' },
  { key: 'script', label: 'Script', icon: '✍️', description: 'Write the full video/reel script' },
  { key: 'review', label: 'Review', icon: '✅', description: 'Brand alignment review & scoring' },
];

const MOCK_CONCEPTS = [
  {
    id: 1,
    title: 'The Smart Buyer\'s Guide',
    angle: 'Educational / Trust-building',
    hook: 'What if I told you the phone in my hand costs 40% less than retail?',
    score: 92,
    tone: 'Informative & Confident',
    format: 'Long-form YouTube',
  },
  {
    id: 2,
    title: 'Unboxing the Impossible Deal',
    angle: 'Entertainment / Surprise',
    hook: 'Your hook goes here.',
    score: 88,
    tone: 'Excited & Authentic',
    format: 'YouTube Shorts / Reel',
  },
  {
    id: 3,
    title: 'Student Setup Challenge',
    angle: 'Challenge / Relatable',
    hook: 'Building a full Apple setup for under ₹50,000 — is it possible?',
    score: 95,
    tone: 'Fun & Energetic',
    format: 'YouTube Video',
  },
  {
    id: 4,
    title: 'Refurbished vs New: Blind Test',
    angle: 'Comparison / Proof',
    hook: 'Can you tell which iPhone is refurbished? Neither could 100 people we asked.',
    score: 90,
    tone: 'Persuasive & Data-driven',
    format: 'Long-form YouTube',
  },
];

const MOCK_SCRIPT = {
  hook: "What if I told you that the iPhone in my hand — perfect condition, latest model — cost me 40% less than what you'd pay at an Apple Store? No catch. No compromise. Welcome to the refurbished revolution.",
  story: "Your brand story and main content goes here.",
  brandMoment: "The moment your brand is naturally introduced.",
  cta: "Your Call to Action.",
  visualNotes: "• Visual cue 1\n• Visual cue 2\n• Visual cue 3",
};

export default function ContentLab() {
  const location = useLocation();
  const [activeStage, setActiveStage] = useState(0);
  const [completedStages, setCompletedStages] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [trendInput, setTrendInput] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('YouTube');
  const [insight, setInsight] = useState(null);
  const [concepts, setConcepts] = useState([]);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [script, setScript] = useState(null);
  const [review, setReview] = useState(null);
  const [streamingText, setStreamingText] = useState('');
  const [showStreaming, setShowStreaming] = useState(false);
  const scriptRef = useRef(null);

  // Receive trend from Trends page
  useEffect(() => {
    if (location.state?.trend) {
      setTrendInput(location.state.trend.title);
      setSelectedPlatform(location.state.trend.platform || 'YouTube');
    }
  }, [location.state]);

  const simulateStreaming = (text, callback) => {
    setShowStreaming(true);
    setStreamingText('');
    let i = 0;
    const words = text.split(' ');
    const interval = setInterval(() => {
      if (i < words.length) {
        setStreamingText(prev => prev + (i === 0 ? '' : ' ') + words[i]);
        i++;
      } else {
        clearInterval(interval);
        setShowStreaming(false);
        if (callback) callback();
      }
    }, 40);
    return () => clearInterval(interval);
  };

  const completeStage = (stageIndex) => {
    setCompletedStages(prev => new Set([...prev, stageIndex]));
    if (stageIndex < 4) {
      setActiveStage(stageIndex + 1);
    }
  };

  const handleAnalyzeTrend = async () => {
    if (!trendInput.trim()) return;
    setIsProcessing(true);

    try {
      const data = await api.analyzeTrends([{ title: trendInput, platform: selectedPlatform }]);
      setInsight(data.insights?.[0] || data);
    } catch (e) {
      setInsight({
        summary: `The trend "${trendInput}" shows strong potential for content creation. Key angles include value, quality, and relatability.`,
        audience: 'Tech-savvy Indian consumers aged 18-35, students, and young professionals',
        contentAngle: 'Trust-building through transparency and value demonstration',
        viralPotential: 'High — addresses common audience pain points',
      });
    }

    setIsProcessing(false);
    completeStage(0);
    simulateStreaming(
      `Analyzed "${trendInput}" — Strong engagement signals detected. The topic resonates with cost-conscious tech enthusiasts in India. Recommended angles: value comparison, quality assurance, and sustainability messaging.`
    );
  };

  const handleGenerateConcepts = async () => {
    setIsProcessing(true);

    try {
      const data = await api.generateConcepts(insight ? [insight] : [{ title: trendInput }]);
      if (data.concepts && data.concepts.length > 0) {
        setConcepts(data.concepts.map((c, i) => ({
          id: i + 1,
          title: c.title || `Concept ${i + 1}`,
          angle: c.angle || c.approach || 'Creative',
          hook: c.hook || c.opening || '',
          score: c.score || c.brand_score || Math.floor(Math.random() * 15 + 82),
          tone: c.tone || 'Engaging',
          format: c.format || 'YouTube Video',
        })));
      } else {
        setConcepts(MOCK_CONCEPTS);
      }
    } catch (e) {
      setConcepts(MOCK_CONCEPTS);
    }

    setIsProcessing(false);
    completeStage(1);
  };

  const handleSelectConcept = (concept) => {
    setSelectedConcept(concept);
    completeStage(2);
  };

  const handleWriteScript = async () => {
    setIsProcessing(true);

    try {
      const data = await api.writeScript(selectedConcept);
      if (data && data.script) {
        setScript({
          hook: data.script.hook || data.script.opening || MOCK_SCRIPT.hook,
          story: data.script.story || data.script.body || data.script.main || MOCK_SCRIPT.story,
          brandMoment: data.script.brand_moment || data.script.brandMoment || MOCK_SCRIPT.brandMoment,
          cta: data.script.cta || data.script.call_to_action || MOCK_SCRIPT.cta,
          visualNotes: data.script.visual_notes || data.script.visualNotes || MOCK_SCRIPT.visualNotes,
        });
      } else {
        setScript(MOCK_SCRIPT);
      }
    } catch (e) {
      setScript(MOCK_SCRIPT);
    }

    setIsProcessing(false);
    completeStage(3);

    setTimeout(() => {
      scriptRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

  const handleReviewScript = async () => {
    setIsProcessing(true);

    try {
      const data = await api.reviewScript(script);
      setReview(data);
    } catch (e) {
      setReview({
        overallScore: 91,
        brandAlignment: 94,
        hookStrength: 88,
        ctaEffectiveness: 90,
        feedback: [
          { type: 'strength', text: 'Strong emotional hook that creates curiosity' },
          { type: 'strength', text: 'Excellent brand integration — feels natural, not forced' },
          { type: 'strength', text: 'Clear value proposition with specific savings mentioned' },
          { label: '🏷️ Brand Moment', key: 'brand_moment' },
          { type: 'improvement', text: 'Consider adding a personal testimonial' },
          { type: 'improvement', text: 'The CTA could benefit from a limited-time urgency element' },
        ],
      });
    }

    setIsProcessing(false);
    completeStage(4);
  };

  const handleCopyScript = () => {
    if (!script) return;
    const fullScript = `[HOOK]\n${script.hook}\n\n[STORY]\n${script.story}\n\n[BRAND MOMENT]\n${script.brandMoment}\n\n[CTA]\n${script.cta}\n\n[VISUAL NOTES]\n${script.visualNotes}`;
    navigator.clipboard.writeText(fullScript);
  };

  const handleReset = () => {
    setActiveStage(0);
    setCompletedStages(new Set());
    setTrendInput('');
    setInsight(null);
    setConcepts([]);
    setSelectedConcept(null);
    setScript(null);
    setReview(null);
    setStreamingText('');
    setShowStreaming(false);
  };

  return (
    <div className="content-lab">
      <div className="page-header">
        <div className="lab-header-row">
          <div>
            <h1><span className="gradient-text">Content</span> Lab</h1>
            <p>Full pipeline visualization — from trend to ready-to-shoot script.</p>
          </div>
          <button className="btn btn-ghost" onClick={handleReset}>
            🔄 Reset Pipeline
          </button>
        </div>
      </div>

      {/* Pipeline Progress Bar */}
      <div className="pipeline-progress">
        {PIPELINE_STAGES.map((stage, i) => (
          <div key={stage.key} className="progress-stage-wrapper">
            <button
              className={`progress-stage ${
                completedStages.has(i)
                  ? 'stage-completed'
                  : activeStage === i
                  ? 'stage-current'
                  : 'stage-locked'
              }`}
              onClick={() => {
                if (completedStages.has(i) || activeStage === i) setActiveStage(i);
              }}
            >
              <span className="progress-icon">
                {completedStages.has(i) ? '✓' : stage.icon}
              </span>
              <span className="progress-label">{stage.label}</span>
            </button>
            {i < 4 && (
              <div className={`progress-connector ${completedStages.has(i) ? 'connector-done' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* Stage Panels */}
      <div className="stage-panels">
        {/* ── STAGE 0: Trend Input ── */}
        {activeStage >= 0 && (
          <div className={`stage-panel ${activeStage === 0 ? 'panel-active' : 'panel-collapsed'}`}>
            <div className="panel-header" onClick={() => setActiveStage(0)}>
              <div className="panel-header-left">
                <span className="panel-icon">🔥</span>
                <div>
                  <h3 className="panel-title">Trend Selection</h3>
                  <p className="panel-desc">Enter a trend topic or pick from discoveries</p>
                </div>
              </div>
              {completedStages.has(0) && <span className="badge badge-green">✓ Done</span>}
            </div>
            {activeStage === 0 && (
              <div className="panel-body animate-in">
                <div className="trend-input-group">
                  <input
                    type="text"
                    className="input-field trend-input"
                    placeholder="Enter a trending topic, e.g. 'iPhone 16 refurbished deals India'"
                    value={trendInput}
                    onChange={(e) => setTrendInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeTrend()}
                  />
                  <select
                    className="input-field platform-select"
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                  >
                    <option value="YouTube">YouTube</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Reddit">Reddit</option>
                    <option value="Google">Google</option>
                  </select>
                  <button
                    className="btn btn-primary"
                    onClick={handleAnalyzeTrend}
                    disabled={isProcessing || !trendInput.trim()}
                  >
                    {isProcessing ? <span className="btn-spinner" /> : '🧠'} Analyze
                  </button>
                </div>

                {showStreaming && (
                  <div className="streaming-output">
                    <div className="streaming-indicator">
                      <span className="streaming-dot" />
                      <span className="streaming-dot" />
                      <span className="streaming-dot" />
                      <span className="streaming-label">AI Analyzing...</span>
                    </div>
                    <p className="streaming-text">{streamingText}<span className="cursor-blink">|</span></p>
                  </div>
                )}

                {insight && !showStreaming && (
                  <div className="insight-result animate-in">
                    <h4>📊 Trend Analysis</h4>
                    <div className="insight-grid">
                      <div className="insight-item">
                        <span className="insight-label">Summary</span>
                        <p>{insight.summary}</p>
                      </div>
                      <div className="insight-item">
                        <span className="insight-label">Target Audience</span>
                        <p>{insight.audience}</p>
                      </div>
                      <div className="insight-item">
                        <span className="insight-label">Content Angle</span>
                        <p>{insight.contentAngle}</p>
                      </div>
                      <div className="insight-item">
                        <span className="insight-label">Viral Potential</span>
                        <p>{insight.viralPotential}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── STAGE 1: Insight → Concepts ── */}
        {activeStage >= 1 && (
          <div className={`stage-panel ${activeStage === 1 ? 'panel-active' : 'panel-collapsed'}`}>
            <div className="panel-header" onClick={() => completedStages.has(1) && setActiveStage(1)}>
              <div className="panel-header-left">
                <span className="panel-icon">💡</span>
                <div>
                  <h3 className="panel-title">Concept Generation</h3>
                  <p className="panel-desc">AI generates multiple creative concepts</p>
                </div>
              </div>
              {completedStages.has(1) && <span className="badge badge-green">✓ Done</span>}
            </div>
            {activeStage === 1 && (
              <div className="panel-body animate-in">
                {concepts.length === 0 ? (
                  <div className="stage-action">
                    <p>Ready to generate creative concepts from the trend analysis.</p>
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={handleGenerateConcepts}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <><span className="btn-spinner" /> Generating...</>
                      ) : (
                        '💡 Generate Concepts'
                      )}
                    </button>
                  </div>
                ) : null}

                {isProcessing && concepts.length === 0 && (
                  <div className="concepts-loading">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="skeleton skeleton-card" style={{ height: '180px' }} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── STAGE 2: Concept Selection ── */}
        {activeStage >= 2 && concepts.length > 0 && (
          <div className={`stage-panel ${activeStage === 2 ? 'panel-active' : 'panel-collapsed'}`}>
            <div className="panel-header" onClick={() => completedStages.has(2) && setActiveStage(2)}>
              <div className="panel-header-left">
                <span className="panel-icon">🎯</span>
                <div>
                  <h3 className="panel-title">Concept Comparison</h3>
                  <p className="panel-desc">Compare and select the best concept</p>
                </div>
              </div>
              {selectedConcept && <span className="badge badge-green">✓ Selected</span>}
            </div>
            {activeStage === 2 && (
              <div className="panel-body animate-in">
                <div className="concepts-grid">
                  {concepts.map((concept, i) => (
                    <div
                      key={concept.id}
                      className={`concept-card ${selectedConcept?.id === concept.id ? 'concept-selected' : ''}`}
                      style={{ animationDelay: `${i * 0.1}s` }}
                      onClick={() => handleSelectConcept(concept)}
                    >
                      <div className="concept-header">
                        <span className="concept-rank">#{i + 1}</span>
                        <div className="concept-score-ring">
                          <svg viewBox="0 0 36 36" className="score-svg">
                            <path
                              className="score-bg"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className="score-fill"
                              strokeDasharray={`${concept.score}, 100`}
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <span className="score-value">{concept.score}</span>
                        </div>
                      </div>
                      <h4 className="concept-title">{concept.title}</h4>
                      <span className="concept-angle">{concept.angle}</span>
                      <p className="concept-hook">"{concept.hook}"</p>
                      <div className="concept-meta">
                        <span className="badge badge-purple">{concept.tone}</span>
                        <span className="badge badge-blue">{concept.format}</span>
                      </div>
                      <button className="btn btn-secondary btn-sm concept-select-btn">
                        {selectedConcept?.id === concept.id ? '✓ Selected' : 'Select Concept'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STAGE 3: Script Writing ── */}
        {activeStage >= 3 && (
          <div className={`stage-panel ${activeStage === 3 ? 'panel-active' : 'panel-collapsed'}`} ref={scriptRef}>
            <div className="panel-header" onClick={() => completedStages.has(3) && setActiveStage(3)}>
              <div className="panel-header-left">
                <span className="panel-icon">✍️</span>
                <div>
                  <h3 className="panel-title">Script Studio</h3>
                  <p className="panel-desc">Full script with structured sections</p>
                </div>
              </div>
              {completedStages.has(3) && <span className="badge badge-green">✓ Written</span>}
            </div>
            {activeStage === 3 && (
              <div className="panel-body animate-in">
                {!script ? (
                  <div className="stage-action">
                    <p>Selected concept: <strong>{selectedConcept?.title}</strong></p>
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={handleWriteScript}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <><span className="btn-spinner" /> Writing Script...</>
                      ) : (
                        '✍️ Write Script'
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="script-output">
                    <div className="script-actions-bar">
                      <button className="btn btn-secondary btn-sm" onClick={handleCopyScript}>
                        📋 Copy Full Script
                      </button>
                      <button className="btn btn-ghost btn-sm">
                        📥 Export
                      </button>
                    </div>

                    <div className="script-sections">
                      <div className="script-section script-hook">
                        <div className="section-badge">
                          <span className="section-badge-icon">🎣</span>
                          HOOK
                        </div>
                        <p>{script.hook}</p>
                      </div>

                      <div className="script-section script-story">
                        <div className="section-badge">
                          <span className="section-badge-icon">📖</span>
                          STORY
                        </div>
                        <p style={{ whiteSpace: 'pre-line' }}>{script.story}</p>
                      </div>

                      <div className="script-section script-brand">
                        <div className="section-badge">
                          <span className="section-badge-icon">💎</span>
                          BRAND MOMENT
                        </div>
                        <p>{script.brandMoment}</p>
                      </div>

                      <div className="script-section script-cta">
                        <div className="section-badge">
                          <span className="section-badge-icon">🎯</span>
                          CALL TO ACTION
                        </div>
                        <p style={{ whiteSpace: 'pre-line' }}>{script.cta}</p>
                      </div>

                      <div className="script-section script-visual">
                        <div className="section-badge">
                          <span className="section-badge-icon">🎬</span>
                          VISUAL NOTES
                        </div>
                        <pre className="visual-notes-text">{script.visualNotes}</pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── STAGE 4: Review ── */}
        {activeStage >= 4 && (
          <div className={`stage-panel ${activeStage === 4 ? 'panel-active' : 'panel-collapsed'}`}>
            <div className="panel-header" onClick={() => completedStages.has(4) && setActiveStage(4)}>
              <div className="panel-header-left">
                <span className="panel-icon">✅</span>
                <div>
                  <h3 className="panel-title">Brand Review</h3>
                  <p className="panel-desc">AI quality check and brand alignment score</p>
                </div>
              </div>
              {completedStages.has(4) && <span className="badge badge-green">✓ Reviewed</span>}
            </div>
            {activeStage === 4 && (
              <div className="panel-body animate-in">
                {!review ? (
                  <div className="stage-action">
                    <p>Ready to review script for brand alignment and quality.</p>
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={handleReviewScript}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <><span className="btn-spinner" /> Reviewing...</>
                      ) : (
                        '✅ Review Script'
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="review-output animate-in">
                    <div className="review-scores">
                      <div className="review-score-card review-overall">
                        <span className="review-score-label">Overall Score</span>
                        <span className="review-score-value">{review.overallScore}</span>
                        <div className="review-score-bar">
                          <div className="review-score-fill" style={{ width: `${review.overallScore}%` }} />
                        </div>
                      </div>
                      <div className="review-score-card">
                        <span className="review-score-label">Brand Alignment</span>
                        <span className="review-score-value">{review.brandAlignment}</span>
                        <div className="review-score-bar">
                          <div className="review-score-fill fill-purple" style={{ width: `${review.brandAlignment}%` }} />
                        </div>
                      </div>
                      <div className="review-score-card">
                        <span className="review-score-label">Hook Strength</span>
                        <span className="review-score-value">{review.hookStrength}</span>
                        <div className="review-score-bar">
                          <div className="review-score-fill fill-blue" style={{ width: `${review.hookStrength}%` }} />
                        </div>
                      </div>
                      <div className="review-score-card">
                        <span className="review-score-label">CTA Effectiveness</span>
                        <span className="review-score-value">{review.ctaEffectiveness}</span>
                        <div className="review-score-bar">
                          <div className="review-score-fill fill-green" style={{ width: `${review.ctaEffectiveness}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="review-feedback">
                      <h4>Feedback</h4>
                      {review.feedback?.map((item, i) => (
                        <div key={i} className={`feedback-item feedback-${item.type}`}>
                          <span className="feedback-icon">
                            {item.type === 'strength' ? '💪' : '💡'}
                          </span>
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>

                    <div className="review-complete-banner">
                      <span className="complete-icon">🎉</span>
                      <div>
                        <h4>Pipeline Complete!</h4>
                        <p>Your script is ready. Copy, export, or refine further.</p>
                      </div>
                      <button className="btn btn-primary" onClick={handleCopyScript}>
                        📋 Copy Script
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
