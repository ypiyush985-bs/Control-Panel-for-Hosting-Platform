import { useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import './Notification.css';

/**
 * Notification — single toast item.
 * Auto-dismisses after 5s for type 'success'. Errors persist until dismissed.
 * Requirements: 10.1–10.8, 11.7
 */
export function Notification({ id, type, message }) {
  const { dismissNotification } = useNotifications();

  useEffect(() => {
    if (type !== 'success') return;
    const timer = setTimeout(() => dismissNotification(id), 5000);
    return () => clearTimeout(timer);
  }, [id, type, dismissNotification]);

  return (
    <div className={`notification notification--${type}`} role="status">
      <span className="notification__message">{message}</span>
      <button
        className="notification__dismiss"
        aria-label="Dismiss notification"
        onClick={() => dismissNotification(id)}
      >
        ✕
      </button>
    </div>
  );
}

/**
 * NotificationStack — renders up to 5 notifications in a fixed overlay.
 * Uses two aria-live regions: polite for success, assertive for errors.
 * Requirements: 10.1–10.8, 11.7
 */
export function NotificationStack() {
  const { notifications } = useNotifications();

  const successes = notifications.filter((n) => n.type === 'success');
  const errors    = notifications.filter((n) => n.type === 'error');

  return (
    <div className="notification-stack" aria-label="Notifications">
      <div aria-live="polite" aria-atomic="false">
        {successes.map((n) => (
          <Notification key={n.id} {...n} />
        ))}
      </div>
      <div aria-live="assertive" aria-atomic="false">
        {errors.map((n) => (
          <Notification key={n.id} {...n} />
        ))}
      </div>
    </div>
  );
}
