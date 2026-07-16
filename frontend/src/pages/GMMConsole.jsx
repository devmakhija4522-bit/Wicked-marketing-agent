import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClient } from '../context/ClientContext.jsx';
import { api } from '../utils/api.js';
import { CATEGORIES } from '../constants/skillCategories.js';
import '../styles/skillTiles.css';
import './GMMConsole.css';

export default function GMMConsole() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { clients, switchClient, activeClient } = useClient();
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    if (clientId && clients.length > 0) {
      if (!activeClient || activeClient.id !== clientId) {
        switchClient(clientId);
      }
    }
  }, [clientId, clients, activeClient, switchClient]);

  useEffect(() => {
    api.getMarketingSkills()
      .then(data => {
        if (Array.isArray(data)) setSkills(data);
      })
      .catch(() => {});
  }, []);

  if (!activeClient) {
    return <div className="gmm-container"><p>Loading client data...</p></div>;
  }

  return (
    <div className="gmm-container">
      <header className="gmm-header">
        <div>
          <button className="btn btn-sm btn-secondary" onClick={() => navigate('/clients')}>← Back to Clients</button>
          <h1 className="gmm-title">Grest Marketing <span className="gradient-text">Manager</span></h1>
          <p className="gmm-subtitle">AI-Powered Campaign Console for <strong>{activeClient.brand_name}</strong></p>
        </div>
      </header>

      <div style={{ padding: '0 2rem 2rem 2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/influencers')}
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', border: 'none' }}
        >
          <span style={{ marginRight: '0.5rem' }}>🔍</span> Influencer Scout
        </button>
      </div>

      <section className="gmm-skills-section">
        <div className="section-header">
          <h2 className="section-title">Marketing Skills</h2>
        </div>
        <div className="skill-tiles">
          {CATEGORIES.map((cat) => {
            const count = skills.filter(s => s.category === cat.key).length;
            return (
              <button
                key={cat.key}
                className="skill-tile"
                onClick={() => navigate(`/skills/${cat.key}`)}
                title={`${count} skill${count === 1 ? '' : 's'}`}
              >
                <span className={`skill-tile-icon-wrap ${cat.iconWrap}`}>
                  <span className="skill-tile-icon">{cat.icon}</span>
                </span>
                <span className="skill-tile-label">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
