import { useTheme } from '../../contexts/ThemeContext';

/**
 * ThemeToggle — sun/moon icon button to switch light/dark theme.
 * Requirements: 9.2, 9.3, 11.5
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      style={{
        background: 'none',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        padding: '0.375rem 0.625rem',
        cursor: 'pointer',
        color: 'var(--text)',
        fontSize: '1rem',
        lineHeight: 1,
        transition: 'background 150ms ease',
      }}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
