import { useState } from 'react';
import { useClient } from '../context/ClientContext';
import Card3D from '../components/Card3D';
import './Dashboard.css';

export default function Dashboard() {
  const { currentClient } = useClient();
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);

  const stats = [
    { label: 'Active Trends Monitored', value: '0', change: 'Ready for Input', icon: '⚡', glow: 'indigo' },
    { label: 'Omni Drafts Generated', value: '0', change: '0 Brand Matches', icon: '📝', glow: 'cyan' },
    { label: 'Agent Virality Score', value: '0.0', change: 'Engine Standby', icon: '🎯', glow: 'ai' },
    { label: 'Autonomous Loop Cycles', value: '0', change: 'Standby Mode', icon: '🔄', glow: 'indigo' }
  ];

  const handleRunPipeline = () => {
    setIsRunningPipeline(true);
    setTimeout(() => {
      setIsRunningPipeline(false);
    }, 2000);
  };

  return (
    <div className="dashboard-container">
      {/* Centered Floating Glass Bubbles Command Center */}
      <section className="command-bubbles-wrapper">
        {/* Bubble 1: Main Command Hero Bubble */}
        <Card3D className="command-hero-bubble" glowColor="cyan">
          <div className="hero-pill">
            <span className="hero-pill-dot"></span>
            <span>AUTONOMOUS MARKETING MATRIX</span>
          </div>
          <h1 className="hero-heading">
            Marketing Command Center {currentClient ? <span>for <span className="highlight-text">{currentClient.brand_name || currentClient.name}</span></span> : ''}
          </h1>
          <p className="hero-subtext">
            Orchestrate AI marketing campaigns, manage brand profiles, and generate platform-optimized content.
          </p>
          <div className="hero-actions">
            <button 
              className={`btn-primary-ai ${isRunningPipeline ? 'loading' : ''}`}
              onClick={handleRunPipeline}
              disabled={isRunningPipeline}
            >
              <span className="btn-icon">{isRunningPipeline ? '⏳' : '⚡'}</span>
              <span>{isRunningPipeline ? 'Executing Engine...' : 'Trigger AI Engine'}</span>
            </button>

            <a href="/clients" className="btn-secondary-ai">
              <span className="btn-icon">👥</span>
              <span>Manage Brand Clients</span>
            </a>
          </div>
        </Card3D>

        {/* Bubble 2: Live Engine Telemetry Bubble */}
        <Card3D className="telemetry-bubble" glowColor="indigo">
          <div className="card-header-row">
            <span className="card-title">LIVE ENGINE TELEMETRY</span>
            <span className="live-tag">REALTIME</span>
          </div>
          <div className="telemetry-grid">
            <div className="telemetry-item">
              <span className="telemetry-label">Active Brand</span>
              <span className="telemetry-val text-cyan">
                {currentClient ? (currentClient.brand_name || currentClient.name) : 'None Selected'}
              </span>
            </div>
            <div className="telemetry-item">
              <span className="telemetry-label">Engine Mode</span>
              <span className="telemetry-val text-indigo">Omni-Channel AI</span>
            </div>
            <div className="telemetry-item">
              <span className="telemetry-label">Primary Source</span>
              <span className="telemetry-val text-indigo">Gemini 1.5 + Web Search</span>
            </div>
            <div className="telemetry-item">
              <span className="telemetry-label">Voice Confidence</span>
              <span className="telemetry-val text-cyan">
                {currentClient ? '98.4% Match' : 'Standby'}
              </span>
            </div>
          </div>
          <div className="telemetry-progress-bar">
            <div className="progress-fill" style={{ width: currentClient ? '85%' : '0%' }}></div>
          </div>
        </Card3D>
      </section>

      {/* Metrics Row: Floating Glass Stat Bubbles */}
      <section className="stats-row">
        {stats.map((s, idx) => (
          <Card3D key={idx} className="stat-bubble" glowColor={s.glow}>
            <div className="stat-top">
              <span className="stat-icon">{s.icon}</span>
              <span className="stat-change">{s.change}</span>
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </Card3D>
        ))}
      </section>
    </div>
  );
}
