/**
 * Unit tests for src/contexts/ThemeContext.jsx
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext.jsx';

// ── Helpers ───────────────────────────────────────────────────────────────────

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

/** Simple consumer component that renders the current theme and a toggle button. */
function ThemeConsumer() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
  // Reset data-theme attribute between tests.
  document.documentElement.removeAttribute('data-theme');
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ThemeProvider — initial theme resolution', () => {
  it('applies stored "light" theme on mount (Req 9.7)', () => {
    localStorage.setItem('hcp-theme', 'light');
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme-value').textContent).toBe('light');
  });

  it('applies stored "dark" theme on mount (Req 9.7)', () => {
    localStorage.setItem('hcp-theme', 'dark');
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme-value').textContent).toBe('dark');
  });

  it('falls back to OS dark preference when no valid theme is stored (Req 9.1, 9.8)', () => {
    window.matchMedia = mockMatchMedia(true); // OS prefers dark
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme-value').textContent).toBe('dark');
  });

  it('falls back to "light" when no stored theme and OS prefers light (Req 9.1)', () => {
    window.matchMedia = mockMatchMedia(false);
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme-value').textContent).toBe('light');
  });

  it('discards invalid stored theme and uses OS preference (Req 9.8)', () => {
    localStorage.setItem('hcp-theme', 'blue');
    window.matchMedia = mockMatchMedia(true); // OS prefers dark
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme-value').textContent).toBe('dark');
  });
});

describe('ThemeProvider — data-theme attribute (Req 9.4, 9.5)', () => {
  it('sets data-theme="light" on <html> when theme is light', () => {
    localStorage.setItem('hcp-theme', 'light');
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('sets data-theme="dark" on <html> when theme is dark', () => {
    localStorage.setItem('hcp-theme', 'dark');
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('updates data-theme on <html> after toggle', async () => {
    localStorage.setItem('hcp-theme', 'light');
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    await userEvent.click(screen.getByRole('button', { name: /toggle/i }));

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});

describe('ThemeProvider — localStorage persistence (Req 9.6)', () => {
  it('persists theme to localStorage on mount', () => {
    localStorage.setItem('hcp-theme', 'dark');
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(localStorage.getItem('hcp-theme')).toBe('dark');
  });

  it('persists new theme to localStorage after toggle', async () => {
    localStorage.setItem('hcp-theme', 'light');
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: /toggle/i }));

    expect(localStorage.getItem('hcp-theme')).toBe('dark');
  });
});

describe('ThemeProvider — toggleTheme (Req 9.3)', () => {
  it('switches from light to dark on first toggle', async () => {
    localStorage.setItem('hcp-theme', 'light');
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: /toggle/i }));

    expect(screen.getByTestId('theme-value').textContent).toBe('dark');
  });

  it('switches from dark to light on first toggle', async () => {
    localStorage.setItem('hcp-theme', 'dark');
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: /toggle/i }));

    expect(screen.getByTestId('theme-value').textContent).toBe('light');
  });

  it('returns to original theme after two toggles (round-trip)', async () => {
    localStorage.setItem('hcp-theme', 'light');
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    const btn = screen.getByRole('button', { name: /toggle/i });
    await userEvent.click(btn);
    await userEvent.click(btn);

    expect(screen.getByTestId('theme-value').textContent).toBe('light');
  });
});

describe('useTheme — error boundary', () => {
  it('throws when used outside ThemeProvider', () => {
    // Suppress the expected React error boundary console output.
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<ThemeConsumer />);
    }).toThrow('useTheme must be used within a ThemeProvider');

    consoleSpy.mockRestore();
  });
});
