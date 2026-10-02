import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  CANVAS_BACKGROUND,
  MAX_COMMENT_LENGTH,
  buildJuryPrompt,
  describePixels,
  normalizeJuryComment,
} from './jury.ts';

const BG = CANVAS_BACKGROUND;

describe('describePixels', () => {
  test('zemini "." renkleri harflerle gösterir; en sık renk "A" olur', () => {
    const pixels = ['#FF0000', '#FF0000', BG, '#00FF00'];
    const result = describePixels(pixels, 2);

    assert.equal(result.grid, 'AA\n.B');
    assert.equal(result.legend, 'A=#FF0000, B=#00FF00');
    assert.equal(result.filled, 3);
  });

  test('tamamen boş tuvalde dolu hücre sayısı 0 olur', () => {
    const result = describePixels([BG, BG, BG, BG], 2);

    assert.equal(result.filled, 0);
    assert.equal(result.grid, '..\n..');
    assert.equal(result.legend, '');
  });

  test('eksik piksel verisi çökertmez, eksikler zemin sayılır', () => {
    assert.equal(describePixels(['#FF0000'], 2).grid, 'A.\n..');
  });

  test('26dan fazla renk varsa fazlalar "#" ile gösterilir', () => {
    const pixels = Array.from({ length: 30 }, (_, index) =>
      `#${(index + 1).toString(16).padStart(6, '0')}`,
    );
    const { grid } = describePixels(pixels, 6);

    assert.ok(grid.includes('#'));
  });
});

describe('buildJuryPrompt', () => {
  test('tema, renkler ve ızgarayı içerir', () => {
    const description = describePixels(['#FF0000', BG, BG, BG], 2);
    const prompt = buildJuryPrompt({
      themeTitle: 'Sevimli Canavarlar',
      themeDescription: 'Korkutma, güldür!',
      resolution: 2,
      description,
    });

    assert.ok(prompt.includes('Sevimli Canavarlar'));
    assert.ok(prompt.includes('A=#FF0000'));
    assert.ok(prompt.includes('A.\n..'));
    assert.ok(prompt.includes(String(MAX_COMMENT_LENGTH)));
  });
});

describe('normalizeJuryComment', () => {
  test('geçerli yorumu temizleyip döner', () => {
    assert.equal(
      normalizeJuryComment({ comment: '  Tatlı bir kalp!\n Kenarları ince.  ' }),
      'Tatlı bir kalp! Kenarları ince.',
    );
  });

  test('boş, çok uzun veya yanlış şekilli yanıtı reddeder', () => {
    assert.equal(normalizeJuryComment({ comment: '   ' }), null);
    assert.equal(normalizeJuryComment({ comment: 'a'.repeat(MAX_COMMENT_LENGTH + 1) }), null);
    assert.equal(normalizeJuryComment({ comment: 42 }), null);
    assert.equal(normalizeJuryComment(null), null);
    assert.equal(normalizeJuryComment('yorum'), null);
  });
});
