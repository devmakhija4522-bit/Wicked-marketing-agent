import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClient } from '../context/ClientContext.jsx';
import './GMMConsole.css';

export default function GMMConsole() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { clients, switchClient, activeClient } = useClient();

  useEffect(() => {
    if (clientId && clients.length > 0) {
      if (!activeClient || activeClient.id !== clientId) {
        switchClient(clientId);
      }
    }
  }, [clientId, clients, activeClient, switchClient]);

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
          onClick={() => navigate('/instagram')}
          style={{ background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)', border: 'none' }}
        >
          <span style={{ marginRight: '0.5rem' }}>🎬</span> Creative Studio
        </button>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/linkedin')}
          style={{ background: 'linear-gradient(135deg, #0A66C2 0%, #004182 100%)', border: 'none' }}
        >
          <span style={{ marginRight: '0.5rem' }}>💼</span> LinkedIn Agent
        </button>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/linkedin-storage')}
          style={{ background: 'linear-gradient(135deg, #0A66C2 0%, #004182 100%)', border: 'none', opacity: 0.9 }}
        >
          <span style={{ marginRight: '0.5rem' }}>🗄️</span> LinkedIn Storage
        </button>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/influencers')}
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', border: 'none' }}
        >
          <span style={{ marginRight: '0.5rem' }}>🔍</span> Influencer Scout
        </button>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/vault')}
          style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none' }}
        >
          <span style={{ marginRight: '0.5rem' }}>🗄️</span> Vault
        </button>
      </div>
    </div>
  );
}
