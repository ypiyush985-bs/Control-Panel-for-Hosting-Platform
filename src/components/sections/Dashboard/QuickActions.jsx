import { useNavigation } from '../../../contexts/NavigationContext';

const ACTIONS = [
  { label: '+ Add Domain',        section: 'domains',   emoji: '🌐' },
  { label: '+ Create Database',   section: 'databases', emoji: '🗄️' },
  { label: '+ Add Email Account', section: 'email',     emoji: '✉️' },
  { label: '📁 File Manager',     section: 'files',     emoji: '' },
  { label: '🔒 SSL Manager',      section: 'ssl',       emoji: '' },
  { label: '📊 Server Monitor',   section: 'server',    emoji: '' },
];

/**
 * QuickActions — shortcut buttons that navigate and optionally open a form.
 * Requirements: 2.3, 2.4
 */
export default function QuickActions() {
  const { navigateTo } = useNavigation();

  function handleAction(section) {
    navigateTo(section, { type: 'open-create-form', target: section });
  }

  return (
    <div className="card">
      <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.875rem' }}>Quick Actions</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
        {ACTIONS.map(({ label, section }) => (
          <button
            key={section}
            className="btn"
            onClick={() => handleAction(section)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
