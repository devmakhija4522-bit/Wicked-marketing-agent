import { Routes, Route } from 'react-router-dom';
import { ClientProvider } from './context/ClientContext.jsx';
import Canvas3DBackground from './components/Canvas3DBackground.jsx';
import Sidebar from './components/Sidebar.jsx';
import AgentStatusHUD from './components/AgentStatusHUD.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Clients from './pages/Clients.jsx';
import ContentLab from './pages/ContentLab.jsx';
import StyleProfile from './pages/StyleProfile.jsx';
import Settings from './pages/Settings.jsx';
import Analytics from './pages/Analytics.jsx';
import CROAuditor from './pages/CROAuditor.jsx';
import CampaignPlanner from './pages/CampaignPlanner.jsx';
import MarketResearch from './pages/MarketResearch.jsx';
import CopyPolisher from './pages/CopyPolisher.jsx';
import BrandVoiceManager from './pages/BrandVoiceManager.jsx';
import InfluencerScout from './pages/InfluencerScout.jsx';

export default function App() {
  return (
    <ClientProvider>
      <div className="app-layout" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-deepest)', position: 'relative' }}>
        <Canvas3DBackground />
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative', zIndex: 2 }}>
          <AgentStatusHUD />
          <main className="main-content" style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/lab" element={<ContentLab />} />
              <Route path="/style" element={<StyleProfile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/cro-auditor" element={<CROAuditor />} />
              <Route path="/campaign-planner" element={<CampaignPlanner />} />
              <Route path="/market-research" element={<MarketResearch />} />
              <Route path="/influencer-scout" element={<InfluencerScout />} />
              <Route path="/copy-polisher" element={<CopyPolisher />} />
              <Route path="/brand-voice" element={<BrandVoiceManager />} />
            </Routes>
          </main>
        </div>
      </div>
    </ClientProvider>
  );
}
