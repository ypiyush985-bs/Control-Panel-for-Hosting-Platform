/**
 * Unit tests for src/utils/theme.js
 * Requirements: 9.1, 9.7, 9.8
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolveInitialTheme } from '../../utils/theme.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Creates a minimal matchMedia mock that returns the given `matches` value
 * for any media query.
 */
function mockMatchMedia(matches) {
  return vi.fn().mockImplementation(() => ({
    matches,
    media: '',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// ── resolveInitialTheme ───────────────────────────────────────────────────────

describe('resolveInitialTheme', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Requirement 9.7: valid stored theme is applied ──────────────────────────

  it('returns "light" when localStorage contains "light"', () => {
    localStorage.setItem('hcp-theme', 'light');
    expect(resolveInitialTheme()).toBe('light');
  });

  it('returns "dark" when localStorage contains "dark"', () => {
    localStorage.setItem('hcp-theme', 'dark');
    expect(resolveInitialTheme()).toBe('dark');
  });

  it('ignores OS preference when a valid theme is stored', () => {
    localStorage.setItem('hcp-theme', 'light');
    // Even if OS prefers dark, the stored value wins.
    window.matchMedia = mockMatchMedia(true);
    expect(resolveInitialTheme()).toBe('light');
  });

  // ── Requirement 9.8: invalid stored theme is discarded ─────────────────────

  it('falls back to OS preference when localStorage contains an invalid value', () => {
    localStorage.setItem('hcp-theme', 'blue');
    window.matchMedia = mockMatchMedia(true); // OS prefers dark
    expect(resolveInitialTheme()).toBe('dark');
  });

  it('falls back to OS preference when localStorage contains an empty string', () => {
    localStorage.setItem('hcp-theme', '');
    window.matchMedia = mockMatchMedia(false); // OS prefers light
    expect(resolveInitialTheme()).toBe('light');
  });

  it('falls back to OS preference when localStorage contains null (key absent)', () => {
    // localStorage.getItem returns null when the key is not set.
    window.matchMedia = mockMatchMedia(true); // OS prefers dark
    expect(resolveInitialTheme()).toBe('dark');
  });

  // ── Requirement 9.1: OS preference fallback ────────────────────────────────

  it('returns "dark" when no stored theme and OS prefers dark', () => {
    window.matchMedia = mockMatchMedia(true);
    expect(resolveInitialTheme()).toBe('dark');
  });

  it('returns "light" when no stored theme and OS prefers light', () => {
    window.matchMedia = mockMatchMedia(false);
    expect(resolveInitialTheme()).toBe('light');
  });

  it('returns "light" when no stored theme and matchMedia is unavailable', () => {
    // Simulate an environment where matchMedia throws.
    window.matchMedia = vi.fn().mockImplementation(() => {
      throw new Error('matchMedia not supported');
    });
    expect(resolveInitialTheme()).toBe('light');
  });

  // ── Edge cases ──────────────────────────────────────────────────────────────

  it('treats "DARK" (wrong case) as invalid and falls back to OS preference', () => {
    localStorage.setItem('hcp-theme', 'DARK');
    window.matchMedia = mockMatchMedia(false);
    expect(resolveInitialTheme()).toBe('light');
  });

  it('treats "Light" (mixed case) as invalid and falls back to OS preference', () => {
    localStorage.setItem('hcp-theme', 'Light');
    window.matchMedia = mockMatchMedia(true);
    expect(resolveInitialTheme()).toBe('dark');
  });

  it('does not write to localStorage', () => {
    window.matchMedia = mockMatchMedia(true);
    resolveInitialTheme();
    expect(localStorage.getItem('hcp-theme')).toBeNull();
  });
});
