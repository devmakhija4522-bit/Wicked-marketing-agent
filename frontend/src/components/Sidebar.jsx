import { NavLink } from 'react-router-dom';
import { useClient } from '../context/ClientContext.jsx';
import './Sidebar.css';

const navSections = [
  {
    title: 'AGENCY MATRIX',
    items: [
      { path: '/', label: 'Command Center', icon: '🚀', badge: 'MAIN' },
      { path: '/clients', label: 'Brand Clients', icon: '👥', badge: 'PROFILES' },
      { path: '/analytics', label: 'Analytics', icon: '📈' },
    ]
  }
];

export default function Sidebar() {
  const { currentClient } = useClient();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand-box">
        <div className="sidebar-logo">
          <span className="logo-spark">⚡</span>
        </div>
        <div className="sidebar-brand-info">
          <span className="brand-title">WICKED</span>
          <span className="brand-tag">AI AGENT ENGINE</span>
        </div>
      </div>

      <div className="active-client-card">
        <div className="client-badge">
          <span className="client-pulse"></span>
          <span className="client-header">CURRENT BRAND</span>
        </div>
        <div className="client-name-row">
          <span className="client-name">{currentClient ? (currentClient.brand_name || currentClient.name) : 'No Active Brand'}</span>
          <span className="client-type">{currentClient ? (currentClient.category || currentClient.industry || 'Profile') : 'Unassigned'}</span>
        </div>
      </div>

      <nav className="sidebar-menu">
        {navSections.map((section) => (
          <div key={section.title} className="menu-group">
            <div className="group-title">{section.title}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span className="link-icon">{item.icon}</span>
                <span className="link-label">{item.label}</span>
                {item.badge && <span className="link-badge">{item.badge}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
