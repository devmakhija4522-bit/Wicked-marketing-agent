import React, { useState } from 'react';
import { useClient } from '../context/ClientContext.jsx';

export default function Clients() {
  const { clients, activeClient, switchClient, addClient, removeClient, loading } = useClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (formData.name && formData.description) {
      try {
        await addClient(formData);
        setShowModal(false);
        setFormData({ name: '', description: '' });
      } catch (err) {
        // Keep modal open if save fails
      }
    }
  };

  return (
    <div className="clients-page" style={{ padding: '2rem' }}>
      <h1><span className="gradient-text">Client</span> Management</h1>
      <p>Manage your agency's clients and their brand profiles.</p>

      <div className="clients-grid" style={{ display: 'grid', gap: '1rem', marginTop: '2rem' }}>
        {loading && (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-muted)' }}>
            <p style={{ margin: 0 }}>Loading clients…</p>
          </div>
        )}
        {!loading && clients.length === 0 && (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-muted)' }}>
            <p style={{ margin: 0 }}>No clients yet — click + to add one</p>
          </div>
        )}
        {!loading && clients.map(client => (
          <div
            key={client.id}
            className={`glass-panel ${activeClient?.id === client.id ? 'active' : ''}`}
            onClick={() => switchClient(client.id)}
            style={{
              padding: '1.5rem',
              cursor: 'pointer',
              border: activeClient?.id === client.id ? '1px solid var(--accent-purple)' : '1px solid var(--border)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3 style={{ margin: 0, paddingRight: '1rem' }}>{client.brand_name}</h3>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Are you sure you want to remove ${client.brand_name}?`)) {
                    removeClient(client.id);
                  }
                }}
                style={{ 
                  background: 'none', border: 'none', color: 'var(--text-muted)', 
                  cursor: 'pointer', fontSize: '1.2rem', padding: '0.2rem',
                  lineHeight: '1'
                }}
                title="Remove client"
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-crimson)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                ×
              </button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem', marginTop: '0.5rem' }}>{client.tagline}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-purple">{client.category}</span>
              {activeClient?.id === client.id && (
                <span style={{ color: 'var(--accent-purple)', fontSize: '0.85rem', fontWeight: 600 }}>Active</span>
              )}
            </div>
          </div>
        ))}

        {/* Add Client Card */}
        <div 
          className="glass-panel"
          onClick={() => setShowModal(true)}
          style={{ 
            padding: '1.5rem', 
            border: '2px dashed var(--border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            minHeight: '160px',
            opacity: 0.7,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; e.currentTarget.style.borderColor = 'var(--accent-purple)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.7; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <div style={{ fontSize: '2rem', color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>+</div>
          <h3 style={{ margin: 0, color: 'var(--text-muted)' }}>Add Client</h3>
        </div>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '400px', border: '1px solid var(--accent-purple)' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Add New Client</h2>
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Client Name</label>
                <input 
                  type="text" 
                  required 
                  className="glass-input" 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Client Business Description</label>
                <textarea 
                  required 
                  className="glass-input" 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: 'white', minHeight: '100px', resize: 'vertical' }}
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Client</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
