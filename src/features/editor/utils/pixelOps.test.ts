import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { floodFill, withMirror } from './pixelOps.ts';

describe('withMirror', () => {
  test('kapalıyken indeksleri olduğu gibi döner (tekrarsız)', () => {
    assert.deepEqual(withMirror([1, 1, 5], 4, false), [1, 5]);
  });

  test('açıkken her indeksin yatay ayna karşılığını ekler', () => {
    // 4x4: satır 0, sütun 0 -> indeks 0, karşılığı sütun 3 -> indeks 3
    assert.deepEqual(withMirror([0], 4, true).sort(), [0, 3]);
    // satır 1, sütun 1 -> indeks 5, karşılığı sütun 2 -> indeks 6
    assert.deepEqual(withMirror([5], 4, true).sort(), [5, 6]);
  });

  test('merkez eksendeki hücre (tek boyutta) kendisinin karşılığıdır', () => {
    assert.deepEqual(withMirror([1], 3, true).sort(), [1]);
  });

  test('aralık dışı indeksleri atar', () => {
    assert.deepEqual(withMirror([-1, 99, 2], 4, true).sort(), [1, 2]);
  });
});

describe('floodFill', () => {
  const W = 'w';
  const B = 'b';
  const R = 'r';

  test('bağlantılı aynı renkli alanı doldurur', () => {
    // 3x3:   w w b
    //        w b b
    //        b b w
    const pixels = [W, W, B, W, B, B, B, B, W];
    const { next, changed } = floodFill(pixels, 3, 0, R);

    assert.equal(changed, true);
    assert.deepEqual(next, [R, R, B, R, B, B, B, B, W]);
  });

  test('farklı renkteki bağlantısız aynı renk alanlarına dokunmaz', () => {
    const pixels = [W, B, W, B, B, B, W, B, W];
    const { next } = floodFill(pixels, 3, 0, R);

    assert.deepEqual(next, [R, B, W, B, B, B, W, B, W]);
  });

  test('girdi dizisini mutate etmez', () => {
    const pixels = [W, W, W, W];
    floodFill(pixels, 2, 0, R);

    assert.deepEqual(pixels, [W, W, W, W]);
  });

  test('zaten o renkteyse ya da aralık dışıysa değişiklik yok ve aynı referans', () => {
    const pixels = [W, W, W, W];

    const same = floodFill(pixels, 2, 0, W);
    assert.equal(same.changed, false);
    assert.equal(same.next, pixels);

    const outside = floodFill(pixels, 2, 9, R);
    assert.equal(outside.changed, false);
    assert.equal(outside.next, pixels);
  });

  test('satır sınırını aşıp bir sonraki satırın başına sızmaz', () => {
    // 2x2: sol-üst w, sağ-üst b, sol-alt b, sağ-alt w -> köşegen bağlı değil
    const pixels = [W, B, B, W];
    const { next } = floodFill(pixels, 2, 0, R);

    assert.deepEqual(next, [R, B, B, W]);
  });

  test('boş tuvali tamamen doldurur', () => {
    const pixels = Array.from({ length: 16 }, () => W);
    const { next } = floodFill(pixels, 4, 5, R);

    assert.ok(next.every((color) => color === R));
  });
});
