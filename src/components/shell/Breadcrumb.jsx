import { useNavigation } from '../../contexts/NavigationContext';

const SECTION_NAMES = {
  dashboard: 'Dashboard',
  deploy:    'Deploy',
  domains:   'Domains',
  files:     'File Manager',
  databases: 'Databases',
  email:     'Email',
  ssl:       'SSL',
  server:    'Server Monitor',
};

/**
 * Breadcrumb — shows current section name.
 * Requirements: 1.4, 11.5
 */
export default function Breadcrumb() {
  const { activeSection } = useNavigation();
  const name = SECTION_NAMES[activeSection] ?? activeSection;

  return (
    <nav aria-label="breadcrumb">
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.875rem' }}>
        <li style={{ color: 'var(--text-muted)' }}>Control Panel</li>
        <li style={{ color: 'var(--text-muted)' }} aria-hidden="true">›</li>
        <li style={{ color: 'var(--text-h)', fontWeight: 600 }} aria-current="page">{name}</li>
      </ol>
    </nav>
  );
}
