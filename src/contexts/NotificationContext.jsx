/**
 * NotificationContext — global notification queue for the Hosting Control Panel.
 * Requirements: 10.1, 10.2, 10.3, 10.6, 10.7
 *
 * Manages a queue of up to 5 simultaneous notifications. When a 6th notification
 * is added, the oldest is evicted via the addNotificationToQueue utility.
 */

import { createContext, useContext, useReducer, useCallback } from 'react';
import { addNotificationToQueue } from '../utils/notifications';

// ── Action types ─────────────────────────────────────────────────────────────

const ADD = 'ADD';
const DISMISS = 'DISMISS';

// ── Reducer ───────────────────────────────────────────────────────────────────

/**
 * @param {Array} state - Current notification queue.
 * @param {{ type: string, payload: any }} action
 * @returns {Array} Next notification queue.
 */
function notificationReducer(state, action) {
  switch (action.type) {
    case ADD:
      // addNotificationToQueue enforces the 5-item cap, evicting the oldest
      // when the queue is already at capacity (Requirement 10.6, 10.7).
      return addNotificationToQueue(state, action.payload);

    case DISMISS:
      return state.filter((n) => n.id !== action.payload);

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const NotificationContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────────────────────

/**
 * NotificationProvider wraps the application and exposes the notification queue
 * along with addNotification / dismissNotification actions.
 */
export function NotificationProvider({ children }) {
  const [notifications, dispatch] = useReducer(notificationReducer, []);

  /**
   * Adds a notification to the queue.
   * @param {{ type: 'success' | 'error', message: string }} notification
   */
  const addNotification = useCallback(({ type, message }) => {
    const item = {
      id: crypto.randomUUID(),
      type,
      message,
      createdAt: Date.now(),
    };
    dispatch({ type: ADD, payload: item });
  }, []);

  /**
   * Removes a notification from the queue by its id.
   * @param {string} id
   */
  const dismissNotification = useCallback((id) => {
    dispatch({ type: DISMISS, payload: id });
  }, []);

  const value = {
    notifications,
    addNotification,
    dismissNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useNotifications — consume the NotificationContext.
 * Must be used within a NotificationProvider.
 *
 * @returns {{ notifications: Array, addNotification: Function, dismissNotification: Function }}
 */
export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
}
