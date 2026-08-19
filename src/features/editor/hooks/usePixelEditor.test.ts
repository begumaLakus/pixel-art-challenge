import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  appendHistorySnapshot,
  applyPaint,
  createEmptyGrid,
} from './usePixelEditor.ts';

const BACKGROUND_COLOR = '#FDFBF7';

describe('createEmptyGrid', () => {
  test('16x16 için 256 elemanlı, tamamı arkaplan renginde bir dizi üretir', () => {
    const grid = createEmptyGrid(16);
    assert.equal(grid.length, 256);
    assert.ok(grid.every((color) => color === BACKGROUND_COLOR));
  });

  test('32x32 için 1024 elemanlı bir dizi üretir', () => {
    assert.equal(createEmptyGrid(32).length, 1024);
  });
});

describe('applyPaint', () => {
  test('verilen indekslere rengi uygular ve yeni bir dizi döndürür', () => {
    const pixels = createEmptyGrid(16);
    const { next, changed } = applyPaint(pixels, [0, 1, 2], '#FF0000');

    assert.equal(changed, true);
    assert.notEqual(next, pixels, 'orijinal dizi mutate edilmemeli');
    assert.equal(next[0], '#FF0000');
    assert.equal(next[1], '#FF0000');
    assert.equal(next[2], '#FF0000');
    assert.equal(next[3], BACKGROUND_COLOR);
    // Kaynak dizi değişmemiş olmalı (immutability)
    assert.equal(pixels[0], BACKGROUND_COLOR);
  });

  test('zaten o renkteki pikselleri tekrar boyamak "changed: false" ve aynı referansı döndürür', () => {
    const pixels = createEmptyGrid(16);
    const { next, changed } = applyPaint(pixels, [5, 6], BACKGROUND_COLOR);

    assert.equal(changed, false);
    assert.equal(next, pixels, 'değişiklik yoksa aynı referans korunmalı');
  });

  test('aralık dışı indeksleri sessizce yok sayar', () => {
    const pixels = createEmptyGrid(16);
    const { next, changed } = applyPaint(pixels, [-1, 256, 1000], '#00FF00');

    assert.equal(changed, false);
    assert.equal(next, pixels);
  });

  test('kısmen geçerli kısmen geçersiz indekslerde sadece geçerli olanlar boyanır', () => {
    const pixels = createEmptyGrid(16);
    const { next, changed } = applyPaint(pixels, [-1, 10, 300], '#0000FF');

    assert.equal(changed, true);
    assert.equal(next[10], '#0000FF');
  });

  test('boş indeks listesi hiçbir şeyi değiştirmez', () => {
    const pixels = createEmptyGrid(16);
    const { next, changed } = applyPaint(pixels, [], '#FF0000');

    assert.equal(changed, false);
    assert.equal(next, pixels);
  });
});

describe('appendHistorySnapshot', () => {
  test('geçmişe yeni bir snapshot ekler', () => {
    const history = appendHistorySnapshot([], createEmptyGrid(16), 20);
    assert.equal(history.length, 1);
  });

  test('MAX_HISTORY_DEPTH aşılınca en eski snapshot düşürülür (FIFO)', () => {
    let history: string[][] = [];

    // Her snapshot'ı ayırt edebilmek için farklı bir "imza" pikseli koyuyoruz.
    for (let i = 0; i < 25; i += 1) {
      const snapshot = createEmptyGrid(16);
      snapshot[0] = `signature-${i}`;
      history = appendHistorySnapshot(history, snapshot, 20);
    }

    assert.equal(history.length, 20, 'derinlik sınırını aşmamalı');
    // İlk 5 snapshot (0..4) düşürülmüş olmalı, en eski kalan 5 (index 5) olmalı.
    assert.equal(history[0][0], 'signature-5');
    assert.equal(history[history.length - 1][0], 'signature-24');
  });

  test('maxDepth sınırının tam üzerindeyken bile sadece bir kayıt düşer', () => {
    let history: string[][] = [];
    for (let i = 0; i < 3; i += 1) {
      history = appendHistorySnapshot(history, createEmptyGrid(16), 2);
    }
    assert.equal(history.length, 2);
  });
});
