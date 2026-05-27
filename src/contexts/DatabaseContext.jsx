/**
 * DatabaseContext — manages databases and their users for the Hosting Control Panel.
 * Requirements: 5.1–5.10
 *
 * Provides the database list and actions to add/delete databases and users.
 * Initial state is seeded from MOCK_DATABASES.
 */

import { createContext, useContext, useReducer, useCallback } from 'react';
import { MOCK_DATABASES } from '../data/mockData';

// ── Action types ─────────────────────────────────────────────────────────────

const ADD_DATABASE = 'ADD_DATABASE';
const DELETE_DATABASE = 'DELETE_DATABASE';
const ADD_DB_USER = 'ADD_DB_USER';
const DELETE_DB_USER = 'DELETE_DB_USER';

// ── Reducer ───────────────────────────────────────────────────────────────────

/**
 * @param {Array} state - Current database list.
 * @param {{ type: string, payload: any }} action
 * @returns {Array} Next database list.
 */
function databaseReducer(state, action) {
  switch (action.type) {
    case ADD_DATABASE:
      return [...state, action.payload];

    case DELETE_DATABASE:
      // Removes the database and all its associated users (Requirement 5.5)
      return state.filter((db) => db.id !== action.payload);

    case ADD_DB_USER:
      return state.map((db) => {
        if (db.id !== action.payload.databaseId) return db;
        return { ...db, users: [...db.users, action.payload.user] };
      });

    case DELETE_DB_USER:
      return state.map((db) => {
        if (db.id !== action.payload.databaseId) return db;
        return {
          ...db,
          users: db.users.filter((u) => u.id !== action.payload.userId),
        };
      });

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const DatabaseContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────────────────────

/**
 * DatabaseProvider wraps the application and exposes the database list
 * along with addDatabase / deleteDatabase / addDbUser / deleteDbUser actions.
 *
 * Requirements: 5.1–5.10
 */
export function DatabaseProvider({ children }) {
  const [databases, dispatch] = useReducer(databaseReducer, MOCK_DATABASES);

  /**
   * Adds a new database to the list.
   * Caller is responsible for validation and duplicate checks before calling.
   *
   * @param {string} name - The database name to add.
   */
  const addDatabase = useCallback((name) => {
    /** @type {import('../data/mockData').Database} */
    const newDatabase = {
      id: crypto.randomUUID(),
      name,
      sizeMB: 0,
      users: [],
    };
    dispatch({ type: ADD_DATABASE, payload: newDatabase });
  }, []);

  /**
   * Removes a database and all its associated users from the list.
   *
   * @param {string} id - The id of the database to remove.
   */
  const deleteDatabase = useCallback((id) => {
    dispatch({ type: DELETE_DATABASE, payload: id });
  }, []);

  /**
   * Adds a new user to the specified database.
   * Caller is responsible for validation and duplicate checks before calling.
   *
   * @param {string} databaseId - The id of the database to add the user to.
   * @param {string} username - The username for the new database user.
   */
  const addDbUser = useCallback((databaseId, username) => {
    /** @type {import('../data/mockData').DatabaseUser} */
    const newUser = {
      id: crypto.randomUUID(),
      username,
      databaseId,
    };
    dispatch({ type: ADD_DB_USER, payload: { databaseId, user: newUser } });
  }, []);

  /**
   * Removes a user from the specified database.
   *
   * @param {string} databaseId - The id of the database containing the user.
   * @param {string} userId - The id of the user to remove.
   */
  const deleteDbUser = useCallback((databaseId, userId) => {
    dispatch({ type: DELETE_DB_USER, payload: { databaseId, userId } });
  }, []);

  const value = {
    databases,
    addDatabase,
    deleteDatabase,
    addDbUser,
    deleteDbUser,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useDatabases — consume the DatabaseContext.
 * Must be used within a DatabaseProvider.
 *
 * @returns {{ databases: Array, addDatabase: Function, deleteDatabase: Function, addDbUser: Function, deleteDbUser: Function }}
 */
export function useDatabases() {
  const ctx = useContext(DatabaseContext);
  if (!ctx) {
    throw new Error('useDatabases must be used within a DatabaseProvider');
  }
  return ctx;
}

export default DatabaseContext;
