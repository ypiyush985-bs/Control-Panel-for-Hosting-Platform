/**
 * ThemeContext — manages the active light/dark theme for the Hosting Control Panel.
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8
 *
 * Responsibilities:
 *  - Resolve the initial theme via `resolveInitialTheme()` (reads localStorage
 *    then falls back to OS preference).
 *  - On every theme change, write `data-theme` to `<html>` and persist the
 *    value to `localStorage['hcp-theme']`.
 *  - Expose `theme` and `toggleTheme()` to consumers via `useTheme()`.
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { resolveInitialTheme } from '../utils/theme.js';

// ── Context ───────────────────────────────────────────────────────────────────

const ThemeContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────────────────────

/**
 * ThemeProvider
 *
 * Wrap the application (or a subtree) with this provider to make theme state
 * available to all descendants.
 *
 * @param {{ children: React.ReactNode }} props
 */
export function ThemeProvider({ children }) {
  // Requirement 9.7 / 9.8 / 9.1 — resolve initial theme from storage / OS pref.
  const [theme, setTheme] = useState(() => resolveInitialTheme());

  // Requirement 9.4 / 9.5 / 9.6 — keep <html data-theme> and localStorage in
  // sync with the current theme value on every change (including the initial render).
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('hcp-theme', theme);
    } catch {
      // localStorage may be unavailable in some environments (e.g., private
      // browsing with strict settings). Silently ignore the failure.
    }
  }, [theme]);

  // Requirement 9.3 — toggle between 'light' and 'dark'.
  function toggleTheme() {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useTheme
 *
 * Returns `{ theme, toggleTheme }` from the nearest `ThemeProvider`.
 *
 * @returns {{ theme: 'light' | 'dark', toggleTheme: () => void }}
 * @throws {Error} if called outside of a ThemeProvider
 */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (ctx === null) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
