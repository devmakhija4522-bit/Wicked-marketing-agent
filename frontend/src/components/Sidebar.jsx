import { NavLink } from 'react-router-dom';
import { useClient } from '../context/ClientContext.jsx';
import './Sidebar.css';

const navSections = [
  {
    title: 'AGENCY MATRIX',
    items: [
      { path: '/', label: 'Command Center', icon: '🚀', badge: 'MAIN' },
      { path: '/analytics', label: 'Analytics', icon: '📈' },
    ]
  }
];

export default function Sidebar() {
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
