import { useState } from 'react'
import axios from 'axios'

const STEPS = ['🔍 Trends', '🧠 Insights', '🎯 Concepts', '✍️ Script', '🛡️ Review']

export default function ContentLab() {
  const [language, setLanguage] = useState('hinglish')
  const [styleSamples, setStyleSamples] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(-1)
  const [result, setResult] = useState(null)

  const runPipeline = async () => {
    setLoading(true)
    setResult(null)

    // Animate steps
    for (let i = 0; i < STEPS.length; i++) {
      setStep(i)
      await new Promise(r => setTimeout(r, 800))
    }

    try {
      const res = await axios.post('/api/full-pipeline', {
        language,
        style_samples: styleSamples ? styleSamples.split('\n---\n') : []
      })
      setResult(res.data)
    } catch (e) {
      alert('Pipeline error. Make sure the backend is running on port 8000.')
    }
    setLoading(false)
    setStep(-1)
  }

  const script = result?.script
  const review = result?.review

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>🎬 Content Lab</h1>
      <p style={{ color: '#8888aa', fontSize: 13, marginBottom: 24 }}>
        Run the full 5-agent pipeline to generate a viral reel script
      </p>

      {/* Controls */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
          <div>
            <label style={{ fontSize: 12, color: '#8888aa', display: 'block', marginBottom: 8 }}>LANGUAGE</label>
            <select value={language} onChange={e => setLanguage(e.target.value)}
              style={{ width: '100%', background: '#0f0f1a', border: '1px solid #2a2a40',
                color: '#fff', padding: '10px 12px', borderRadius: 8, fontSize: 14 }}>
              <option value="hinglish">Hinglish (Recommended)</option>
              <option value="hindi">Pure Hindi</option>
              <option value="english">English</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8888aa', display: 'block', marginBottom: 8 }}>
              YOUR WRITING SAMPLES (optional — paste scripts separated by ---)
            </label>
            <textarea value={styleSamples} onChange={e => setStyleSamples(e.target.value)}
              placeholder="Paste your existing scripts here so the AI learns your style..."
              style={{ width: '100%', height: 80, background: '#0f0f1a', border: '1px solid #2a2a40',
                color: '#fff', padding: '10px 12px', borderRadius: 8, fontSize: 13,
                resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
        </div>
        <button className="btn" onClick={runPipeline} disabled={loading} style={{ marginTop: 16 }}>
          {loading ? '⚡ Running Pipeline...' : '🚀 Generate Script'}
        </button>
      </div>

      {/* Pipeline progress */}
      {loading && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ flex: 1, textAlign: 'center', padding: '12px 8px', borderRadius: 8,
                background: i <= step ? '#1a1a2e' : '#0f0f1a',
                border: `1px solid ${i === step ? '#e94560' : '#2a2a40'}`,
                color: i <= step ? '#fff' : '#8888aa',
                fontSize: 12, fontWeight: i === step ? 700 : 400,
                transition: 'all 0.3s' }}>
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {script && (
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Script */}
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#e94560' }}>
              ✍️ Generated Script
            </h2>
            {[
              { label: '🎣 Hook (first 3 seconds)', key: 'hook' },
              { label: '📖 Body', key: 'body' },
              { label: '🏷️ Grest Moment', key: 'grest_moment' },
              { label: '📢 CTA', key: 'cta' },
              { label: '🎥 Visual Notes', key: 'visual_notes' },
            ].map(({ label, key }) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#8888aa', fontWeight: 600,
                  textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                <div style={{ background: '#0f0f1a', padding: '12px 14px', borderRadius: 8,
                  fontSize: 14, lineHeight: 1.7, color: '#ddd', border: '1px solid #2a2a40' }}>
                  {script[key]}
                </div>
              </div>
            ))}
          </div>

          {/* Full script */}
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📋 Full Script</h2>
            <pre style={{ background: '#0f0f1a', padding: 16, borderRadius: 8, fontSize: 13,
              lineHeight: 1.8, color: '#ddd', whiteSpace: 'pre-wrap', border: '1px solid #2a2a40' }}>
              {script.full_script}
            </pre>
            <button className="btn" style={{ marginTop: 12 }}
              onClick={() => { navigator.clipboard.writeText(script.full_script) }}>
              📋 Copy Script
            </button>
          </div>

          {/* Brand review */}
          {review && (
            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🛡️ Brand Guardian Review</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 40, fontWeight: 800,
                  color: review.brand_alignment_score >= 80 ? '#00e676' : '#ffd600' }}>
                  {review.brand_alignment_score}
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {review.approved ? '✅ Approved' : '⚠️ Needs Revision'}
                  </div>
                  <div style={{ fontSize: 12, color: '#8888aa' }}>Brand Alignment Score / 100</div>
                </div>
              </div>
              <div style={{ fontSize: 14, color: '#ccc', lineHeight: 1.7, marginBottom: 12 }}>
                {review.feedback}
              </div>
              {review.flags?.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {review.flags.map((f, i) => (
                    <span key={i} style={{ background: '#ff000022', color: '#ff6666',
                      border: '1px solid #ff444444', padding: '4px 10px', borderRadius: 20, fontSize: 12 }}>
                      ⚠️ {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
