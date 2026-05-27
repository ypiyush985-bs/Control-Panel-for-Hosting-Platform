/**
 * Unit tests for src/utils/ssl.js
 * Requirements: 7.2, 7.3, 7.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { isExpiringSoon, computeSSLExpiry } from '../../utils/ssl.js';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * ONE_DAY_MS;
const THREE_SIXTY_FIVE_DAYS_MS = 365 * ONE_DAY_MS;

// ── isExpiringSoon ────────────────────────────────────────────────────────────

describe('isExpiringSoon', () => {
  it('returns true when expiry is exactly today (0 days away)', () => {
    const now = Date.now();
    expect(isExpiringSoon(new Date(now))).toBe(true);
  });

  it('returns true when expiry is 1 day from now', () => {
    expect(isExpiringSoon(new Date(Date.now() + ONE_DAY_MS))).toBe(true);
  });

  it('returns true when expiry is 29 days from now', () => {
    expect(isExpiringSoon(new Date(Date.now() + 29 * ONE_DAY_MS))).toBe(true);
  });

  it('returns true when expiry is exactly 30 days from now', () => {
    expect(isExpiringSoon(new Date(Date.now() + THIRTY_DAYS_MS))).toBe(true);
  });

  it('returns false when expiry is 31 days from now', () => {
    expect(isExpiringSoon(new Date(Date.now() + 31 * ONE_DAY_MS))).toBe(false);
  });

  it('returns false when expiry is 365 days from now', () => {
    expect(isExpiringSoon(new Date(Date.now() + THREE_SIXTY_FIVE_DAYS_MS))).toBe(false);
  });

  it('returns false when expiry is in the past (already expired)', () => {
    expect(isExpiringSoon(new Date(Date.now() - ONE_DAY_MS))).toBe(false);
  });

  it('returns false for null input', () => {
    expect(isExpiringSoon(null)).toBe(false);
  });

  it('returns false for undefined input', () => {
    expect(isExpiringSoon(undefined)).toBe(false);
  });

  it('returns false for an invalid Date object', () => {
    expect(isExpiringSoon(new Date('not-a-date'))).toBe(false);
  });

  it('returns false for a non-Date value', () => {
    expect(isExpiringSoon('2025-12-31')).toBe(false);
  });
});

// ── computeSSLExpiry ──────────────────────────────────────────────────────────

describe('computeSSLExpiry', () => {
  it('returns a Date instance', () => {
    expect(computeSSLExpiry()).toBeInstanceOf(Date);
  });

  it('returns a date approximately 365 days from now', () => {
    const before = Date.now();
    const expiry = computeSSLExpiry();
    const after = Date.now();

    const expectedMs = THREE_SIXTY_FIVE_DAYS_MS;
    // Allow a 1-second tolerance for test execution time
    expect(expiry.getTime()).toBeGreaterThanOrEqual(before + expectedMs);
    expect(expiry.getTime()).toBeLessThanOrEqual(after + expectedMs + 1000);
  });

  it('returns a date in the future', () => {
    expect(computeSSLExpiry().getTime()).toBeGreaterThan(Date.now());
  });

  it('returns a date more than 364 days from now', () => {
    const expiry = computeSSLExpiry();
    const minExpected = Date.now() + 364 * ONE_DAY_MS;
    expect(expiry.getTime()).toBeGreaterThan(minExpected);
  });

  it('returns a date no more than 366 days from now', () => {
    const expiry = computeSSLExpiry();
    const maxExpected = Date.now() + 366 * ONE_DAY_MS;
    expect(expiry.getTime()).toBeLessThan(maxExpected);
  });

  it('a freshly computed expiry is NOT expiring soon (365 days away)', () => {
    const expiry = computeSSLExpiry();
    expect(isExpiringSoon(expiry)).toBe(false);
  });
});
