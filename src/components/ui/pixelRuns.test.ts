import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { buildRuns, toRows } from './pixelRuns.ts';

describe('buildRuns', () => {
  test('ardışık aynı renkleri tek parçada birleştirir', () => {
    assert.deepEqual(buildRuns(['#a', '#a', '#b', '#a', '#a', '#a']), [
      { color: '#a', start: 0, length: 2 },
      { color: '#b', start: 2, length: 1 },
      { color: '#a', start: 3, length: 3 },
    ]);
  });

  test('boş satır boş liste döner', () => {
    assert.deepEqual(buildRuns([]), []);
  });

  test('parçaların uzunlukları toplamı satır uzunluğuna eşittir', () => {
    const row = ['#1', '#1', '#2', '#3', '#3', '#3', '#1'];
    const total = buildRuns(row).reduce((sum, run) => sum + run.length, 0);

    assert.equal(total, row.length);
  });
});

describe('toRows', () => {
  test('düz diziyi resolution genişlikli satırlara böler', () => {
    assert.deepEqual(toRows(['a', 'b', 'c', 'd'], 2, 'x'), [
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  test('eksik hücreleri fallback ile doldurur, fazlayı atar', () => {
    assert.deepEqual(toRows(['a', 'b', 'c'], 2, 'x'), [
      ['a', 'b'],
      ['c', 'x'],
    ]);
    assert.deepEqual(toRows(['a', 'b', 'c', 'd', 'e'], 2, 'x'), [
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });
});
