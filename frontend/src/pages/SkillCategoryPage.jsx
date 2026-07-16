import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api.js';
import { CATEGORIES } from '../constants/skillCategories.js';
import SkillRunnerModal from '../components/SkillRunnerModal.jsx';
import '../styles/skillTiles.css';
import './SkillCategoryPage.css';

const CATEGORY_ICON_WRAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c.iconWrap]));

const SKILL_ICONS = {
  'ad-angles': '🎯',
  'ad-campaign-analyzer': '🚦',
  'ad-creative': '🖼️',
  'content-repurposer': '♻️',
  'content-strategy': '🧭',
  'social-post-writer': '✍️',
  'conversion-audit': '🔍',
  'reply-writer': '💬',
  'channel-discovery': '📡',
  'community-discovery': '👥',
  'competitor-content-analysis': '📰',
  'competitor-discovery': '🕵️',
  'competitor-landscape': '🗺️',
  'competitor-site-analysis': '🏢',
  'influencer-discovery': '⭐',
  'search-page-audit': '🌐',
};

export default function SkillCategoryPage() {
  const { category } = useParams();
  const navigate = useNavigate();

  const [skills, setSkills] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeSkill, setActiveSkill] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyEntry, setHistoryEntry] = useState(null);

  useEffect(() => {
    api.getMarketingSkills()
      .then(data => {
        if (Array.isArray(data)) setSkills(data);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const categorySkills = skills.filter(s => s.category === category);
  const categoryLabel = categorySkills[0]?.category_label || category;
  const skillIds = new Set(categorySkills.map(s => s.id));

  const toggleHistory = () => {
    const next = !showHistory;
    setShowHistory(next);
    if (next) {
      api.getMarketingSkillHistory()
        .then(data => {
          if (Array.isArray(data)) setHistory(data.filter(entry => skillIds.has(entry.skill_id)));
        })
        .catch(() => {});
    }
  };

  const openHistoryEntry = (entry) => {
    const skill = categorySkills.find(s => s.id === entry.skill_id);
    if (!skill) return;
    setHistoryEntry(entry);
    setActiveSkill(skill);
  };

  const closeModal = () => {
    setActiveSkill(null);
    setHistoryEntry(null);
  };

  // Option A — persistent top nav bar to jump between categories directly.
  const categoryNav = (
    <nav className="category-nav">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.key}
          className={`category-nav-item ${cat.key === category ? 'active' : ''}`}
          onClick={() => navigate(`/skills/${cat.key}`)}
        >
          <span>{cat.icon}</span> {cat.label}
        </button>
      ))}
    </nav>
  );

  if (loaded && categorySkills.length === 0) {
    return (
      <div className="skill-category-page">
        {categoryNav}
        <div className="skill-category-header">
          <button className="btn btn-sm btn-secondary" onClick={() => navigate('/')}>← Back to Dashboard</button>
          <h1>Unknown category</h1>
          <p>"{category}" isn't one of the marketing skill categories.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="skill-category-page">
      {categoryNav}

      <div className="skill-category-header">
        <button className="btn btn-sm btn-secondary" onClick={() => navigate('/')}>← Back to Dashboard</button>
        <h1><span className="gradient-text">{categoryLabel}</span> Skills</h1>
        <p>{categorySkills.length} skill{categorySkills.length === 1 ? '' : 's'} in this category.</p>
      </div>

      <div className="skill-category-actions">
        <button className="btn btn-sm btn-secondary" onClick={toggleHistory}>
          {showHistory ? 'Hide past runs' : 'View past runs'}
        </button>
      </div>

      {showHistory && (
        <div className="skills-history">
          {history.length === 0 && <p className="skills-history-empty">No runs yet in this category.</p>}
          {history.map((entry) => (
            <button
              key={entry.id}
              className="skills-history-item"
              onClick={() => openHistoryEntry(entry)}
            >
              <strong>{categorySkills.find(s => s.id === entry.skill_id)?.label || entry.skill_id}</strong>
              <span>{new Date(entry.created_at).toLocaleString()}</span>
              <p>{entry.brief.slice(0, 120)}</p>
            </button>
          ))}
        </div>
      )}

      <div className="skill-tiles">
        {categorySkills.map((skill) => (
          <button
            key={skill.id}
            className="skill-tile"
            onClick={() => { setHistoryEntry(null); setActiveSkill(skill); }}
            title={skill.description}
          >
            <span className={`skill-tile-icon-wrap ${CATEGORY_ICON_WRAP[skill.category] || 'icon-wrap-purple'}`}>
              <span className="skill-tile-icon">{SKILL_ICONS[skill.id] || '⚡'}</span>
            </span>
            <span className="skill-tile-label">{skill.label}</span>
          </button>
        ))}
      </div>

      {activeSkill && (
        <SkillRunnerModal
          skill={activeSkill}
          historyEntry={historyEntry}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
