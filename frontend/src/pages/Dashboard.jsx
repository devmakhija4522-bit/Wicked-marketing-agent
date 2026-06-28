import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
        Welcome back 🔥
      </h1>
      <p style={{ color: '#8888aa', marginBottom: 32 }}>
        Your AI marketing command center for Grest.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Discover Trends', desc: 'See what India is watching right now', icon: '🔍', path: '/trends' },
          { label: 'Generate Script', desc: 'Run the full AI pipeline end-to-end', icon: '🎬', path: '/lab' },
          { label: 'Script Vault', desc: 'Browse all your generated scripts', icon: '📝', path: '/vault' },
        ].map(card => (
          <div key={card.path} className="card" style={{ cursor: 'pointer' }}
            onClick={() => navigate(card.path)}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{card.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{card.label}</div>
            <div style={{ color: '#8888aa', fontSize: 13 }}>{card.desc}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Grest USPs — Always On</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {[
            '✅ 50+ Quality Checks',
            '🛡️ 6–12 Month Warranty',
            '🏪 6 Physical Stores',
            '🏛️ Govt IMEI Verification (C-DOT)',
            '💰 Premium Apple at Fraction of Cost',
            '📱 iPhones, MacBooks, iPads, AirPods',
          ].map(usp => (
            <div key={usp} style={{ fontSize: 13, color: '#ccccdd', padding: '8px 12px',
              background: '#0f0f1a', borderRadius: 8, border: '1px solid #2a2a40' }}>
              {usp}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
