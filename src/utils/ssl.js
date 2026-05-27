/**
 * SSL utility functions for the Hosting Control Panel.
 * Requirements: 7.2, 7.3, 7.4
 */

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const THREE_SIXTY_FIVE_DAYS_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Returns true if the given expiry date is within 30 days of now.
 * Used to determine whether to show the yellow warning indicator on an SSL row.
 *
 * @param {Date} expiresAt - The SSL certificate expiry date.
 * @returns {boolean} true if the certificate expires within 30 days from now.
 */
export function isExpiringSoon(expiresAt) {
  if (!(expiresAt instanceof Date) || isNaN(expiresAt.getTime())) {
    return false;
  }
  const now = Date.now();
  const msUntilExpiry = expiresAt.getTime() - now;
  return msUntilExpiry >= 0 && msUntilExpiry <= THIRTY_DAYS_MS;
}

/**
 * Returns a Date that is exactly 365 days from now.
 * Used when installing or renewing an SSL certificate.
 *
 * @returns {Date} A Date object 365 days in the future.
 */
export function computeSSLExpiry() {
  return new Date(Date.now() + THREE_SIXTY_FIVE_DAYS_MS);
}
