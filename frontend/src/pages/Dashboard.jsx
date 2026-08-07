import { Link } from 'react-router-dom';
import { useClient } from '../context/ClientContext';
import Card3D from '../components/Card3D';
import './Dashboard.css';

export default function Dashboard() {
  const { currentClient } = useClient();

  const skills = [
    {
      title: 'CRO Auditor',
      subtitle: 'Landing Page Conversion Optimization',
      desc: 'Audit landing page copy, score conversion friction, and generate high-converting headline & CTA rewrites.',
      icon: '🎯',
      path: '/cro-auditor',
      badge: 'HOT',
      glow: 'cyan'
    },
    {
      title: 'Campaign Planner',
      subtitle: 'Multi-Channel Strategy Roadmap',
      desc: 'Design 7 to 30-day multi-channel launch blueprints across LinkedIn, Instagram, X/Twitter, and Email.',
      icon: '🎈',
      path: '/campaign-planner',
      badge: 'STRATEGY',
      glow: 'indigo'
    },
    {
      title: 'Market Detective',
      subtitle: 'Audience & Competitor Intelligence',
      desc: 'Extract customer pain points, viral hooks working right now, target persona profiles, and competitor gaps.',
      icon: '🕵️‍♂️',
      path: '/market-research',
      badge: 'RESEARCH',
      glow: 'ai'
    },
    {
      title: 'Influencer Scout',
      subtitle: 'Verified Creator Discovery',
      desc: 'Discover authentic YouTube & Instagram creators with automated fake-follower and engagement checks.',
      icon: '🌟',
      path: '/influencer-scout',
      badge: 'NEW',
      glow: 'cyan'
    },
    {
      title: 'Copy Polisher',
      subtitle: 'Instant Copy & UX Enhancer',
      desc: '1-click text rewrites for punchiness, urgency, simplicity, or premium brand positioning.',
      icon: '✏️',
      path: '/copy-polisher',
      badge: 'ENHANCER',
      glow: 'indigo'
    },
    {
      title: 'CCO Voice Boss',
      subtitle: 'Chief Content Officer Sign-Off',
      desc: 'Audit draft posts for 100% brand voice alignment and editorial ratio balance before publishing.',
      icon: '👮‍♂️',
      path: '/brand-voice',
      badge: 'GOVERNANCE',
      glow: 'ai'
    }
  ];

  return (
    <div className="dashboard-container">
      {/* Centered Floating Glass Command Hero */}
      <section className="command-hero-section">
        <Card3D className="command-hero-bubble" glowColor="cyan">
          <div className="hero-pill">
            <span className="hero-pill-dot"></span>
            <span>AUTONOMOUS MARKETING AGENT ENGINE</span>
          </div>
          <h1 className="hero-heading">
            Marketing Command Center
          </h1>
          <p className="hero-subtext">
            Orchestrate high-converting AI marketing campaigns, audit conversion friction, and scout verified creators.
          </p>
        </Card3D>
      </section>

      {/* Marketing Power Skills Suite Grid */}
      <section className="skills-suite-section">
        <div className="suite-header">
          <h3>⚡ MARKETING POWER SKILLS</h3>
          <p>Select a tool below to execute targeted marketing workflows</p>
        </div>

        <div className="skills-grid">
          {skills.map((skill, idx) => (
            <Card3D key={idx} className="skill-suite-card" glowColor={skill.glow}>
              <div className="skill-card-top">
                <span className="skill-icon">{skill.icon}</span>
                {skill.badge && <span className="skill-badge">{skill.badge}</span>}
              </div>
              <h4 className="skill-title">{skill.title}</h4>
              <span className="skill-subtitle">{skill.subtitle}</span>
              <p className="skill-desc">{skill.desc}</p>
              <Link to={skill.path} className="btn-launch-skill">
                <span>Launch Tool</span>
                <span className="arrow">→</span>
              </Link>
            </Card3D>
          ))}
        </div>
      </section>
    </div>
  );
}
