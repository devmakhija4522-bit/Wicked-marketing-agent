import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClient } from '../context/ClientContext';
import './AgentStatusHUD.css';

export default function AgentStatusHUD() {
  const navigate = useNavigate();
  const { currentClient, clients, switchClient } = useClient();
  const [isClientMenuOpen, setIsClientMenuOpen] = useState(false);

  return (
    <header className="agent-hud">
      <div className="hud-left">
        <div className="brand-logo-pill">
          <span className="logo-spark">⚡</span>
          <span className="logo-text">WICKED</span>
        </div>

        {/* Global Back / Forward Navigation Controls */}
        <div className="nav-history-controls">
          <button 
            className="nav-btn" 
            onClick={() => navigate(-1)} 
            title="Go Back"
          >
            <span className="nav-icon">←</span>
            <span>Back</span>
          </button>
          <button 
            className="nav-btn" 
            onClick={() => navigate(1)} 
            title="Go Forward"
          >
            <span>Forward</span>
            <span className="nav-icon">→</span>
          </button>
        </div>
      </div>

      <div className="hud-right">
        <div className="client-selector-wrap">
          <button 
            className="client-selector-btn"
            onClick={() => setIsClientMenuOpen(!isClientMenuOpen)}
          >
            <span className="client-avatar">
              {currentClient ? (currentClient.brand_name || currentClient.name).charAt(0).toUpperCase() : '+'}
            </span>
            <div className="client-btn-info">
              <span className="client-label">BRAND:</span>
              <span className="client-name">
                {currentClient ? (currentClient.brand_name || currentClient.name) : 'No Brand Selected'}
              </span>
            </div>
            <span className="chevron">{isClientMenuOpen ? '▲' : '▼'}</span>
          </button>

          {isClientMenuOpen && (
            <div className="client-dropdown">
              <div className="dropdown-header">SWITCH BRAND PROFILE</div>
              {clients.length === 0 ? (
                <div style={{ padding: '8px 10px', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  No Brand Profiles Created
                </div>
              ) : (
                clients.map(c => (
                  <button
                    key={c.id}
                    className={`dropdown-item ${currentClient?.id === c.id ? 'selected' : ''}`}
                    onClick={() => {
                      switchClient(c.id);
                      setIsClientMenuOpen(false);
                    }}
                  >
                    <span className="item-name">{c.brand_name || c.name}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="system-status-pill">
          <span className="status-live-dot"></span>
          <span className="status-label">ONLINE</span>
        </div>
      </div>
    </header>
  );
}
