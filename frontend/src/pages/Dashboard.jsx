import './Dashboard.css';

export default function Dashboard() {
  return (
    <div className="dashboard">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            AI-Powered Marketing
          </div>
          <h1 className="hero-title">
            <span className="gradient-text">WICKED</span> Marketing Agent
          </h1>
          <p className="hero-subtitle">
            Your AI marketing command center.
          </p>

        </div>
        <div className="hero-visual">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-orb hero-orb-3" />
          <div className="hero-graphic">
            <div className="graphic-ring graphic-ring-1" />
            <div className="graphic-ring graphic-ring-2" />
            <div className="graphic-ring graphic-ring-3" />
            <div className="graphic-center">⚡</div>
          </div>
        </div>
      </section>
    </div>
  );
}
