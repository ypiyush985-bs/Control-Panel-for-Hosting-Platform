/**
 * Notification queue utility for the Hosting Control Panel.
 * Requirements: 10.6, 10.7
 */

const NOTIFICATION_CAP = 5;

/**
 * Adds a new notification item to the queue, enforcing a maximum of 5 items.
 * If the queue already contains 5 items, the oldest item (first element) is
 * evicted before the new item is appended.
 *
 * This function is pure — it does not mutate the input array.
 *
 * @param {Array} queue - The current notification queue (array of notification objects).
 * @param {Object} newItem - The new notification item to add.
 * @returns {Array} A new array containing the updated queue.
 */
export function addNotificationToQueue(queue, newItem) {
  const trimmed = queue.length >= NOTIFICATION_CAP
    ? queue.slice(queue.length - NOTIFICATION_CAP + 1)
    : queue.slice();

  return [...trimmed, newItem];
}
