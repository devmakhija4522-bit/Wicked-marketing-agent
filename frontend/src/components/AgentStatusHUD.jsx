import { useNavigate } from 'react-router-dom';
import './AgentStatusHUD.css';

export default function AgentStatusHUD() {
  const navigate = useNavigate();

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
        <div className="system-status-pill">
          <span className="status-live-dot"></span>
          <span className="status-label">ONLINE</span>
        </div>
      </div>
    </header>
  );
}
