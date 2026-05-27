/**
 * Theme resolution utility for the Hosting Control Panel.
 * Requirements: 9.1, 9.7, 9.8
 */

const STORAGE_KEY = 'hcp-theme';
const VALID_THEMES = ['light', 'dark'];

/**
 * Resolves the initial theme to apply when the application loads.
 *
 * Resolution order:
 * 1. If `localStorage['hcp-theme']` contains a valid theme ('light' or 'dark'),
 *    return that stored value (Requirement 9.7).
 * 2. If the stored value is invalid or absent, fall back to the OS-level
 *    color scheme preference (Requirement 9.8):
 *    - Return 'dark' if `prefers-color-scheme: dark` matches.
 *    - Return 'light' otherwise (including when no preference is detectable).
 *
 * This function is pure with respect to its inputs — it reads from
 * `localStorage` and `window.matchMedia` but does not write to either.
 *
 * @returns {'light' | 'dark'} The resolved theme.
 */
export function resolveInitialTheme() {
  // 1. Check localStorage for a previously persisted theme preference.
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (VALID_THEMES.includes(stored)) {
      return stored;
    }
  } catch {
    // localStorage may be unavailable in some environments (e.g., private
    // browsing with strict settings). Fall through to OS preference.
  }

  // 2. Fall back to OS-level color scheme preference.
  try {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // matchMedia may be unavailable (e.g., SSR or test environments without
    // a proper window implementation). Default to 'light'.
  }

  return 'light';
}
