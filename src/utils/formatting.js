/**
 * Formatting utility functions for the Hosting Control Panel.
 * Requirements: 3.1, 4.3, 8.7
 */

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Formats a Date object as "DD MMM YYYY" (e.g., "05 Jun 2025").
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTH_ABBR[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Formats a Date object as "DD MMM YYYY HH:MM" (e.g., "05 Jun 2025 14:30").
 * Uses 24-hour time with zero-padded hours and minutes.
 * @param {Date} date
 * @returns {string}
 */
export function formatDateTime(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTH_ABBR[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} ${hours}:${minutes}`;
}

/**
 * Formats a file size in bytes as a human-readable string.
 * Uses KB (1 decimal) if bytes < 1,048,576; otherwise MB (1 decimal).
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes < 1_048_576) {
    const kb = bytes / 1024;
    return `${kb.toFixed(1)} KB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

/**
 * Formats an uptime duration in seconds as "X days, Y hours, Z minutes".
 * days = floor(s / 86400)
 * hours = floor((s % 86400) / 3600)
 * minutes = floor((s % 3600) / 60)
 * @param {number} seconds - non-negative integer
 * @returns {string}
 */
export function formatUptime(seconds) {
  const s = Math.floor(seconds);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  return `${days} days, ${hours} hours, ${minutes} minutes`;
}
