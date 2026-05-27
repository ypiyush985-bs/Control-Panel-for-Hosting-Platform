import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { NavigationProvider, useNavigation } from '../../contexts/NavigationContext';

const wrapper = ({ children }) => <NavigationProvider>{children}</NavigationProvider>;

describe('NavigationContext', () => {
  it('initialises activeSection to "dashboard"', () => {
    const { result } = renderHook(() => useNavigation(), { wrapper });
    expect(result.current.activeSection).toBe('dashboard');
  });

  it('initialises pendingAction to null', () => {
    const { result } = renderHook(() => useNavigation(), { wrapper });
    expect(result.current.pendingAction).toBeNull();
  });

  it('navigateTo updates activeSection', () => {
    const { result } = renderHook(() => useNavigation(), { wrapper });

    act(() => {
      result.current.navigateTo('domains');
    });

    expect(result.current.activeSection).toBe('domains');
  });

  it('navigateTo can carry a pendingAction', () => {
    const { result } = renderHook(() => useNavigation(), { wrapper });
    const action = { type: 'open-create-form', target: 'domains' };

    act(() => {
      result.current.navigateTo('domains', action);
    });

    expect(result.current.activeSection).toBe('domains');
    expect(result.current.pendingAction).toEqual(action);
  });

  it('navigateTo without action leaves pendingAction null', () => {
    const { result } = renderHook(() => useNavigation(), { wrapper });

    act(() => {
      result.current.navigateTo('email');
    });

    expect(result.current.pendingAction).toBeNull();
  });

  it('clearPendingAction resets pendingAction to null', () => {
    const { result } = renderHook(() => useNavigation(), { wrapper });
    const action = { type: 'open-create-form', target: 'databases' };

    act(() => {
      result.current.navigateTo('databases', action);
    });
    expect(result.current.pendingAction).toEqual(action);

    act(() => {
      result.current.clearPendingAction();
    });
    expect(result.current.pendingAction).toBeNull();
  });

  it('navigateTo supports all valid section IDs', () => {
    const { result } = renderHook(() => useNavigation(), { wrapper });
    const sections = ['dashboard', 'domains', 'files', 'databases', 'email', 'ssl', 'server'];

    for (const section of sections) {
      act(() => {
        result.current.navigateTo(section);
      });
      expect(result.current.activeSection).toBe(section);
    }
  });

  it('useNavigation throws when used outside NavigationProvider', () => {
    // Suppress the expected React error boundary output
    const consoleError = console.error;
    console.error = () => {};

    expect(() => renderHook(() => useNavigation())).toThrow(
      'useNavigation must be used within a NavigationProvider'
    );

    console.error = consoleError;
  });
});
