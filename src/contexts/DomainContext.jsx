/**
 * DomainContext — manages the list of domains for the Hosting Control Panel.
 * Requirements: 3.1–3.8
 *
 * Provides the domain list and actions to add/delete domains.
 * Initial state is seeded from MOCK_DOMAINS.
 */

import { createContext, useContext, useReducer, useCallback } from 'react';
import { MOCK_DOMAINS } from '../data/mockData';

// ── Action types ─────────────────────────────────────────────────────────────

const ADD_DOMAIN = 'ADD_DOMAIN';
const DELETE_DOMAIN = 'DELETE_DOMAIN';

// ── Reducer ───────────────────────────────────────────────────────────────────

/**
 * @param {Array} state - Current domain list.
 * @param {{ type: string, payload: any }} action
 * @returns {Array} Next domain list.
 */
function domainReducer(state, action) {
  switch (action.type) {
    case ADD_DOMAIN:
      return [...state, action.payload];

    case DELETE_DOMAIN:
      return state.filter((d) => d.id !== action.payload);

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const DomainContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────────────────────

/**
 * DomainProvider wraps the application and exposes the domain list
 * along with addDomain / deleteDomain actions.
 *
 * Requirements: 3.1–3.8
 */
export function DomainProvider({ children }) {
  const [domains, dispatch] = useReducer(domainReducer, MOCK_DOMAINS);

  /**
   * Adds a new domain to the list.
   * Caller is responsible for validation and duplicate checks before calling.
   *
   * @param {string} name - The domain name to add (e.g. "example.com").
   */
  const addDomain = useCallback((name) => {
    /** @type {import('../data/mockData').Domain} */
    const newDomain = {
      id: crypto.randomUUID(),
      name,
      status: 'Active',
      createdAt: new Date(),
    };
    dispatch({ type: ADD_DOMAIN, payload: newDomain });
  }, []);

  /**
   * Removes a domain from the list by its id.
   *
   * @param {string} id - The id of the domain to remove.
   */
  const deleteDomain = useCallback((id) => {
    dispatch({ type: DELETE_DOMAIN, payload: id });
  }, []);

  const value = {
    domains,
    addDomain,
    deleteDomain,
  };

  return (
    <DomainContext.Provider value={value}>
      {children}
    </DomainContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useDomains — consume the DomainContext.
 * Must be used within a DomainProvider.
 *
 * @returns {{ domains: Array, addDomain: Function, deleteDomain: Function }}
 */
export function useDomains() {
  const ctx = useContext(DomainContext);
  if (!ctx) {
    throw new Error('useDomains must be used within a DomainProvider');
  }
  return ctx;
}

export default DomainContext;
