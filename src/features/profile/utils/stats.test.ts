import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  BADGES,
  EMPTY_STATS,
  MAX_CONSECUTIVE_GAP_MS,
  getActiveStreak,
  readStats,
} from './stats.ts';

const DAY = 24 * 60 * 60 * 1000;
const T0 = Date.parse('2026-03-01T00:00:00Z');

describe('readStats', () => {
  test('eksik veya bozuk veriden güvenli varsayılan üretir', () => {
    assert.deepEqual(readStats(undefined), EMPTY_STATS);
    assert.deepEqual(readStats({ streak: 'x', badges: [3, 'champion'] }), {
      ...EMPTY_STATS,
      badges: ['champion'],
    });
  });
});

describe('getActiveStreak', () => {
  const stats = { ...EMPTY_STATS, streak: 4, lastChallengeStartsAtMs: T0 };

  test('son katılım şu anki challenge ise seriyi gösterir', () => {
    assert.equal(getActiveStreak(stats, T0), 4);
  });

  test('son katılım bir önceki challenge ise (bugün henüz katılmadıysan) seri canlıdır', () => {
    assert.equal(getActiveStreak(stats, T0 + DAY), 4);
  });

  test('bir challenge atlandıysa seri 0 görünür', () => {
    assert.equal(getActiveStreak(stats, T0 + 2 * DAY), 0);
    assert.equal(getActiveStreak(stats, T0 + MAX_CONSECUTIVE_GAP_MS + 1), 0);
  });

  test('hiç katılım yoksa 0, aktif challenge bilinmiyorsa kayıtlı seri', () => {
    assert.equal(getActiveStreak(EMPTY_STATS, T0), 0);
    assert.equal(getActiveStreak(stats, null), 4);
  });
});

describe('BADGES', () => {
  test('rozet kimlikleri benzersizdir', () => {
    assert.equal(new Set(BADGES.map((badge) => badge.id)).size, BADGES.length);
  });
});
