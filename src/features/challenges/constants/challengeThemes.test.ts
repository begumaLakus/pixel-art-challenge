import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { getChallengeThemeStyle, THEME_ACCENTS } from './challengeThemes.ts';

describe('getChallengeThemeStyle', () => {
  test('aynı tema her zaman aynı sprite ve renk döner', () => {
    assert.deepEqual(
      getChallengeThemeStyle('uzay_macerasi'),
      getChallengeThemeStyle('uzay_macerasi'),
    );
  });

  test('bilinen tema kendine özgü sprite alır', () => {
    assert.equal(getChallengeThemeStyle('perili_gece').sprite, 'ghost');
    assert.equal(getChallengeThemeStyle('gece_acikmalari').sprite, 'pizza');
  });

  test('bilinmeyen (AI üretimi) tema da geçerli sprite ve palet rengi alır', () => {
    const style = getChallengeThemeStyle('kayip_robotlar_ormani');

    assert.ok(style.sprite.length > 0);
    assert.ok((THEME_ACCENTS as readonly string[]).includes(style.accent));
  });

  test('her vurgu rengi geçerli bir hex değerdir', () => {
    for (const accent of THEME_ACCENTS) {
      assert.match(accent, /^#[0-9A-Fa-f]{6}$/);
    }
  });
});
