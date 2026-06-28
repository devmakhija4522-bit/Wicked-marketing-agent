import { useState } from 'react'
import axios from 'axios'

export default function TrendDiscovery() {
  const [trends, setTrends] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchTrends = async () => {
    setLoading(true)
    try {
      const res = await axios.post('/api/discover-trends')
      setTrends(res.data.trends)
    } catch (e) {
      alert('Error fetching trends. Is the backend running?')
    }
    setLoading(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>🔍 Trend Discovery</h1>
          <p style={{ color: '#8888aa', fontSize: 13, marginTop: 4 }}>
            Live trends from YouTube & Google Trends India
          </p>
        </div>
        <button className="btn" onClick={fetchTrends} disabled={loading}>
          {loading ? 'Scanning...' : '⚡ Scan Trends Now'}
        </button>
      </div>

      {trends.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: 60, color: '#8888aa' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📡</div>
          <div style={{ fontSize: 16 }}>Hit "Scan Trends Now" to see what India is watching</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {trends.map((t, i) => (
          <div key={i} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <span className={`badge badge-${t.source}`}>{t.source}</span>
              <span style={{ fontSize: 11, color: '#8888aa' }}>#{i + 1}</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{t.title}</div>
            <div style={{ fontSize: 12, color: '#8888aa' }}>{t.engagement_signal}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
