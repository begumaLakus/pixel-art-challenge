import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { formatTurkishDate } from './formatDate.ts';

describe('formatTurkishDate', () => {
  test('tarihi Türkçe ay adıyla biçimlendirir', () => {
    assert.equal(
      formatTurkishDate({ toDate: () => new Date(2026, 2, 12) }),
      '12 Mart 2026',
    );
    assert.equal(
      formatTurkishDate({ toDate: () => new Date(2025, 11, 1) }),
      '1 Aralık 2025',
    );
  });

  test('eksik, boş veya geçersiz tarihte null döner', () => {
    assert.equal(formatTurkishDate(null), null);
    assert.equal(formatTurkishDate(undefined), null);
    assert.equal(formatTurkishDate({}), null);
    assert.equal(formatTurkishDate({ toDate: () => new Date('nope') }), null);
  });
});
