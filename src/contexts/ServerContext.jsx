/**
 * ServerContext — simulated server resource monitoring for the Hosting Control Panel.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
 *
 * Responsibilities:
 *  - Maintain current ServerMetrics (cpuPercent, ramPercent, diskPercent,
 *    lastUpdatedAt, fetchError).
 *  - Maintain a rolling history of MetricSnapshot entries (max 20).
 *  - Track server uptime in seconds.
 *  - Poll every 5 seconds using a random-walk algorithm to generate realistic
 *    metric fluctuations.
 *  - On a simulated failure cycle, set fetchError: true and retain last values.
 *  - Expose state via useServer() hook.
 */

import { createContext, useContext, useEffect, useRef, useState } from 'react';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Polling interval in milliseconds (Requirement 8.2). */
const POLL_INTERVAL_MS = 5_000;

/** Maximum number of history snapshots to retain (Requirement 8.6). */
const MAX_HISTORY = 20;

/**
 * Probability (0–1) that any given poll cycle simulates a fetch failure.
 * Set to 0 in production; can be overridden in tests via the context default.
 * (Requirement 8.8)
 */
export const SIMULATE_FAILURE_RATE = 0;

/**
 * Maximum random-walk step size per poll cycle (percentage points).
 * Keeps metric values from jumping unrealistically.
 */
const WALK_STEP = 5;

// ── Initial metric values ─────────────────────────────────────────────────────

/** @returns {import('../types').ServerMetrics} */
function createInitialMetrics() {
  return {
    cpuPercent: 32,
    ramPercent: 54,
    diskPercent: 67,
    lastUpdatedAt: Date.now(),
    fetchError: false,
  };
}

// ── Random-walk helpers ───────────────────────────────────────────────────────

/**
 * Clamps a value to the inclusive range [min, max].
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Advances a metric value by a random step in [-WALK_STEP, +WALK_STEP],
 * clamped to [0, 100].
 * @param {number} current - Current metric value (0–100).
 * @returns {number} Next metric value.
 */
function randomWalkStep(current) {
  const delta = (Math.random() * 2 - 1) * WALK_STEP;
  return clamp(Math.round(current + delta), 0, 100);
}

// ── Context ───────────────────────────────────────────────────────────────────

const ServerContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────────────────────

/**
 * ServerProvider
 *
 * Wraps the application (or a subtree) and starts the 5-second polling loop
 * on mount. The interval is cleared on unmount to prevent memory leaks.
 *
 * @param {{ children: React.ReactNode, failureRate?: number }} props
 *   failureRate — override SIMULATE_FAILURE_RATE for testing (0–1).
 */
export function ServerProvider({ children, failureRate = SIMULATE_FAILURE_RATE }) {
  const [metrics, setMetrics] = useState(createInitialMetrics);

  /**
   * history: MetricSnapshot[] — rolling window of up to MAX_HISTORY snapshots.
   * Each snapshot records { timestamp, cpuPercent, ramPercent }.
   * (Requirement 8.6)
   */
  const [history, setHistory] = useState(() => [
    {
      timestamp: Date.now(),
      cpuPercent: 32,
      ramPercent: 54,
    },
  ]);

  /**
   * uptimeSeconds — incremented by 5 on every successful poll cycle.
   * (Requirement 8.7)
   */
  const [uptimeSeconds, setUptimeSeconds] = useState(0);

  // Keep a ref to the latest metrics so the interval callback always reads
  // the current values without needing them in its dependency array.
  const metricsRef = useRef(metrics);
  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);

  // Keep a ref to the current failureRate so tests can change it without
  // restarting the interval.
  const failureRateRef = useRef(failureRate);
  useEffect(() => {
    failureRateRef.current = failureRate;
  }, [failureRate]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      // Requirement 8.8 — simulate occasional fetch failures.
      // A random value >= (1 - failureRate) triggers a failure, so that
      // failureRate=1 always fails and failureRate=0 never fails.
      const isFailed = Math.random() >= (1 - failureRateRef.current);

      if (isFailed) {
        // On failure: set fetchError flag, retain last known metric values,
        // do NOT push a new snapshot, do NOT increment uptime.
        setMetrics((prev) => ({
          ...prev,
          fetchError: true,
        }));
        return;
      }

      // Successful poll: advance each metric via random walk.
      const current = metricsRef.current;
      const nextCpu = randomWalkStep(current.cpuPercent);
      const nextRam = randomWalkStep(current.ramPercent);
      const nextDisk = randomWalkStep(current.diskPercent);
      const now = Date.now();

      // Update metrics (Requirement 8.1, 8.2).
      setMetrics({
        cpuPercent: nextCpu,
        ramPercent: nextRam,
        diskPercent: nextDisk,
        lastUpdatedAt: now,
        fetchError: false,
      });

      // Push snapshot to history, keeping only the last MAX_HISTORY entries
      // (Requirement 8.6).
      const snapshot = {
        timestamp: now,
        cpuPercent: nextCpu,
        ramPercent: nextRam,
      };
      setHistory((prev) => [...prev, snapshot].slice(-MAX_HISTORY));

      // Increment uptime by the poll interval in seconds (Requirement 8.7).
      setUptimeSeconds((prev) => prev + POLL_INTERVAL_MS / 1_000);
    }, POLL_INTERVAL_MS);

    // Cleanup on unmount to prevent memory leaks.
    return () => clearInterval(intervalId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Note: intentionally empty deps — the interval is set up once on mount.
  // failureRate changes are handled via failureRateRef.

  const value = {
    /** @type {import('../types').ServerMetrics} */
    metrics,
    /** @type {import('../types').MetricSnapshot[]} */
    history,
    /** @type {number} */
    uptimeSeconds,
  };

  return (
    <ServerContext.Provider value={value}>
      {children}
    </ServerContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useServer — consume the ServerContext.
 *
 * Must be used within a ServerProvider.
 *
 * @returns {{
 *   metrics: import('../types').ServerMetrics,
 *   history: import('../types').MetricSnapshot[],
 *   uptimeSeconds: number
 * }}
 * @throws {Error} if called outside of a ServerProvider
 */
export function useServer() {
  const ctx = useContext(ServerContext);
  if (ctx === null) {
    throw new Error('useServer must be used within a ServerProvider');
  }
  return ctx;
}
