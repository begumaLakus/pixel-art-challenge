import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { DEFAULT_PALETTE, resolvePalette } from './palette.ts';

describe('DEFAULT_PALETTE', () => {
  test('16 benzersiz geçerli hex renk içerir', () => {
    assert.equal(DEFAULT_PALETTE.length, 16);
    assert.equal(new Set(DEFAULT_PALETTE).size, 16);

    for (const color of DEFAULT_PALETTE) {
      assert.match(color, /^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe('resolvePalette', () => {
  test('geçerli bir challenge paletini olduğu gibi kullanır', () => {
    assert.deepEqual(resolvePalette(['#FF0000', '#00FF00', '#0000FF']), [
      '#FF0000',
      '#00FF00',
      '#0000FF',
    ]);
  });

  test('palet yoksa varsayılana döner', () => {
    assert.equal(resolvePalette(undefined), DEFAULT_PALETTE);
    assert.equal(resolvePalette(null), DEFAULT_PALETTE);
  });

  test('geçersiz renkleri ayıklar; geriye 2 renkten azı kalırsa varsayılana döner', () => {
    assert.deepEqual(resolvePalette(['#FF0000', 'kirmizi', '#00FF00']), [
      '#FF0000',
      '#00FF00',
    ]);
    assert.equal(resolvePalette(['#FF0000', 'bozuk']), DEFAULT_PALETTE);
    assert.equal(resolvePalette([]), DEFAULT_PALETTE);
  });
});
