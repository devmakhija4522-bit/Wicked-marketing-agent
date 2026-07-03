import { Routes, Route } from 'react-router-dom';
import { ClientProvider } from './context/ClientContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Clients from './pages/Clients.jsx';
import Trends from './pages/Trends.jsx';
import ContentLab from './pages/ContentLab.jsx';
import Vault from './pages/Vault.jsx';
import GMMConsole from './pages/GMMConsole.jsx';
import StyleProfile from './pages/StyleProfile.jsx';
import Settings from './pages/Settings.jsx';
import LinkedInDrafts from './pages/LinkedInDrafts.jsx';
import InstagramScripts from './pages/InstagramScripts.jsx';
import Analytics from './pages/Analytics.jsx';
import LinkedInStorage from './pages/LinkedInStorage.jsx';
import InfluencerScout from './pages/InfluencerScout.jsx';

export default function App() {
  return (
    <ClientProvider>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/gmm/:clientId" element={<GMMConsole />} />
            <Route path="/trends" element={<Trends />} />
          <Route path="/linkedin" element={<LinkedInDrafts />} />
          <Route path="/linkedin-storage" element={<LinkedInStorage />} />
          <Route path="/instagram" element={<InstagramScripts />} />
          <Route path="/influencers" element={<InfluencerScout />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/lab" element={<ContentLab />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/style" element={<StyleProfile />} />
          <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </ClientProvider>
  );
}
