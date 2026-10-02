import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { REMINDER_LEAD_MS, getReminderTime } from './reminderTime.ts';

const NOW = Date.parse('2026-03-01T10:00:00Z');

describe('getReminderTime', () => {
  test('bitişten 2 saat önceyi döner', () => {
    const ends = NOW + 5 * 60 * 60 * 1000;

    assert.equal(getReminderTime(ends, NOW)?.getTime(), ends - REMINDER_LEAD_MS);
  });

  test('zaman geçmişteyse veya çok yakınsa null döner', () => {
    assert.equal(getReminderTime(NOW + 60 * 60 * 1000, NOW), null);
    assert.equal(getReminderTime(NOW + REMINDER_LEAD_MS + 30_000, NOW), null);
    assert.equal(getReminderTime(NOW - 1000, NOW), null);
  });
});
