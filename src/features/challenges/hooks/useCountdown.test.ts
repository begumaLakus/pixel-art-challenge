import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { formatTimeLeft } from './useCountdown.ts';

describe('formatTimeLeft', () => {
  test('0 ms -> 00:00:00', () => {
    assert.equal(formatTimeLeft(0), '00:00:00');
  });

  test('saat/dakika/saniyeyi doğru hesaplar ve 2 haneye tamamlar', () => {
    // 1 saat 2 dakika 3 saniye
    const ms = (1 * 3600 + 2 * 60 + 3) * 1000;
    assert.equal(formatTimeLeft(ms), '01:02:03');
  });

  test('23 saat 59 dakika 59 saniye', () => {
    const ms = (23 * 3600 + 59 * 60 + 59) * 1000;
    assert.equal(formatTimeLeft(ms), '23:59:59');
  });

  test('milisaniye kısmı saniyeye yuvarlanır (aşağı, Math.floor)', () => {
    assert.equal(formatTimeLeft(1999), '00:00:01');
  });

  test('24 saatten uzun süre saat kısmı 2 haneyle sınırlı değildir (25 saat)', () => {
    const ms = 25 * 3600 * 1000;
    assert.equal(formatTimeLeft(ms), '25:00:00');
  });
});
