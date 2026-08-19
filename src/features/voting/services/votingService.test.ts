import { test, describe, mock } from 'node:test';
import assert from 'node:assert/strict';

/**
 * votingService, doğrudan `firebase/firestore` ve komşu `authServices`
 * modülünü import ediyor. Gerçek Firebase'e bağlanmadan test edebilmek
 * için node:test'in `mock.module` API'siyle her iki modülü de test
 * başına yeniden mock'luyoruz (davranış test senaryosuna göre değişiyor).
 */

interface FakeUser {
  uid: string;
}

const mockAuth = (t: any, user: FakeUser | null): void => {
  // votingService kendi `db`'sini `../../../services/firebase/firestore`
  // üzerinden alıyor; o modül gerçek Firebase App'i başlattığından
  // testte tamamen mock'lanıyor (sadece db referansı önemli, değeri
  // testler için önemsiz).
  t.mock.module('../../../services/firebase/firestore', {
    namedExports: { db: { __fakeDb: true } },
  });

  t.mock.module('../../auth/services/authServices', {
    namedExports: { auth: { currentUser: user } },
  });
};

describe('votingService.hasUserVoted', () => {
  test('oturum yoksa hata fırlatır', async (t) => {
    mockAuth(t, null);
    t.mock.module('firebase/firestore', {
      namedExports: {
        doc: () => ({}),
        getDoc: async () => ({ exists: () => false }),
        increment: (n: number) => ({ __increment: n }),
        runTransaction: async () => {},
        serverTimestamp: () => ({}),
      },
    });

    const { hasUserVoted } = await import(
      `./votingService.ts?case=no-user-${Date.now()}`
    );

    await assert.rejects(
      () => hasUserVoted('sub1'),
      /Kullanıcı oturumu bulunamadı\./,
    );
  });

  test('oy kaydı yoksa false döner ve doğru voteId ile doc çağrılır', async (t) => {
    mockAuth(t, { uid: 'user1' });

    const docCalls: unknown[] = [];
    t.mock.module('firebase/firestore', {
      namedExports: {
        doc: (...args: unknown[]) => {
          docCalls.push(args);
          return { __ref: args.join('/') };
        },
        getDoc: async () => ({ exists: () => false }),
        increment: (n: number) => ({ __increment: n }),
        runTransaction: async () => {},
        serverTimestamp: () => ({}),
      },
    });

    const { hasUserVoted } = await import(
      `./votingService.ts?case=not-voted-${Date.now()}`
    );

    const result = await hasUserVoted('sub1');

    assert.equal(result, false);
    // voteId = `${submissionId}_${user.uid}` şeklinde kurulmalı.
    assert.equal(docCalls[0]?.[docCalls[0].length - 1], 'sub1_user1');
  });

  test('oy kaydı varsa true döner', async (t) => {
    mockAuth(t, { uid: 'user1' });
    t.mock.module('firebase/firestore', {
      namedExports: {
        doc: () => ({}),
        getDoc: async () => ({ exists: () => true }),
        increment: (n: number) => ({ __increment: n }),
        runTransaction: async () => {},
        serverTimestamp: () => ({}),
      },
    });

    const { hasUserVoted } = await import(
      `./votingService.ts?case=voted-${Date.now()}`
    );

    assert.equal(await hasUserVoted('sub1'), true);
  });
});

describe('votingService.voteForSubmission', () => {
  test('oturum yoksa transaction hiç başlamadan hata fırlatır', async (t) => {
    mockAuth(t, null);

    const runTransactionFn = mock.fn(async () => {});
    t.mock.module('firebase/firestore', {
      namedExports: {
        doc: () => ({}),
        getDoc: async () => ({ exists: () => false }),
        increment: (n: number) => ({ __increment: n }),
        runTransaction: runTransactionFn,
        serverTimestamp: () => ({}),
      },
    });

    const { voteForSubmission } = await import(
      `./votingService.ts?case=vote-no-user-${Date.now()}`
    );

    await assert.rejects(
      () => voteForSubmission('sub1'),
      /Kullanıcı oturumu bulunamadı\./,
    );
    assert.equal(runTransactionFn.mock.calls.length, 0);
  });

  test('gönderi bulunamazsa hata fırlatır', async (t) => {
    mockAuth(t, { uid: 'user1' });
    t.mock.module('firebase/firestore', {
      namedExports: {
        doc: (...args: unknown[]) => ({ __ref: args.join('/') }),
        getDoc: async () => ({ exists: () => false }),
        increment: (n: number) => ({ __increment: n }),
        runTransaction: async (
          _db: unknown,
          updateFn: (t: unknown) => unknown,
        ) =>
          updateFn({
            get: async (ref: { __ref: string }) => {
              if (ref.__ref.includes('submissions')) {
                return { exists: () => false };
              }
              return { exists: () => false };
            },
          }),
        serverTimestamp: () => ({}),
      },
    });

    const { voteForSubmission } = await import(
      `./votingService.ts?case=no-submission-${Date.now()}`
    );

    await assert.rejects(
      () => voteForSubmission('sub1'),
      /Gönderi bulunamadı\./,
    );
  });

  test('kendi çizimine oy vermeye çalışırsa hata fırlatır', async (t) => {
    mockAuth(t, { uid: 'user1' });
    t.mock.module('firebase/firestore', {
      namedExports: {
        doc: (...args: unknown[]) => ({ __ref: args.join('/') }),
        getDoc: async () => ({ exists: () => false }),
        increment: (n: number) => ({ __increment: n }),
        runTransaction: async (
          _db: unknown,
          updateFn: (t: unknown) => unknown,
        ) =>
          updateFn({
            get: async (ref: { __ref: string }) => {
              if (ref.__ref.includes('submissions')) {
                return { exists: () => true, data: () => ({ userId: 'user1' }) };
              }
              return { exists: () => false };
            },
          }),
        serverTimestamp: () => ({}),
      },
    });

    const { voteForSubmission } = await import(
      `./votingService.ts?case=self-vote-${Date.now()}`
    );

    await assert.rejects(
      () => voteForSubmission('sub1'),
      /Kendi çiziminize oy veremezsiniz\./,
    );
  });

  test('aynı çalışmaya ikinci kez oy verilirse hata fırlatır', async (t) => {
    mockAuth(t, { uid: 'user1' });
    t.mock.module('firebase/firestore', {
      namedExports: {
        doc: (...args: unknown[]) => ({ __ref: args.join('/') }),
        getDoc: async () => ({ exists: () => false }),
        increment: (n: number) => ({ __increment: n }),
        runTransaction: async (
          _db: unknown,
          updateFn: (t: unknown) => unknown,
        ) =>
          updateFn({
            get: async (ref: { __ref: string }) => {
              if (ref.__ref.includes('submissions')) {
                return {
                  exists: () => true,
                  data: () => ({ userId: 'otherUser' }),
                };
              }
              // votes/... -> zaten oy var
              return { exists: () => true };
            },
          }),
        serverTimestamp: () => ({}),
      },
    });

    const { voteForSubmission } = await import(
      `./votingService.ts?case=duplicate-vote-${Date.now()}`
    );

    await assert.rejects(
      () => voteForSubmission('sub1'),
      /Bu çalışmaya zaten oy verdiniz\./,
    );
  });

  test('geçerli oy: vote dokümanı set edilir ve voteCount increment(1) ile güncellenir', async (t) => {
    mockAuth(t, { uid: 'user1' });

    const setCalls: unknown[] = [];
    const updateCalls: unknown[] = [];

    t.mock.module('firebase/firestore', {
      namedExports: {
        doc: (...args: unknown[]) => ({ __ref: args.join('/') }),
        getDoc: async () => ({ exists: () => false }),
        increment: (n: number) => ({ __increment: n }),
        runTransaction: async (
          _db: unknown,
          updateFn: (t: unknown) => unknown,
        ) =>
          updateFn({
            get: async (ref: { __ref: string }) => {
              if (ref.__ref.includes('submissions')) {
                return {
                  exists: () => true,
                  data: () => ({ userId: 'otherUser' }),
                };
              }
              return { exists: () => false };
            },
            set: (ref: unknown, data: unknown) => setCalls.push([ref, data]),
            update: (ref: unknown, data: unknown) =>
              updateCalls.push([ref, data]),
          }),
        serverTimestamp: () => ({ __server: true }),
      },
    });

    const { voteForSubmission } = await import(
      `./votingService.ts?case=success-${Date.now()}`
    );

    await voteForSubmission('sub1');

    assert.equal(setCalls.length, 1);
    const [, voteData] = setCalls[0] as [unknown, Record<string, unknown>];
    assert.equal(voteData.submissionId, 'sub1');
    assert.equal(voteData.userId, 'user1');
    assert.deepEqual(voteData.createdAt, { __server: true });

    assert.equal(updateCalls.length, 1);
    const [, updateData] = updateCalls[0] as [unknown, Record<string, unknown>];
    assert.deepEqual(updateData.voteCount, { __increment: 1 });
  });
});
