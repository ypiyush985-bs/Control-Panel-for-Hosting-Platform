/**
 * Unit tests for ServerContext / ServerProvider / useServer hook.
 * Requirements: 8.1, 8.2, 8.6, 8.7, 8.8
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ServerProvider, useServer } from '../../contexts/ServerContext';

// ── Helpers ───────────────────────────────────────────────────────────────────

function wrapper({ failureRate = 0 } = {}) {
  return ({ children }) => (
    <ServerProvider failureRate={failureRate}>{children}</ServerProvider>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ServerContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('provides initial metrics with fetchError: false', () => {
    const { result } = renderHook(() => useServer(), { wrapper: wrapper() });

    const { metrics } = result.current;
    expect(metrics.fetchError).toBe(false);
    expect(metrics.cpuPercent).toBeGreaterThanOrEqual(0);
    expect(metrics.cpuPercent).toBeLessThanOrEqual(100);
    expect(metrics.ramPercent).toBeGreaterThanOrEqual(0);
    expect(metrics.ramPercent).toBeLessThanOrEqual(100);
    expect(metrics.diskPercent).toBeGreaterThanOrEqual(0);
    expect(metrics.diskPercent).toBeLessThanOrEqual(100);
  });

  it('provides initial history with at least one snapshot', () => {
    const { result } = renderHook(() => useServer(), { wrapper: wrapper() });
    expect(result.current.history.length).toBeGreaterThanOrEqual(1);
  });

  it('provides initial uptimeSeconds of 0', () => {
    const { result } = renderHook(() => useServer(), { wrapper: wrapper() });
    expect(result.current.uptimeSeconds).toBe(0);
  });

  it('updates metrics after one 5-second poll cycle (Requirement 8.2)', () => {
    const { result } = renderHook(() => useServer(), { wrapper: wrapper() });

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    const { metrics } = result.current;
    expect(metrics.fetchError).toBe(false);
    expect(metrics.lastUpdatedAt).toBeGreaterThan(0);
  });

  it('increments uptimeSeconds by 5 after one successful poll cycle (Requirement 8.7)', () => {
    const { result } = renderHook(() => useServer(), { wrapper: wrapper() });

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(result.current.uptimeSeconds).toBe(5);
  });

  it('increments uptimeSeconds by 15 after three successful poll cycles', () => {
    const { result } = renderHook(() => useServer(), { wrapper: wrapper() });

    act(() => {
      vi.advanceTimersByTime(15_000);
    });

    expect(result.current.uptimeSeconds).toBe(15);
  });

  it('pushes a snapshot to history on each successful poll cycle (Requirement 8.6)', () => {
    const { result } = renderHook(() => useServer(), { wrapper: wrapper() });
    const initialLength = result.current.history.length;

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(result.current.history.length).toBe(initialLength + 1);
  });

  it('caps history at 20 entries (Requirement 8.6)', () => {
    const { result } = renderHook(() => useServer(), { wrapper: wrapper() });

    // Advance enough cycles to exceed the 20-entry cap (25 cycles = 125s)
    act(() => {
      vi.advanceTimersByTime(125_000);
    });

    expect(result.current.history.length).toBeLessThanOrEqual(20);
  });

  it('each history snapshot has timestamp, cpuPercent, ramPercent fields', () => {
    const { result } = renderHook(() => useServer(), { wrapper: wrapper() });

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    const snapshot = result.current.history[result.current.history.length - 1];
    expect(snapshot).toHaveProperty('timestamp');
    expect(snapshot).toHaveProperty('cpuPercent');
    expect(snapshot).toHaveProperty('ramPercent');
  });

  it('sets fetchError: true on a simulated failure without updating metric values (Requirement 8.8)', () => {
    // failureRate: 1 means every poll cycle fails
    const { result } = renderHook(() => useServer(), {
      wrapper: wrapper({ failureRate: 1 }),
    });

    const metricsBefore = { ...result.current.metrics };

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    const { metrics } = result.current;
    expect(metrics.fetchError).toBe(true);
    // Metric values must be retained from before the failure
    expect(metrics.cpuPercent).toBe(metricsBefore.cpuPercent);
    expect(metrics.ramPercent).toBe(metricsBefore.ramPercent);
    expect(metrics.diskPercent).toBe(metricsBefore.diskPercent);
  });

  it('does NOT push a snapshot or increment uptime on a simulated failure (Requirement 8.8)', () => {
    const { result } = renderHook(() => useServer(), {
      wrapper: wrapper({ failureRate: 1 }),
    });

    const historyLengthBefore = result.current.history.length;
    const uptimeBefore = result.current.uptimeSeconds;

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(result.current.history.length).toBe(historyLengthBefore);
    expect(result.current.uptimeSeconds).toBe(uptimeBefore);
  });

  it('clears fetchError on the next successful poll after a failure', () => {
    // First cycle fails, subsequent cycles succeed
    let callCount = 0;
    const originalRandom = Math.random;
    Math.random = () => {
      callCount++;
      // First call per cycle is the failure check; fail only on cycle 1
      return callCount <= 1 ? 0.99 : 0.0;
    };

    const { result } = renderHook(() => useServer(), {
      wrapper: wrapper({ failureRate: 0.5 }),
    });

    // Cycle 1 — will fail (Math.random returns 0.99 > 0.5)
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(result.current.metrics.fetchError).toBe(true);

    // Cycle 2 — will succeed (Math.random returns 0.0 < 0.5)
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(result.current.metrics.fetchError).toBe(false);

    Math.random = originalRandom;
  });

  it('throws when useServer is called outside a ServerProvider', () => {
    // Suppress the React error boundary console output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useServer())).toThrow(
      'useServer must be used within a ServerProvider'
    );
    consoleSpy.mockRestore();
  });

  it('metric values stay within 0–100 after many poll cycles', () => {
    const { result } = renderHook(() => useServer(), { wrapper: wrapper() });

    act(() => {
      vi.advanceTimersByTime(500_000); // 100 cycles
    });

    const { metrics } = result.current;
    expect(metrics.cpuPercent).toBeGreaterThanOrEqual(0);
    expect(metrics.cpuPercent).toBeLessThanOrEqual(100);
    expect(metrics.ramPercent).toBeGreaterThanOrEqual(0);
    expect(metrics.ramPercent).toBeLessThanOrEqual(100);
    expect(metrics.diskPercent).toBeGreaterThanOrEqual(0);
    expect(metrics.diskPercent).toBeLessThanOrEqual(100);
  });
});
