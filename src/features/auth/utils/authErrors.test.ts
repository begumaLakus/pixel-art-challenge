import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { getAuthErrorMessage, validateCredentials } from './authErrors.ts';

describe('getAuthErrorMessage', () => {
  test('bilinen Firebase kodlarını Türkçe mesaja çevirir', () => {
    assert.equal(
      getAuthErrorMessage({ code: 'auth/invalid-credential' }),
      'E-posta veya şifre hatalı.',
    );
    assert.equal(
      getAuthErrorMessage({ code: 'auth/email-already-in-use' }),
      'Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.',
    );
    assert.equal(
      getAuthErrorMessage({ code: 'auth/weak-password' }),
      'Şifre en az 6 karakter olmalı.',
    );
    assert.equal(
      getAuthErrorMessage({ code: 'auth/network-request-failed' }),
      'Bağlantı kurulamadı. İnternetini kontrol et.',
    );
  });

  test('yanlış şifre ve olmayan kullanıcı aynı mesajı verir (hesap varlığı sızmaz)', () => {
    assert.equal(
      getAuthErrorMessage({ code: 'auth/wrong-password' }),
      getAuthErrorMessage({ code: 'auth/user-not-found' }),
    );
  });

  test('bilinmeyen veya kodsuz hatalar genel mesaja düşer, ham metin sızmaz', () => {
    const fallback = 'Bir şeyler ters gitti. Tekrar dene.';

    assert.equal(getAuthErrorMessage({ code: 'auth/garip-bir-kod' }), fallback);
    assert.equal(getAuthErrorMessage(new Error('internal secret detail')), fallback);
    assert.equal(getAuthErrorMessage(null), fallback);
    assert.equal(getAuthErrorMessage('string'), fallback);
  });
});

describe('validateCredentials', () => {
  test('geçerli giriş bilgisinde hata yoktur', () => {
    assert.deepEqual(
      validateCredentials({ email: ' a@b.co ', password: 'x' }),
      {},
    );
  });

  test('boş e-posta ve şifreyi yakalar', () => {
    assert.deepEqual(validateCredentials({ email: '  ', password: '' }), {
      email: 'E-posta adresini gir.',
      password: 'Şifreni gir.',
    });
  });

  test('geçersiz e-posta biçimini yakalar', () => {
    assert.equal(
      validateCredentials({ email: 'abc', password: 'x' }).email,
      'Geçerli bir e-posta adresi gir.',
    );
  });

  test('kayıtta kısa şifreyi yakalar, girişte yakalamaz', () => {
    assert.equal(
      validateCredentials({ email: 'a@b.co', password: '123', confirmPassword: '123' })
        .password,
      'Şifre en az 6 karakter olmalı.',
    );
    assert.equal(
      validateCredentials({ email: 'a@b.co', password: '123' }).password,
      undefined,
    );
  });

  test('kayıtta şifre tekrarı eşleşmiyorsa hata verir', () => {
    assert.deepEqual(
      validateCredentials({
        email: 'a@b.co',
        password: 'sifre123',
        confirmPassword: 'sifre124',
      }),
      { confirmPassword: 'Şifreler eşleşmiyor.' },
    );
  });
});
