import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import TrendDiscovery from './pages/TrendDiscovery.jsx'
import ContentLab from './pages/ContentLab.jsx'
import ScriptVault from './pages/ScriptVault.jsx'

const nav = [
  { to: '/', label: '🏠 Dashboard' },
  { to: '/trends', label: '🔍 Trends' },
  { to: '/lab', label: '🎬 Content Lab' },
  { to: '/vault', label: '📝 Script Vault' },
]

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <aside style={{
          width: 220, background: '#12121a', borderRight: '1px solid #2a2a40',
          padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 8,
          position: 'fixed', height: '100vh'
        }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#e94560' }}>WICKED</div>
            <div style={{ fontSize: 11, color: '#8888aa', marginTop: 2 }}>Marketing Agent System</div>
          </div>
          {nav.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}
              style={({ isActive }) => ({
                display: 'block', padding: '10px 14px', borderRadius: 8,
                textDecoration: 'none', fontSize: 14, fontWeight: 500,
                background: isActive ? '#1a1a2e' : 'transparent',
                color: isActive ? '#e94560' : '#8888aa',
                border: isActive ? '1px solid #2a2a40' : '1px solid transparent',
                transition: 'all 0.2s'
              })}>
              {n.label}
            </NavLink>
          ))}
          <div style={{ marginTop: 'auto', fontSize: 11, color: '#444', textAlign: 'center' }}>
            Grest × WICKED v1.0
          </div>
        </aside>

        {/* Main content */}
        <main style={{ marginLeft: 220, flex: 1, padding: 32 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/trends" element={<TrendDiscovery />} />
            <Route path="/lab" element={<ContentLab />} />
            <Route path="/vault" element={<ScriptVault />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
