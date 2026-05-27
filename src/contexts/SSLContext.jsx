/**
 * SSLContext — manages SSL certificate records for the Hosting Control Panel.
 * Requirements: 7.1–7.7
 *
 * Provides the SSL record list and actions to install, renew, and revoke
 * SSL certificates. Initial state is seeded from MOCK_SSL_RECORDS.
 */

import { createContext, useContext, useReducer, useCallback } from 'react';
import { MOCK_SSL_RECORDS } from '../data/mockData';
import { computeSSLExpiry } from '../utils/ssl';

// ── Action types ─────────────────────────────────────────────────────────────

const INSTALL_SSL = 'INSTALL_SSL';
const RENEW_SSL = 'RENEW_SSL';
const REVOKE_SSL = 'REVOKE_SSL';

// ── Reducer ───────────────────────────────────────────────────────────────────

/**
 * @param {Array} state - Current SSL record list.
 * @param {{ type: string, payload: any }} action
 * @returns {Array} Next SSL record list.
 */
function sslReducer(state, action) {
  switch (action.type) {
    case INSTALL_SSL:
      // Sets status to 'Active' with a 365-day expiry (Requirement 7.2)
      return state.map((record) => {
        if (record.domainId !== action.payload.domainId) return record;
        return {
          ...record,
          status: 'Active',
          expiresAt: action.payload.expiresAt,
          issuer: action.payload.issuer,
        };
      });

    case RENEW_SSL:
      // Resets expiry to 365 days from now, keeps status Active (Requirement 7.3)
      return state.map((record) => {
        if (record.domainId !== action.payload.domainId) return record;
        return {
          ...record,
          status: 'Active',
          expiresAt: action.payload.expiresAt,
        };
      });

    case REVOKE_SSL:
      // Clears status to 'None', nulls expiresAt and issuer (Requirement 7.7)
      return state.map((record) => {
        if (record.domainId !== action.payload) return record;
        return {
          ...record,
          status: 'None',
          expiresAt: null,
          issuer: null,
        };
      });

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const SSLContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────────────────────

/**
 * SSLProvider wraps the application and exposes the SSL record list
 * along with installSSL / renewSSL / revokeSSL actions.
 *
 * Requirements: 7.1–7.7
 */
export function SSLProvider({ children }) {
  const [sslRecords, dispatch] = useReducer(sslReducer, MOCK_SSL_RECORDS);

  /**
   * Installs an SSL certificate for a domain with status 'None'.
   * Sets status to 'Active' with an expiry 365 days from now.
   *
   * @param {string} domainId - The id of the domain to install SSL for.
   */
  const installSSL = useCallback((domainId) => {
    dispatch({
      type: INSTALL_SSL,
      payload: {
        domainId,
        expiresAt: computeSSLExpiry(),
        issuer: "Let's Encrypt",
      },
    });
  }, []);

  /**
   * Renews an SSL certificate for a domain with status 'Active' or 'Expired'.
   * Resets the expiry date to 365 days from now.
   *
   * @param {string} domainId - The id of the domain to renew SSL for.
   */
  const renewSSL = useCallback((domainId) => {
    dispatch({
      type: RENEW_SSL,
      payload: {
        domainId,
        expiresAt: computeSSLExpiry(),
      },
    });
  }, []);

  /**
   * Revokes an SSL certificate for a domain with status 'Active'.
   * Sets status to 'None' and clears expiresAt and issuer.
   *
   * @param {string} domainId - The id of the domain to revoke SSL for.
   */
  const revokeSSL = useCallback((domainId) => {
    dispatch({ type: REVOKE_SSL, payload: domainId });
  }, []);

  const value = {
    sslRecords,
    installSSL,
    renewSSL,
    revokeSSL,
  };

  return (
    <SSLContext.Provider value={value}>
      {children}
    </SSLContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useSSL — consume the SSLContext.
 * Must be used within an SSLProvider.
 *
 * @returns {{ sslRecords: Array, installSSL: Function, renewSSL: Function, revokeSSL: Function }}
 */
export function useSSL() {
  const ctx = useContext(SSLContext);
  if (!ctx) {
    throw new Error('useSSL must be used within an SSLProvider');
  }
  return ctx;
}

export default SSLContext;
