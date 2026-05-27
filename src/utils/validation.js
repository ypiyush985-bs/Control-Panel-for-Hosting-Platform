/**
 * Validation utility functions for the Hosting Control Panel.
 * Each function returns { valid: boolean, error: string | null }.
 */

const DOMAIN_REGEX = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
const DATABASE_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/;
const DB_USER_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{0,31}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const FILENAME_CHAR_REGEX = /^[a-zA-Z0-9._\-\s]+$/;

/**
 * Validates a domain name.
 * Pattern: ^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$
 * Requirements: 3.3, 3.4
 *
 * @param {string} value
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateDomainName(value) {
  if (!value || value.trim() === '') {
    return { valid: false, error: 'Domain name is required.' };
  }
  if (!DOMAIN_REGEX.test(value)) {
    return {
      valid: false,
      error:
        'Invalid domain name. Use a format like "example.com" (letters, numbers, hyphens, and dots only).',
    };
  }
  return { valid: true, error: null };
}

/**
 * Validates a database name.
 * Pattern: ^[a-zA-Z][a-zA-Z0-9_]{0,63}$
 * Requirements: 5.2, 5.3
 *
 * @param {string} value
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateDatabaseName(value) {
  if (!value || value.trim() === '') {
    return { valid: false, error: 'Database name is required.' };
  }
  if (!DATABASE_REGEX.test(value)) {
    return {
      valid: false,
      error:
        'Invalid database name. Must start with a letter and contain only letters, numbers, or underscores (max 64 characters).',
    };
  }
  return { valid: true, error: null };
}

/**
 * Validates a database username.
 * Pattern: ^[a-zA-Z][a-zA-Z0-9_]{0,31}$
 * Requirements: 5.7, 5.8
 *
 * @param {string} value
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateDbUsername(value) {
  if (!value || value.trim() === '') {
    return { valid: false, error: 'Username is required.' };
  }
  if (!DB_USER_REGEX.test(value)) {
    return {
      valid: false,
      error:
        'Invalid username. Must start with a letter and contain only letters, numbers, or underscores (max 32 characters).',
    };
  }
  return { valid: true, error: null };
}

/**
 * Validates a database user password.
 * Rules: 8–128 non-whitespace characters (no whitespace-only passwords).
 * Requirements: 5.7, 5.8
 *
 * @param {string} value
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateDbPassword(value) {
  if (!value) {
    return { valid: false, error: 'Password is required.' };
  }
  if (/^\s+$/.test(value)) {
    return { valid: false, error: 'Password cannot consist of whitespace only.' };
  }
  // Strip whitespace to count non-whitespace characters
  const nonWhitespace = value.replace(/\s/g, '');
  if (nonWhitespace.length < 8) {
    return { valid: false, error: 'Password must be at least 8 non-whitespace characters.' };
  }
  if (nonWhitespace.length > 128) {
    return { valid: false, error: 'Password must not exceed 128 non-whitespace characters.' };
  }
  return { valid: true, error: null };
}

/**
 * Validates an email address.
 * Pattern: ^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$
 * Requirements: 6.2, 6.3
 *
 * @param {string} value
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateEmailAddress(value) {
  if (!value || value.trim() === '') {
    return { valid: false, error: 'Email address is required.' };
  }
  if (!EMAIL_REGEX.test(value)) {
    return {
      valid: false,
      error: 'Invalid email address. Use a format like "user@example.com".',
    };
  }
  return { valid: true, error: null };
}

/**
 * Validates an email account password.
 * Rule: at least 8 characters.
 * Requirements: 6.2, 6.3
 *
 * @param {string} value
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateEmailPassword(value) {
  if (!value) {
    return { valid: false, error: 'Password is required.' };
  }
  if (value.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters.' };
  }
  return { valid: true, error: null };
}

/**
 * Validates a filename for rename operations.
 * Rules:
 *   - Length between 1 and 255 characters (inclusive)
 *   - Only characters matching [a-zA-Z0-9._\-\s]
 * Requirements: 4.5, 4.6
 *
 * @param {string} value
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateFilename(value) {
  if (!value || value.length === 0) {
    return { valid: false, error: 'Filename is required.' };
  }
  if (value.length > 255) {
    return { valid: false, error: 'Filename must not exceed 255 characters.' };
  }
  if (!FILENAME_CHAR_REGEX.test(value)) {
    return {
      valid: false,
      error:
        'Filename contains invalid characters. Only letters, numbers, dots, underscores, hyphens, and spaces are allowed.',
    };
  }
  return { valid: true, error: null };
}
