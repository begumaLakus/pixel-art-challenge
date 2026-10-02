import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  EMPTY_STATS,
  MAX_CONSECUTIVE_GAP_MS,
  POPULAR_VOTE_THRESHOLD,
  applyParticipation,
  applyPopularity,
  applyWin,
  readStats,
} from './stats.ts';

const DAY = 24 * 60 * 60 * 1000;
const T0 = Date.parse('2026-03-01T00:00:00Z');

describe('applyParticipation', () => {
  test('ilk katılım seriyi 1 yapar ve "ilk çizim" rozetini verir', () => {
    const next = applyParticipation(EMPTY_STATS, T0);

    assert.equal(next.streak, 1);
    assert.equal(next.bestStreak, 1);
    assert.equal(next.entries, 1);
    assert.equal(next.lastChallengeStartsAtMs, T0);
    assert.deepEqual(next.badges, ['first_entry']);
  });

  test('ardışık challenge serisi bir artırır', () => {
    let stats = applyParticipation(EMPTY_STATS, T0);
    stats = applyParticipation(stats, T0 + DAY);
    stats = applyParticipation(stats, T0 + 2 * DAY);

    assert.equal(stats.streak, 3);
    assert.equal(stats.entries, 3);
    assert.ok(stats.badges.includes('streak_3'));
  });

  test('bir challenge atlanırsa seri 1\'e döner, en iyi seri korunur', () => {
    let stats = applyParticipation(EMPTY_STATS, T0);
    stats = applyParticipation(stats, T0 + DAY);
    stats = applyParticipation(stats, T0 + 2 * DAY);
    stats = applyParticipation(stats, T0 + 4 * DAY);

    assert.equal(stats.streak, 1);
    assert.equal(stats.bestStreak, 3);
    assert.equal(stats.entries, 4);
  });

  test('7 ardışık katılım "7 gün seri" rozetini verir', () => {
    let stats = EMPTY_STATS;

    for (let day = 0; day < 7; day += 1) {
      stats = applyParticipation(stats, T0 + day * DAY);
    }

    assert.equal(stats.streak, 7);
    assert.ok(stats.badges.includes('streak_3'));
    assert.ok(stats.badges.includes('streak_7'));
  });

  test('challenge saatleri biraz kaysa da (30 saate kadar) seri sürer', () => {
    let stats = applyParticipation(EMPTY_STATS, T0);
    stats = applyParticipation(stats, T0 + MAX_CONSECUTIVE_GAP_MS);

    assert.equal(stats.streak, 2);

    stats = applyParticipation(stats, T0 + MAX_CONSECUTIVE_GAP_MS + MAX_CONSECUTIVE_GAP_MS + 1);
    assert.equal(stats.streak, 1);
  });

  test('aynı veya daha eski challenge tekrar işlenirse hiçbir şey değişmez (idempotent)', () => {
    const once = applyParticipation(EMPTY_STATS, T0);

    assert.equal(applyParticipation(once, T0), once);
    assert.equal(applyParticipation(once, T0 - DAY), once);
  });

  test('girdi istatistiği mutate edilmez', () => {
    const before = { ...EMPTY_STATS, badges: [] as string[] };
    applyParticipation(before, T0);

    assert.deepEqual(before, EMPTY_STATS);
  });
});

describe('applyWin / applyPopularity', () => {
  test('kazanmak zafer sayısını artırır ve "şampiyon" rozetini verir', () => {
    const next = applyWin(EMPTY_STATS);

    assert.equal(next.wins, 1);
    assert.deepEqual(next.badges, ['champion']);
  });

  test('rozetler tekrarlanmaz', () => {
    const twice = applyWin(applyWin(EMPTY_STATS));

    assert.equal(twice.wins, 2);
    assert.deepEqual(twice.badges, ['champion']);
  });

  test('popüler rozeti yalnızca eşikte verilir', () => {
    assert.deepEqual(applyPopularity(EMPTY_STATS, POPULAR_VOTE_THRESHOLD - 1).badges, []);
    assert.deepEqual(applyPopularity(EMPTY_STATS, POPULAR_VOTE_THRESHOLD).badges, ['popular']);
  });
});

describe('readStats', () => {
  test('eksik veya bozuk veriden güvenli varsayılan üretir', () => {
    assert.deepEqual(readStats(undefined), EMPTY_STATS);
    assert.deepEqual(readStats(null), EMPTY_STATS);
    assert.deepEqual(readStats('metin'), EMPTY_STATS);
    assert.deepEqual(
      readStats({ streak: -3, entries: 'x', wins: NaN, badges: [1, 'champion'] }),
      { ...EMPTY_STATS, badges: ['champion'] },
    );
  });

  test('geçerli veriyi aynen okur', () => {
    const raw = {
      streak: 2,
      bestStreak: 5,
      entries: 9,
      wins: 1,
      lastChallengeStartsAtMs: T0,
      badges: ['first_entry'],
    };

    assert.deepEqual(readStats(raw), raw);
  });
});
