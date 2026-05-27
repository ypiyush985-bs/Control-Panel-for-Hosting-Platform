/**
 * Unit tests for src/utils/notifications.js
 * Requirements: 10.6, 10.7
 */

import { describe, it, expect } from 'vitest';
import { addNotificationToQueue } from '../../utils/notifications.js';

// Helper to create a minimal notification object
const makeItem = (id) => ({ id, type: 'success', message: `Notification ${id}` });

// ── addNotificationToQueue ────────────────────────────────────────────────────

describe('addNotificationToQueue', () => {
  it('adds the first item to an empty queue', () => {
    const item = makeItem('a');
    const result = addNotificationToQueue([], item);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(item);
  });

  it('appends a new item when queue has fewer than 5 items', () => {
    const queue = [makeItem('a'), makeItem('b')];
    const newItem = makeItem('c');
    const result = addNotificationToQueue(queue, newItem);
    expect(result).toHaveLength(3);
    expect(result[2]).toBe(newItem);
  });

  it('allows up to 5 items without eviction', () => {
    const queue = [makeItem('a'), makeItem('b'), makeItem('c'), makeItem('d')];
    const newItem = makeItem('e');
    const result = addNotificationToQueue(queue, newItem);
    expect(result).toHaveLength(5);
    expect(result[4]).toBe(newItem);
  });

  it('evicts the oldest item when adding a 6th notification', () => {
    const first = makeItem('first');
    const queue = [first, makeItem('b'), makeItem('c'), makeItem('d'), makeItem('e')];
    const sixth = makeItem('sixth');
    const result = addNotificationToQueue(queue, sixth);
    expect(result).toHaveLength(5);
    expect(result.find((n) => n.id === 'first')).toBeUndefined();
    expect(result[4]).toBe(sixth);
  });

  it('retains the 5 most recent items after eviction', () => {
    const items = ['a', 'b', 'c', 'd', 'e'].map(makeItem);
    const sixth = makeItem('f');
    const result = addNotificationToQueue(items, sixth);
    const ids = result.map((n) => n.id);
    expect(ids).toEqual(['b', 'c', 'd', 'e', 'f']);
  });

  it('does not mutate the original queue array', () => {
    const queue = [makeItem('a'), makeItem('b')];
    const original = [...queue];
    addNotificationToQueue(queue, makeItem('c'));
    expect(queue).toHaveLength(original.length);
    expect(queue[0]).toBe(original[0]);
  });

  it('caps at 5 even when called multiple times in sequence', () => {
    let queue = [];
    for (let i = 0; i < 10; i++) {
      queue = addNotificationToQueue(queue, makeItem(String(i)));
    }
    expect(queue).toHaveLength(5);
  });

  it('preserves the order of remaining items after eviction', () => {
    const items = ['1', '2', '3', '4', '5'].map(makeItem);
    const newItem = makeItem('6');
    const result = addNotificationToQueue(items, newItem);
    expect(result.map((n) => n.id)).toEqual(['2', '3', '4', '5', '6']);
  });

  it('works with error-type notifications', () => {
    const errorItem = { id: 'err1', type: 'error', message: 'Something failed' };
    const result = addNotificationToQueue([], errorItem);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('error');
  });
});
