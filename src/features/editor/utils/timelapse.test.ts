import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  MAX_ENCODED_LENGTH,
  decodeSteps,
  diffToStep,
  encodeSteps,
  getStepIntervalMs,
  replaySteps,
  type Step,
} from './timelapse.ts';

const BG = '#FDFBF7';

describe('diffToStep', () => {
  test('değişen hücreleri yeni renge göre gruplar', () => {
    const previous = [BG, BG, BG, BG];
    const next = ['#FF0000', BG, '#FF0000', '#00FF00'];

    assert.deepEqual(diffToStep(previous, next), [
      { color: '#FF0000', indices: [0, 2] },
      { color: '#00FF00', indices: [3] },
    ]);
  });

  test('değişiklik yoksa boş adım döner', () => {
    assert.deepEqual(diffToStep([BG, BG], [BG, BG]), []);
  });

  test('silmeyi arkaplan rengiyle boyama olarak kaydeder', () => {
    assert.deepEqual(diffToStep(['#FF0000', BG], [BG, BG]), [
      { color: BG, indices: [0] },
    ]);
  });
});

describe('encodeSteps / decodeSteps', () => {
  const steps: Step[] = [
    [{ color: '#FF0000', indices: [0, 1, 2] }],
    [
      { color: '#00FF00', indices: [5] },
      { color: '#0000FF', indices: [6, 7] },
    ],
  ];

  test('kodlanıp çözüldüğünde aynı adımlar elde edilir', () => {
    const encoded = encodeSteps(steps);

    assert.equal(encoded, 'FF0000:0.1.2/00FF00:5;0000FF:6.7');
    assert.deepEqual(decodeSteps(encoded, 4), steps);
  });

  test('boş adımlar kodlanmaz', () => {
    assert.equal(encodeSteps([[], steps[0], []]), 'FF0000:0.1.2');
  });

  test('bozuk veri hata fırlatmaz, geçersiz parçalar atlanır', () => {
    assert.deepEqual(decodeSteps('', 4), []);
    assert.deepEqual(decodeSteps(null, 4), []);
    assert.deepEqual(decodeSteps('zzzzzz:1.2', 4), []);
    assert.deepEqual(decodeSteps('FF0000:abc', 4), []);
    assert.deepEqual(decodeSteps('FF0000:1.2/%%%/00FF00:3', 4), [
      [{ color: '#FF0000', indices: [1, 2] }],
      [{ color: '#00FF00', indices: [3] }],
    ]);
  });

  test('aralık dışı indeksleri atar', () => {
    assert.deepEqual(decodeSteps('FF0000:0.99.3.-1', 2), [
      [{ color: '#FF0000', indices: [0, 3] }],
    ]);
  });

  test('üst sınırı aşan veriyi yok sayar', () => {
    assert.deepEqual(decodeSteps('A'.repeat(MAX_ENCODED_LENGTH + 1), 16), []);
  });
});

describe('replaySteps', () => {
  const steps: Step[] = [
    [{ color: '#FF0000', indices: [0] }],
    [{ color: '#00FF00', indices: [1] }],
    [{ color: '#0000FF', indices: [0] }],
  ];

  test('0 adımda boş tuval, tüm adımlarda son hâl döner', () => {
    assert.deepEqual(replaySteps(steps, 2, 0, BG), [BG, BG, BG, BG]);
    assert.deepEqual(replaySteps(steps, 2, 3, BG), ['#0000FF', '#00FF00', BG, BG]);
  });

  test('ara adımı doğru gösterir ve sınırları taşırmaz', () => {
    assert.deepEqual(replaySteps(steps, 2, 1, BG), ['#FF0000', BG, BG, BG]);
    assert.deepEqual(replaySteps(steps, 2, 99, BG), ['#0000FF', '#00FF00', BG, BG]);
    assert.deepEqual(replaySteps(steps, 2, -5, BG), [BG, BG, BG, BG]);
  });

  test('kayıttan çıkan oynatma, gerçek tuvalle birebir aynıdır', () => {
    const empty = [BG, BG, BG, BG];
    const afterOne = ['#FF0000', BG, BG, BG];
    const afterTwo = ['#FF0000', '#00FF00', BG, BG];
    const recorded = [diffToStep(empty, afterOne), diffToStep(afterOne, afterTwo)];

    assert.deepEqual(
      replaySteps(decodeSteps(encodeSteps(recorded), 2), 2, 2, BG),
      afterTwo,
    );
  });
});

describe('getStepIntervalMs', () => {
  test('toplam süreyi 4-8 saniye bandında tutacak şekilde ölçeklenir', () => {
    assert.equal(getStepIntervalMs(0), 0);
    assert.equal(getStepIntervalMs(10), 600);
    assert.equal(getStepIntervalMs(60), 100);
    assert.equal(getStepIntervalMs(1000), 40);
  });
});
