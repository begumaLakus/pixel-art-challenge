import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  MAX_BATCH_SIZE,
  buildMessages,
  chunk,
  findInvalidTokens,
  isExpoPushToken,
  sendPushMessages,
  type PushMessage,
} from './push.ts';

const TOKEN_A = 'ExponentPushToken[aaaa]';
const TOKEN_B = 'ExpoPushToken[bbbb]';

describe('isExpoPushToken / buildMessages', () => {
  test('yalnızca Expo token biçimini kabul eder', () => {
    assert.equal(isExpoPushToken(TOKEN_A), true);
    assert.equal(isExpoPushToken(TOKEN_B), true);
    assert.equal(isExpoPushToken('fcm-token-123'), false);
    assert.equal(isExpoPushToken(42), false);
    assert.equal(isExpoPushToken(null), false);
  });

  test('geçersiz ve tekrarlı token\'ları eler, içeriği her mesaja koyar', () => {
    const messages = buildMessages([TOKEN_A, 'x', TOKEN_A, TOKEN_B, undefined], {
      title: 'Yeni tema',
      body: 'Bugünün teması hazır',
      data: { screen: 'arena' },
    });

    assert.deepEqual(messages, [
      { to: TOKEN_A, title: 'Yeni tema', body: 'Bugünün teması hazır', sound: 'default', data: { screen: 'arena' } },
      { to: TOKEN_B, title: 'Yeni tema', body: 'Bugünün teması hazır', sound: 'default', data: { screen: 'arena' } },
    ]);
  });
});

describe('chunk', () => {
  test('listeyi verilen boyutta parçalara böler', () => {
    assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
    assert.deepEqual(chunk([], 3), []);
  });
});

describe('findInvalidTokens', () => {
  const messages: PushMessage[] = [TOKEN_A, TOKEN_B].map((to) => ({
    to,
    title: 't',
    body: 'b',
    sound: 'default',
  }));

  test('DeviceNotRegistered hatalı token\'ları sıraya göre eşleştirir', () => {
    assert.deepEqual(
      findInvalidTokens(messages, [
        { status: 'ok' },
        { status: 'error', details: { error: 'DeviceNotRegistered' } },
      ]),
      [TOKEN_B],
    );
  });

  test('başka hatalar veya bozuk yanıt token silmeye yol açmaz', () => {
    assert.deepEqual(
      findInvalidTokens(messages, [{ status: 'error', details: { error: 'MessageRateExceeded' } }]),
      [],
    );
    assert.deepEqual(findInvalidTokens(messages, 'bozuk'), []);
    assert.deepEqual(findInvalidTokens(messages, undefined), []);
  });
});

describe('sendPushMessages', () => {
  const makeMessages = (count: number): PushMessage[] =>
    Array.from({ length: count }, (_, index) => ({
      to: `ExponentPushToken[${index}]`,
      title: 't',
      body: 'b',
      sound: 'default' as const,
    }));

  test('mesajları 100\'lük gruplar hâlinde gönderir', async () => {
    const batches: number[] = [];
    const fetchImpl = (async (_url: string, init: { body: string }) => {
      batches.push((JSON.parse(init.body) as unknown[]).length);
      return { ok: true, json: async () => ({ data: [] }) };
    }) as unknown as typeof fetch;

    await sendPushMessages(makeMessages(MAX_BATCH_SIZE * 2 + 5), fetchImpl);

    assert.deepEqual(batches, [100, 100, 5]);
  });

  test('kayıtsız token\'ları geri döner', async () => {
    const messages = makeMessages(2);
    const fetchImpl = (async () => ({
      ok: true,
      json: async () => ({
        data: [{ status: 'error', details: { error: 'DeviceNotRegistered' } }, { status: 'ok' }],
      }),
    })) as unknown as typeof fetch;

    assert.deepEqual(await sendPushMessages(messages, fetchImpl), [messages[0].to]);
  });

  test('bir grup başarısız olsa da diğerleri gönderilir ve hata fırlatılmaz', async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;

      if (calls === 1) {
        throw new Error('ağ hatası');
      }

      return { ok: false, status: 500, json: async () => ({}) };
    }) as unknown as typeof fetch;

    await assert.doesNotReject(() => sendPushMessages(makeMessages(150), fetchImpl));
    assert.equal(calls, 2);
  });
});
