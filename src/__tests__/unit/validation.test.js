/**
 * Unit tests for src/utils/validation.js
 * Requirements: 3.3, 3.4, 4.5, 4.6, 5.2, 5.3, 5.7, 5.8, 6.2, 6.3
 */

import { describe, it, expect } from 'vitest';
import {
  validateDomainName,
  validateDatabaseName,
  validateDbUsername,
  validateDbPassword,
  validateEmailAddress,
  validateEmailPassword,
  validateFilename,
} from '../../utils/validation.js';

// ── validateDomainName ────────────────────────────────────────────────────────

describe('validateDomainName', () => {
  it('returns valid for a simple domain', () => {
    expect(validateDomainName('example.com')).toEqual({ valid: true, error: null });
  });

  it('returns valid for a subdomain', () => {
    expect(validateDomainName('sub.example.com')).toEqual({ valid: true, error: null });
  });

  it('returns valid for a domain with hyphens', () => {
    expect(validateDomainName('my-site.co.uk')).toEqual({ valid: true, error: null });
  });

  it('returns invalid for an empty string', () => {
    const result = validateDomainName('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns invalid for a domain without a TLD', () => {
    const result = validateDomainName('example');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns invalid for a domain with a single-char TLD', () => {
    const result = validateDomainName('example.c');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns invalid for a domain starting with a dot', () => {
    const result = validateDomainName('.example.com');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns invalid for a domain with spaces', () => {
    const result = validateDomainName('my site.com');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns invalid for null/undefined', () => {
    expect(validateDomainName(null).valid).toBe(false);
    expect(validateDomainName(undefined).valid).toBe(false);
  });
});

// ── validateDatabaseName ──────────────────────────────────────────────────────

describe('validateDatabaseName', () => {
  it('returns valid for a simple name starting with a letter', () => {
    expect(validateDatabaseName('mydb')).toEqual({ valid: true, error: null });
  });

  it('returns valid for a name with letters, numbers, and underscores', () => {
    expect(validateDatabaseName('my_db_01')).toEqual({ valid: true, error: null });
  });

  it('returns valid for a name exactly 64 characters long', () => {
    const name = 'a' + 'b'.repeat(63);
    expect(validateDatabaseName(name)).toEqual({ valid: true, error: null });
  });

  it('returns invalid for an empty string', () => {
    const result = validateDatabaseName('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns invalid for a name starting with a digit', () => {
    const result = validateDatabaseName('1mydb');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns invalid for a name starting with an underscore', () => {
    const result = validateDatabaseName('_mydb');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns invalid for a name exceeding 64 characters', () => {
    const name = 'a' + 'b'.repeat(64); // 65 chars total
    const result = validateDatabaseName(name);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns invalid for a name with hyphens', () => {
    const result = validateDatabaseName('my-db');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

// ── validateDbUsername ────────────────────────────────────────────────────────

describe('validateDbUsername', () => {
  it('returns valid for a simple username', () => {
    expect(validateDbUsername('admin')).toEqual({ valid: true, error: null });
  });

  it('returns valid for a username with letters, numbers, and underscores', () => {
    expect(validateDbUsername('user_01')).toEqual({ valid: true, error: null });
  });

  it('returns valid for a username exactly 32 characters long', () => {
    const name = 'a' + 'b'.repeat(31);
    expect(validateDbUsername(name)).toEqual({ valid: true, error: null });
  });

  it('returns invalid for an empty string', () => {
    const result = validateDbUsername('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns invalid for a username starting with a digit', () => {
    const result = validateDbUsername('1user');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns invalid for a username exceeding 32 characters', () => {
    const name = 'a' + 'b'.repeat(32); // 33 chars total
    const result = validateDbUsername(name);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns invalid for a username with hyphens', () => {
    const result = validateDbUsername('my-user');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

// ── validateDbPassword ────────────────────────────────────────────────────────

describe('validateDbPassword', () => {
  it('returns valid for a password with 8 non-whitespace characters', () => {
    expect(validateDbPassword('password')).toEqual({ valid: true, error: null });
  });

  it('returns valid for a password with exactly 128 non-whitespace characters', () => {
    const pwd = 'a'.repeat(128);
    expect(validateDbPassword(pwd)).toEqual({ valid: true, error: null });
  });

  it('returns valid for a mixed password with some spaces (8+ non-whitespace)', () => {
    expect(validateDbPassword('pass word1')).toEqual({ valid: true, error: null });
  });

  it('returns invalid for an empty string', () => {
    const result = validateDbPassword('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns invalid for a whitespace-only password', () => {
    const result = validateDbPassword('        ');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns invalid for fewer than 8 non-whitespace characters', () => {
    const result = validateDbPassword('abc123');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns invalid for more than 128 non-whitespace characters', () => {
    const pwd = 'a'.repeat(129);
    const result = validateDbPassword(pwd);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

// ── validateEmailAddress ──────────────────────────────────────────────────────

describe('validateEmailAddress', () => {
  it('returns valid for a standard email address', () => {
    expect(validateEmailAddress('user@example.com')).toEqual({ valid: true, error: null });
  });

  it('returns valid for an email with plus addressing', () => {
    expect(validateEmailAddress('user+tag@example.com')).toEqual({ valid: true, error: null });
  });

  it('returns valid for an email with dots in local part', () => {
    expect(validateEmailAddress('first.last@example.co.uk')).toEqual({ valid: true, error: null });
  });

  it('returns invalid for an empty string', () => {
    const result = validateEmailAddress('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns invalid for a string without @', () => {
    const result = validateEmailAddress('userexample.com');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns invalid for a string without a domain', () => {
    const result = validateEmailAddress('user@');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns invalid for a string with a single-char TLD', () => {
    const result = validateEmailAddress('user@example.c');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns invalid for a string with spaces', () => {
    const result = validateEmailAddress('user @example.com');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

// ── validateEmailPassword ─────────────────────────────────────────────────────

describe('validateEmailPassword', () => {
  it('returns valid for a password with exactly 8 characters', () => {
    expect(validateEmailPassword('password')).toEqual({ valid: true, error: null });
  });

  it('returns valid for a long password', () => {
    expect(validateEmailPassword('a'.repeat(100))).toEqual({ valid: true, error: null });
  });

  it('returns invalid for an empty string', () => {
    const result = validateEmailPassword('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns invalid for a password shorter than 8 characters', () => {
    const result = validateEmailPassword('abc123');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns invalid for a 7-character password', () => {
    const result = validateEmailPassword('1234567');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

// ── validateFilename ──────────────────────────────────────────────────────────

describe('validateFilename', () => {
  it('returns valid for a simple filename', () => {
    expect(validateFilename('myfile.txt')).toEqual({ valid: true, error: null });
  });

  it('returns valid for a filename with spaces', () => {
    expect(validateFilename('my file.txt')).toEqual({ valid: true, error: null });
  });

  it('returns valid for a filename with dots, underscores, and hyphens', () => {
    expect(validateFilename('my_file-v2.0.txt')).toEqual({ valid: true, error: null });
  });

  it('returns valid for a filename exactly 255 characters long', () => {
    const name = 'a'.repeat(255);
    expect(validateFilename(name)).toEqual({ valid: true, error: null });
  });

  it('returns invalid for an empty string', () => {
    const result = validateFilename('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns invalid for a filename exceeding 255 characters', () => {
    const name = 'a'.repeat(256);
    const result = validateFilename(name);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns invalid for a filename with special characters like @', () => {
    const result = validateFilename('file@name.txt');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns invalid for a filename with a slash', () => {
    const result = validateFilename('path/file.txt');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns invalid for a filename with a null byte', () => {
    const result = validateFilename('file\0name');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
