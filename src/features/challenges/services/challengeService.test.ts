/*



import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

const mockDb = (t: any): void => {
  t.mock.module('@/src/services/firebase/firestore', {
    namedExports: { db: { __fakeDb: true } },
  });
};

const baseMocks = (overrides: Record<string, unknown> = {}) => ({
  collection: () => ({ __collection: true }),
  getDocs: async () => ({ empty: true, docs: [] }),
  limit: () => ({}),
  onSnapshot: () => () => {},
  query: () => ({ __query: true }),
  Timestamp: { now: () => ({ __now: true }) },
  where: () => ({}),
  ...overrides,
});

const makeChallengeDoc = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  data: () => ({
    title: 'Uzay Macerası',
    description: 'açıklama',
    theme: 'uzay_macerasi',
    gridSize: 16,
    startsAt: { __ts: 'starts' },
    endsAt: { __ts: 'ends' },
    status: 'active',
    createdAt: { __ts: 'created' },
    ...overrides,
  }),
});

describe('challengeService.getActiveChallenge', () => {
  test('aktif challenge yoksa null döner', async (t) => {
    mockDb(t);
    t.mock.module('firebase/firestore', {
      namedExports: baseMocks({ getDocs: async () => ({ empty: true, docs: [] }) }),
    });

    const { getActiveChallenge } = await import(
      `./challengeService.ts?case=none-${Date.now()}`
    );

    assert.equal(await getActiveChallenge(), null);
  });

  test('aktif challenge varsa alanları doğru eşler, eksik alanlar için varsayılan null kullanır', async (t) => {
    mockDb(t);
    t.mock.module('firebase/firestore', {
      namedExports: baseMocks({
        getDocs: async () => ({
          empty: false,
          docs: [makeChallengeDoc('c1')], // winnerSubmissionId ve completedAt data() içinde yok
        }),
      }),
    });

    const { getActiveChallenge } = await import(
      `./challengeService.ts?case=mapped-${Date.now()}`
    );

    const challenge = await getActiveChallenge();

    assert.equal(challenge.id, 'c1');
    assert.equal(challenge.title, 'Uzay Macerası');
    assert.equal(challenge.winnerSubmissionId, null);
    assert.equal(challenge.completedAt, null);
  });
});

describe('challengeService.subscribeToActiveChallenge', () => {
  test("onSnapshot değişikliklerini onChange'e, hataları onError'a iletir", async (t) => {
    mockDb(t);

    let capturedSuccess: ((snapshot: unknown) => void) | null = null;
    let capturedError: ((error: unknown) => void) | null = null;
    const unsubscribeFn = () => {};

    t.mock.module('firebase/firestore', {
      namedExports: baseMocks({
        onSnapshot: (
          _query: unknown,
          onNext: (snapshot: unknown) => void,
          onError: (error: unknown) => void,
        ) => {
          capturedSuccess = onNext;
          capturedError = onError;
          return unsubscribeFn;
        },
      }),
    });

    const { subscribeToActiveChallenge } = await import(
      `./challengeService.ts?case=subscribe-${Date.now()}`
    );

    const onChangeCalls: unknown[] = [];
    const onErrorCalls: unknown[] = [];

    const unsubscribe = subscribeToActiveChallenge(
      (challenge: unknown) => onChangeCalls.push(challenge),
      (error: unknown) => onErrorCalls.push(error),
    );

    assert.equal(unsubscribe, unsubscribeFn);
    assert.ok(capturedSuccess);
    assert.ok(capturedError);

    capturedSuccess!({ empty: true, docs: [] });
    assert.equal(onChangeCalls.length, 1);
    assert.equal(onChangeCalls[0], null);

    capturedSuccess!({ empty: false, docs: [makeChallengeDoc('c2')] });
    assert.equal(onChangeCalls.length, 2);
    assert.equal((onChangeCalls[1] as { id: string }).id, 'c2');

    capturedError!(new Error('boom'));
    assert.equal(onErrorCalls.length, 1);
  });
});


*/