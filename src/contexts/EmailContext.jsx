/**
 * EmailContext — manages email accounts for the Hosting Control Panel.
 * Requirements: 6.1–6.8
 *
 * Provides the email account list and actions to add, delete, suspend,
 * and activate email accounts. Initial state is seeded from MOCK_EMAIL_ACCOUNTS.
 */

import { createContext, useContext, useReducer, useCallback } from 'react';
import { MOCK_EMAIL_ACCOUNTS } from '../data/mockData';

// ── Action types ─────────────────────────────────────────────────────────────

const ADD_EMAIL = 'ADD_EMAIL';
const DELETE_EMAIL = 'DELETE_EMAIL';
const SUSPEND_EMAIL = 'SUSPEND_EMAIL';
const ACTIVATE_EMAIL = 'ACTIVATE_EMAIL';

// ── Reducer ───────────────────────────────────────────────────────────────────

/**
 * @param {Array} state - Current email account list.
 * @param {{ type: string, payload: any }} action
 * @returns {Array} Next email account list.
 */
function emailReducer(state, action) {
  switch (action.type) {
    case ADD_EMAIL:
      return [...state, action.payload];

    case DELETE_EMAIL:
      return state.filter((em) => em.id !== action.payload);

    case SUSPEND_EMAIL:
      // Updates the matching account's status to 'Suspended' (Requirement 6.4)
      return state.map((em) =>
        em.id === action.payload ? { ...em, status: 'Suspended' } : em
      );

    case ACTIVATE_EMAIL:
      // Updates the matching account's status to 'Active' (Requirement 6.5)
      return state.map((em) =>
        em.id === action.payload ? { ...em, status: 'Active' } : em
      );

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const EmailContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────────────────────

/**
 * EmailProvider wraps the application and exposes the email account list
 * along with addEmail / deleteEmail / suspendEmail / activateEmail actions.
 *
 * Requirements: 6.1–6.8
 */
export function EmailProvider({ children }) {
  const [emailAccounts, dispatch] = useReducer(emailReducer, MOCK_EMAIL_ACCOUNTS);

  /**
   * Adds a new email account to the list.
   * Caller is responsible for validation before calling.
   *
   * @param {string} address - The full email address (e.g. "user@example.com").
   * @param {number} [quotaMB=512] - Storage quota in MB (defaults to 512).
   */
  const addEmail = useCallback((address, quotaMB = 512) => {
    // Extract domain from the address
    const domain = address.includes('@') ? address.split('@')[1] : '';

    /** @type {import('../data/mockData').EmailAccount} */
    const newAccount = {
      id: crypto.randomUUID(),
      address,
      domain,
      quotaMB,
      status: 'Active',
    };
    dispatch({ type: ADD_EMAIL, payload: newAccount });
  }, []);

  /**
   * Removes an email account from the list by its id.
   *
   * @param {string} id - The id of the email account to remove.
   */
  const deleteEmail = useCallback((id) => {
    dispatch({ type: DELETE_EMAIL, payload: id });
  }, []);

  /**
   * Suspends an active email account (sets status to 'Suspended').
   *
   * @param {string} id - The id of the email account to suspend.
   */
  const suspendEmail = useCallback((id) => {
    dispatch({ type: SUSPEND_EMAIL, payload: id });
  }, []);

  /**
   * Activates a suspended email account (sets status to 'Active').
   *
   * @param {string} id - The id of the email account to activate.
   */
  const activateEmail = useCallback((id) => {
    dispatch({ type: ACTIVATE_EMAIL, payload: id });
  }, []);

  const value = {
    emailAccounts,
    addEmail,
    deleteEmail,
    suspendEmail,
    activateEmail,
  };

  return (
    <EmailContext.Provider value={value}>
      {children}
    </EmailContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useEmail — consume the EmailContext.
 * Must be used within an EmailProvider.
 *
 * @returns {{ emailAccounts: Array, addEmail: Function, deleteEmail: Function, suspendEmail: Function, activateEmail: Function }}
 */
export function useEmail() {
  const ctx = useContext(EmailContext);
  if (!ctx) {
    throw new Error('useEmail must be used within an EmailProvider');
  }
  return ctx;
}

export default EmailContext;
