import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { getSubmissionErrorMessage } from './submissionErrors.ts';

describe('getSubmissionErrorMessage', () => {
  test('sunucu kuralı reddi (permission-denied) anlamlı mesaja çevrilir', () => {
    assert.equal(
      getSubmissionErrorMessage({ code: 'permission-denied' }),
      'Bu challenge artık çizim kabul etmiyor ya da zaten katıldın.',
    );
    assert.equal(
      getSubmissionErrorMessage({ code: 'firestore/permission-denied' }),
      'Bu challenge artık çizim kabul etmiyor ya da zaten katıldın.',
    );
  });

  test('mükerrer gönderi servis hatası okunur mesaja çevrilir', () => {
    assert.equal(
      getSubmissionErrorMessage(
        new Error('Bu challenge için zaten bir çizim gönderdiniz.'),
      ),
      'Bu challenge için zaten bir çizim gönderdin.',
    );
  });

  test('bağlantı hatası ayrı mesaj alır', () => {
    assert.match(getSubmissionErrorMessage({ code: 'unavailable' }), /Bağlantı/);
  });

  test('bilinmeyen hata genel mesaja düşer ve ham metni sızdırmaz', () => {
    const message = getSubmissionErrorMessage(new Error('Internal: stack trace'));

    assert.equal(message, 'Çizim gönderilemedi. Birazdan tekrar dene.');
    assert.ok(!message.includes('Internal'));
  });
});
