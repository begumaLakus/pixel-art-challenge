import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { CHALLENGE_THEME_ASSETS, getChallengeThemeAsset } from './challengeThemes.ts';

describe('getChallengeThemeAsset', () => {
  test('bilinen bir tema için eşlenen ikon/etiket/renk döner', () => {
    const asset = getChallengeThemeAsset('uzay_macerasi', '#000000');

    assert.deepEqual(asset, CHALLENGE_THEME_ASSETS.uzay_macerasi);
    assert.equal(asset.label, 'UZAY');
  });

  test('bilinmeyen bir tema için fallback ikon + büyük harfli etiket + verilen renk döner', () => {
    const asset = getChallengeThemeAsset('deneme_temasi', '#123456');

    assert.equal(asset.icon, '🎨');
    assert.equal(asset.label, 'DENEME_TEMASI');
    assert.equal(asset.color, '#123456');
  });

  test('her tanımlı tema geçerli bir hex renk içerir', () => {
    for (const [theme, asset] of Object.entries(CHALLENGE_THEME_ASSETS)) {
      assert.match(asset.color, /^#[0-9A-Fa-f]{6}$/, `theme: ${theme}`);
    }
  });
});
