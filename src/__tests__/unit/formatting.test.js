/**
 * Unit tests for src/utils/formatting.js
 * Requirements: 3.1, 4.3, 8.7
 */

import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatFileSize,
  formatUptime,
} from '../../utils/formatting.js';

// ── formatDate ────────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('formats a date as DD MMM YYYY with zero-padded day', () => {
    expect(formatDate(new Date(2025, 5, 5))).toBe('05 Jun 2025'); // month is 0-indexed
  });

  it('formats a date with a two-digit day', () => {
    expect(formatDate(new Date(2025, 0, 31))).toBe('31 Jan 2025');
  });

  it('formats the first day of the year', () => {
    expect(formatDate(new Date(2024, 0, 1))).toBe('01 Jan 2024');
  });

  it('formats the last day of the year', () => {
    expect(formatDate(new Date(2024, 11, 31))).toBe('31 Dec 2024');
  });

  it('uses correct three-letter month abbreviations for all months', () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach((abbr, i) => {
      const result = formatDate(new Date(2025, i, 15));
      expect(result).toContain(abbr);
    });
  });

  it('accepts a date string as input', () => {
    expect(formatDate('2025-06-05T00:00:00')).toMatch(/05 Jun 2025/);
  });
});

// ── formatDateTime ────────────────────────────────────────────────────────────

describe('formatDateTime', () => {
  it('formats a datetime as DD MMM YYYY HH:MM with zero-padded values', () => {
    expect(formatDateTime(new Date(2025, 5, 5, 9, 7))).toBe('05 Jun 2025 09:07');
  });

  it('formats midnight correctly', () => {
    expect(formatDateTime(new Date(2025, 0, 1, 0, 0))).toBe('01 Jan 2025 00:00');
  });

  it('formats end of day correctly', () => {
    expect(formatDateTime(new Date(2025, 11, 31, 23, 59))).toBe('31 Dec 2025 23:59');
  });

  it('zero-pads single-digit hours and minutes', () => {
    const result = formatDateTime(new Date(2025, 2, 3, 4, 5));
    expect(result).toBe('03 Mar 2025 04:05');
  });

  it('uses 24-hour time format', () => {
    expect(formatDateTime(new Date(2025, 5, 15, 14, 30))).toBe('15 Jun 2025 14:30');
  });
});

// ── formatFileSize ────────────────────────────────────────────────────────────

describe('formatFileSize', () => {
  it('formats 0 bytes as KB', () => {
    expect(formatFileSize(0)).toBe('0.0 KB');
  });

  it('formats bytes below 1 MB as KB with 1 decimal', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
  });

  it('formats 512 bytes as 0.5 KB', () => {
    expect(formatFileSize(512)).toBe('0.5 KB');
  });

  it('formats 1,047,575 bytes (just below 1 MB threshold) as KB', () => {
    // 1,047,575 / 1024 = 1023.0... KB
    const result = formatFileSize(1_047_575);
    expect(result).toMatch(/KB$/);
  });

  it('formats exactly 1,048,576 bytes (1 MB) as MB', () => {
    expect(formatFileSize(1_048_576)).toBe('1.0 MB');
  });

  it('formats bytes at or above 1 MB as MB with 1 decimal', () => {
    expect(formatFileSize(2_097_152)).toBe('2.0 MB');
  });

  it('formats 1.5 MB correctly', () => {
    expect(formatFileSize(1_572_864)).toBe('1.5 MB');
  });

  it('formats large files in MB', () => {
    // 500 MB = 524,288,000 bytes
    expect(formatFileSize(524_288_000)).toBe('500.0 MB');
  });
});

// ── formatUptime ──────────────────────────────────────────────────────────────

describe('formatUptime', () => {
  it('formats 0 seconds as "0 days, 0 hours, 0 minutes"', () => {
    expect(formatUptime(0)).toBe('0 days, 0 hours, 0 minutes');
  });

  it('formats exactly 1 minute (60 seconds)', () => {
    expect(formatUptime(60)).toBe('0 days, 0 hours, 1 minutes');
  });

  it('formats exactly 1 hour (3600 seconds)', () => {
    expect(formatUptime(3600)).toBe('0 days, 1 hours, 0 minutes');
  });

  it('formats exactly 1 day (86400 seconds)', () => {
    expect(formatUptime(86400)).toBe('1 days, 0 hours, 0 minutes');
  });

  it('formats a mixed duration correctly', () => {
    // 14 days, 3 hours, 22 minutes
    const seconds = 14 * 86400 + 3 * 3600 + 22 * 60;
    expect(formatUptime(seconds)).toBe('14 days, 3 hours, 22 minutes');
  });

  it('floors partial minutes', () => {
    // 90 seconds = 1 minute and 30 seconds → 0 days, 0 hours, 1 minutes
    expect(formatUptime(90)).toBe('0 days, 0 hours, 1 minutes');
  });

  it('floors partial hours', () => {
    // 3659 seconds = 0 days, 1 hour, 0 minutes (59 seconds leftover, floored)
    expect(formatUptime(3659)).toBe('0 days, 1 hours, 0 minutes');
  });

  it('handles large uptime values', () => {
    // 365 days = 31,536,000 seconds
    expect(formatUptime(31_536_000)).toBe('365 days, 0 hours, 0 minutes');
  });

  it('accepts floating-point seconds by flooring them', () => {
    // 61.9 seconds → floor to 61 → 0 days, 0 hours, 1 minutes
    expect(formatUptime(61.9)).toBe('0 days, 0 hours, 1 minutes');
  });
});
