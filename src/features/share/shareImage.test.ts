import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

const loadBuilder = async (t: any) => {
  t.mock.module('expo-sharing', { namedExports: {} });
  t.mock.module('react-native', { namedExports: { Platform: { OS: 'ios' } } });

  return (await import(`./shareImage.ts?case=${Date.now()}-${Math.random()}`))
    .buildShareFileName as (title: string) => string;
};

describe('buildShareFileName', () => {
  test('Türkçe karakterleri sadeleştirip güvenli bir dosya adı üretir', async (t) => {
    const buildShareFileName = await loadBuilder(t);

    assert.equal(buildShareFileName('Çılgın Canavarlar'), 'pixel-art-cilgin-canavarlar.png');
    assert.equal(buildShareFileName('Şeker & Gülücük!'), 'pixel-art-seker-gulucuk.png');
  });

  test('boş veya sadece sembol içeren başlıkta varsayılan ad kullanılır', async (t) => {
    const buildShareFileName = await loadBuilder(t);

    assert.equal(buildShareFileName(''), 'pixel-art-cizim.png');
    assert.equal(buildShareFileName('!!!'), 'pixel-art-cizim.png');
  });
});
