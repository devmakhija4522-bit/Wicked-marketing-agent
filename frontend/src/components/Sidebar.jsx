import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useClient } from '../context/ClientContext.jsx';
import './Sidebar.css';

const agencyItems = [
  { path: '/', label: 'Dashboard', emoji: '🏠' },
  { path: '/clients', label: 'Manage Clients', emoji: '👥' },
  { path: '/settings', label: 'Settings', emoji: '⚙️' },
];

const workspaceItems = [
  { path: '/trends', label: 'Trends', emoji: '🔥' },
];

export default function Sidebar() {
  const location = useLocation();
  const { activeClient } = useClient();

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon">
              <span className="logo-w">W</span>
            </div>
            <div className="logo-text">
              <h1 className="logo-title">WICKED</h1>
              <span className="logo-subtitle">Marketing Agent</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '1rem 0 0.5rem 1rem', letterSpacing: '0.05em' }}>
            Agency
          </div>
          {agencyItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-item-active' : ''}`
              }
            >
              <span className="nav-icon">{item.emoji}</span>
              <span className="nav-label">{item.label}</span>
              {location.pathname === item.path && (
                <span className="nav-active-indicator" />
              )}
            </NavLink>
          ))}

          {activeClient && (
            <>
              {workspaceItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? 'nav-item-active' : ''}`
                  }
                  end={item.path === '/'}
                >
                  <span className="nav-icon">{item.emoji}</span>
                  <span className="nav-label">{item.label}</span>
                  {location.pathname === item.path && (
                    <span className="nav-active-indicator" />
                  )}
                </NavLink>
              ))}
              
              {activeClient.brand_name?.toLowerCase() === 'grest' && (
                <>
                  <NavLink
                    to="/linkedin-storage"
                    className={({ isActive }) =>
                      `nav-item ${isActive ? 'nav-item-active' : ''}`
                    }
                  >
                    <span className="nav-icon">🗄️</span>
                    <span className="nav-label">LinkedIn Storage</span>
                    {location.pathname === '/linkedin-storage' && (
                      <span className="nav-active-indicator" />
                    )}
                  </NavLink>
                  <NavLink
                    to="/influencers"
                    className={({ isActive }) =>
                      `nav-item ${isActive ? 'nav-item-active' : ''}`
                    }
                  >
                    <span className="nav-icon">🔍</span>
                    <span className="nav-label">Influencer Scout</span>
                    {location.pathname === '/influencers' && (
                      <span className="nav-active-indicator" />
                    )}
                  </NavLink>
                </>
              )}
            </>
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-status">
            <span className="status-dot" />
            <span className="status-text">Backend Connected</span>
          </div>
          <div className="sidebar-footer">
            <span className="sidebar-brand-text">Active Client: {activeClient?.brand_name || 'None'}</span>
          </div>
        </div>
      </aside>

      {/* Mobile hamburger */}
      <div className="mobile-header">
        <div className="mobile-logo">
          <div className="logo-icon logo-icon-sm">
            <span className="logo-w">W</span>
          </div>
          <span className="logo-title logo-title-sm">WICKED</span>
        </div>
      </div>
    </>
  );
}
