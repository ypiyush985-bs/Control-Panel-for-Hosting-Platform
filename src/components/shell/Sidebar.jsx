import { useNavigation } from '../../contexts/NavigationContext';
import './Sidebar.css';

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',     icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'deploy',      label: 'Deploy',        icon: 'M5 3l14 9-14 9V3z' },
  { id: 'domains',     label: 'Domains',       icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
  { id: 'files',       label: 'File Manager',  icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
  { id: 'databases',   label: 'Databases',     icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' },
  { id: 'email',       label: 'Email',         icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { id: 'ssl',         label: 'SSL',           icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { id: 'server',      label: 'Server',        icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01' },
];

function NavIcon({ path }) {
  return (
    <svg className="sidebar__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

/**
 * Sidebar — collapsible navigation panel.
 * Requirements: 1.1–1.3, 1.5–1.8, 11.1, 11.5, 11.6
 */
export default function Sidebar({ expanded, onToggle }) {
  const { activeSection, navigateTo } = useNavigation();

  return (
    <aside className={`sidebar${expanded ? '' : ' sidebar--collapsed'}`}>
      <div className="sidebar__header">
        <span className="sidebar__logo">⚡ HCP</span>
        <button
          className="sidebar__toggle"
          onClick={onToggle}
          aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {expanded ? '◀' : '▶'}
        </button>
      </div>

      <nav className="sidebar__nav" aria-label="Main navigation">
        {NAV_ITEMS.map(({ id, label, icon }) => (
          <button
            key={id}
            className={`sidebar__item${activeSection === id ? ' sidebar__item--active' : ''}`}
            onClick={() => navigateTo(id)}
            aria-label={expanded ? undefined : label}
            aria-current={activeSection === id ? 'page' : undefined}
          >
            <NavIcon path={icon} />
            <span className="sidebar__label">{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
