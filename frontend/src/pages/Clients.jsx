import React, { useState } from 'react';
import { useClient } from '../context/ClientContext.jsx';
import Card3D from '../components/Card3D.jsx';

export default function Clients() {
  const { clients, activeClient, switchClient, addClient, removeClient, loading } = useClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (formData.name && formData.name.trim()) {
      try {
        await addClient({
          brand_name: formData.name.trim(),
          name: formData.name.trim(),
          description: 'Active Brand Account',
          tagline: 'Active Brand Account',
          category: 'Brand Account'
        });
        setShowModal(false);
        setFormData({ name: '', description: '' });
      } catch (err) {
        // Keep modal open if save fails
      }
    }
  };

  return (
    <div className="clients-page" style={{ padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          Brand <span className="highlight-text">Account Management</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem', fontSize: '0.98rem' }}>
          Add and manage your agency's brand accounts.
        </p>
      </div>

      <div className="clients-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {loading && (
          <Card3D glowColor="indigo" style={{ textAlign: 'center', gridColumn: '1 / -1' }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Loading brand accounts…</p>
          </Card3D>
        )}
        {!loading && clients.length === 0 && (
          <Card3D glowColor="indigo" style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '30px' }}>
            <h3 style={{ margin: '0 0 6px 0', color: 'var(--text-primary)' }}>No Brand Accounts Configured</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Click "+ Add New Account" below to add your first brand account.
            </p>
          </Card3D>
        )}
        {!loading && clients.map(client => (
          <Card3D
            key={client.id}
            glowColor={activeClient?.id === client.id ? 'cyan' : 'indigo'}
            onClick={() => switchClient(client.id)}
            style={{
              cursor: 'pointer',
              border: activeClient?.id === client.id ? '2px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
              background: activeClient?.id === client.id ? 'linear-gradient(135deg, rgba(224, 242, 254, 0.65), rgba(240, 249, 255, 0.45))' : undefined
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {client.brand_name || client.name}
              </h3>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Are you sure you want to remove ${client.brand_name || client.name}?`)) {
                    removeClient(client.id);
                  }
                }}
                style={{ 
                  background: 'none', border: 'none', color: 'var(--text-tertiary)', 
                  cursor: 'pointer', fontSize: '1.4rem', padding: '0 0.4rem',
                  lineHeight: '1', transition: 'color 200ms ease'
                }}
                title="Remove client"
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
              >
                ×
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <span className="velocity-tag">{client.category || 'Brand Account'}</span>
              {activeClient?.id === client.id && (
                <span style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-cyan)', boxShadow: '0 0 8px var(--accent-cyan)' }}></span>
                  ACTIVE BRAND
                </span>
              )}
            </div>
          </Card3D>
        ))}

        {/* Add Client 3D Card */}
        <div 
          onClick={() => setShowModal(true)}
          style={{ 
            padding: '1.8rem', 
            border: '2px dashed rgba(56, 189, 248, 0.4)',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(240, 249, 255, 0.35)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            minHeight: '160px',
            transition: 'all 250ms ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(224, 242, 254, 0.6)'; e.currentTarget.style.borderColor = 'var(--accent-cyan)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(240, 249, 255, 0.35)'; e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)'; }}
        >
          <div style={{ fontSize: '2.2rem', color: 'var(--accent-primary)', marginBottom: '0.4rem', fontWeight: 300 }}>+</div>
          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700 }}>Add New Account</h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>Enter brand name to get started</span>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <Card3D glowColor="cyan" style={{ width: '100%', maxWidth: '440px' }}>
            <h2 style={{ marginTop: 0, color: 'var(--text-primary)', fontSize: '1.4rem' }}>Add New Account</h2>
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.4rem', fontWeight: 600 }}>ACCOUNT / BRAND NAME</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  placeholder="e.g. Acme Corp"
                  style={{
                    width: '100%', padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                    fontSize: '0.92rem', outline: 'none'
                  }}
                  autoFocus
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary-ai"
                  style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-ai"
                  style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
                >
                  Add Account
                </button>
              </div>
            </form>
          </Card3D>
        </div>
      )}
    </div>
  );
}
