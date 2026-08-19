import { test, describe, mock } from 'node:test';
import assert from 'node:assert/strict';

/**
 * votingService, doğrudan `firebase/firestore` ve komşu `authServices`
 * modülünü import ediyor. Gerçek Firebase'e bağlanmadan test edebilmek
 * için node:test'in `mock.module` API'siyle her iki modülü de test
 * başına yeniden mock'luyoruz (davranış test senaryosuna göre değişiyor).
 *
 * Veri modeli: kullanıcının bir challenge'daki oyu TEK ve deterministik
 * bir dokümandır (`votes/{challengeId}_{userId}`), bir sorgu sonucu
 * DEĞİL. `submissions.voteCount`'a bu dosyadan HİÇ yazılmıyor (bkz.
 * votingService.ts başındaki not) — bu yüzden testlerde artık
 * `increment`/submissions `update` mock'u yok; sadece `votes`
 * dokümanındaki `get`/`set`/`delete` çağrıları doğrulanıyor.
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

const baseStubs = {
  onSnapshot: () => () => {},
};

describe('votingService.hasUserVoted', () => {
  test('oturum yoksa hata fırlatır', async (t) => {
    mockAuth(t, null);
    t.mock.module('firebase/firestore', {
      namedExports: {
        doc: () => ({}),
        getDoc: async () => ({ exists: () => false }),
        runTransaction: async () => {},
        serverTimestamp: () => ({}),
        ...baseStubs,
      },
    });

    const { hasUserVoted } = await import(
      `./votingService.ts?case=no-user-${Date.now()}`
    );

    await assert.rejects(
      () => hasUserVoted('sub1', 'challenge1'),
      /Kullanıcı oturumu bulunamadı\./,
    );
  });

  test('oy dokümanı yoksa false döner ve doğru voteId ile doc çağrılır', async (t) => {
    mockAuth(t, { uid: 'user1' });

    const docCalls: unknown[] = [];
    t.mock.module('firebase/firestore', {
      namedExports: {
        doc: (...args: unknown[]) => {
          docCalls.push(args);
          return { __ref: args.join('/') };
        },
        getDoc: async () => ({ exists: () => false }),
        runTransaction: async () => {},
        serverTimestamp: () => ({}),
        ...baseStubs,
      },
    });

    const { hasUserVoted } = await import(
      `./votingService.ts?case=not-voted-${Date.now()}`
    );

    const result = await hasUserVoted('sub1', 'challenge1');

    assert.equal(result, false);
    // voteId = `${challengeId}_${user.uid}` şeklinde kurulmalı (tek,
    // challenge başına bir doküman).
    assert.equal(docCalls[0]?.[docCalls[0].length - 1], 'challenge1_user1');
  });

  test('oy dokümanı bu submission dışında bir çizime işaret ediyorsa false döner', async (t) => {
    mockAuth(t, { uid: 'user1' });
    t.mock.module('firebase/firestore', {
      namedExports: {
        doc: () => ({}),
        getDoc: async () => ({
          exists: () => true,
          data: () => ({ submissionId: 'sub2' }),
        }),
        runTransaction: async () => {},
        serverTimestamp: () => ({}),
        ...baseStubs,
      },
    });

    const { hasUserVoted } = await import(
      `./votingService.ts?case=voted-other-${Date.now()}`
    );

    assert.equal(await hasUserVoted('sub1', 'challenge1'), false);
  });

  test('oy dokümanı bu submission\'a işaret ediyorsa true döner', async (t) => {
    mockAuth(t, { uid: 'user1' });
    t.mock.module('firebase/firestore', {
      namedExports: {
        doc: () => ({}),
        getDoc: async () => ({
          exists: () => true,
          data: () => ({ submissionId: 'sub1' }),
        }),
        runTransaction: async () => {},
        serverTimestamp: () => ({}),
        ...baseStubs,
      },
    });

    const { hasUserVoted } = await import(
      `./votingService.ts?case=voted-${Date.now()}`
    );

    assert.equal(await hasUserVoted('sub1', 'challenge1'), true);
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
        runTransaction: runTransactionFn,
        serverTimestamp: () => ({}),
        ...baseStubs,
      },
    });

    const { voteForSubmission } = await import(
      `./votingService.ts?case=vote-no-user-${Date.now()}`
    );

    await assert.rejects(
      () => voteForSubmission('sub1', 'challenge1'),
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
        runTransaction: async (
          _db: unknown,
          updateFn: (t: unknown) => unknown,
        ) =>
          updateFn({
            get: async (ref: { __ref?: string }) => {
              if (ref.__ref?.includes('submissions')) {
                return { exists: () => false };
              }
              return { exists: () => false };
            },
          }),
        serverTimestamp: () => ({}),
        ...baseStubs,
      },
    });

    const { voteForSubmission } = await import(
      `./votingService.ts?case=no-submission-${Date.now()}`
    );

    await assert.rejects(
      () => voteForSubmission('sub1', 'challenge1'),
      /Gönderi bulunamadı\./,
    );
  });

  test('kendi çizimine oy vermeye çalışırsa hata fırlatır', async (t) => {
    mockAuth(t, { uid: 'user1' });
    t.mock.module('firebase/firestore', {
      namedExports: {
        doc: (...args: unknown[]) => ({ __ref: args.join('/') }),
        getDoc: async () => ({ exists: () => false }),
        runTransaction: async (
          _db: unknown,
          updateFn: (t: unknown) => unknown,
        ) =>
          updateFn({
            get: async (ref: { __ref?: string }) => {
              if (ref.__ref?.includes('submissions')) {
                return { exists: () => true, data: () => ({ userId: 'user1' }) };
              }
              return { exists: () => false };
            },
          }),
        serverTimestamp: () => ({}),
        ...baseStubs,
      },
    });

    const { voteForSubmission } = await import(
      `./votingService.ts?case=self-vote-${Date.now()}`
    );

    await assert.rejects(
      () => voteForSubmission('sub1', 'challenge1'),
      /Kendi eserinize oy veremezsiniz\./,
    );
  });

  test('aynı çalışmaya tekrar basılırsa oy geri alınır (toggle off), submissions hiç yazılmaz', async (t) => {
    mockAuth(t, { uid: 'user1' });

    const deleteCalls: unknown[] = [];
    const updateCalls: unknown[] = [];
    const setCalls: unknown[] = [];

    t.mock.module('firebase/firestore', {
      namedExports: {
        doc: (...args: unknown[]) => ({ __ref: args.join('/') }),
        getDoc: async () => ({ exists: () => false }),
        runTransaction: async (
          _db: unknown,
          updateFn: (t: unknown) => unknown,
        ) =>
          updateFn({
            get: async (ref: { __ref?: string }) => {
              if (ref.__ref?.includes('submissions')) {
                return {
                  exists: () => true,
                  data: () => ({ userId: 'otherUser' }),
                };
              }
              // votes/challenge1_user1 -> zaten 'sub1'e oy verilmiş
              return {
                exists: () => true,
                data: () => ({ submissionId: 'sub1' }),
              };
            },
            delete: (ref: unknown) => deleteCalls.push(ref),
            update: (ref: unknown, data: unknown) =>
              updateCalls.push([ref, data]),
            set: (ref: unknown, data: unknown, options: unknown) =>
              setCalls.push([ref, data, options]),
          }),
        serverTimestamp: () => ({}),
        ...baseStubs,
      },
    });

    const { voteForSubmission } = await import(
      `./votingService.ts?case=toggle-off-${Date.now()}`
    );

    await voteForSubmission('sub1', 'challenge1');

    assert.equal(deleteCalls.length, 1);
    assert.ok(
      (deleteCalls[0] as { __ref: string }).__ref.includes(
        'votes/challenge1_user1',
      ),
    );

    // voteCount artık client'tan hiç yazılmıyor (Cloud Function
    // hesaplıyor) — submissions üzerinde ne update ne set çağrılmalı.
    assert.equal(updateCalls.length, 0);
    assert.equal(setCalls.length, 0);
  });

  test('başka bir çizime oy verilirse aynı doküman yeni çizime taşınır, submissions hiç yazılmaz', async (t) => {
    mockAuth(t, { uid: 'user1' });

    const deleteCalls: unknown[] = [];
    const updateCalls: unknown[] = [];
    const setCalls: unknown[] = [];

    t.mock.module('firebase/firestore', {
      namedExports: {
        doc: (...args: unknown[]) => ({ __ref: args.join('/') }),
        getDoc: async () => ({ exists: () => false }),
        runTransaction: async (
          _db: unknown,
          updateFn: (t: unknown) => unknown,
        ) =>
          updateFn({
            get: async (ref: { __ref?: string }) => {
              if (ref.__ref?.includes('submissions/sub2')) {
                return {
                  exists: () => true,
                  data: () => ({ userId: 'otherUser2' }),
                };
              }
              // votes/challenge1_user1 -> hâlihazırda 'sub1'e aktif oy var
              return {
                exists: () => true,
                data: () => ({ submissionId: 'sub1' }),
              };
            },
            delete: (ref: unknown) => deleteCalls.push(ref),
            update: (ref: unknown, data: unknown) =>
              updateCalls.push([ref, data]),
            set: (ref: unknown, data: unknown, options: unknown) =>
              setCalls.push([ref, data, options]),
          }),
        serverTimestamp: () => ({ __server: true }),
        ...baseStubs,
      },
    });

    const { voteForSubmission } = await import(
      `./votingService.ts?case=transfer-${Date.now()}`
    );

    await voteForSubmission('sub2', 'challenge1');

    // Tek oy dokümanı SİLİNMEZ, `submissionId` alanı güncellenerek
    // taşınır (merge: true ile set edilir).
    assert.equal(deleteCalls.length, 0);
    assert.equal(updateCalls.length, 0);

    assert.equal(setCalls.length, 1);
    const [voteRef, voteData, options] = setCalls[0] as [
      { __ref: string },
      Record<string, unknown>,
      Record<string, unknown>,
    ];
    assert.ok(voteRef.__ref.includes('votes/challenge1_user1'));
    assert.equal(voteData.submissionId, 'sub2');
    assert.equal(voteData.challengeId, 'challenge1');
    assert.equal(voteData.userId, 'user1');
    assert.deepEqual(options, { merge: true });
  });

  test('geçerli oy: vote dokümanı set edilir, submissions hiç yazılmaz', async (t) => {
    mockAuth(t, { uid: 'user1' });

    const setCalls: unknown[] = [];
    const updateCalls: unknown[] = [];

    t.mock.module('firebase/firestore', {
      namedExports: {
        doc: (...args: unknown[]) => ({ __ref: args.join('/') }),
        getDoc: async () => ({ exists: () => false }),
        runTransaction: async (
          _db: unknown,
          updateFn: (t: unknown) => unknown,
        ) =>
          updateFn({
            get: async (ref: { __ref?: string }) => {
              if (ref.__ref?.includes('submissions')) {
                return {
                  exists: () => true,
                  data: () => ({ userId: 'otherUser' }),
                };
              }
              // votes/challenge1_user1 -> henüz hiç oy yok
              return { exists: () => false };
            },
            set: (ref: unknown, data: unknown, options: unknown) =>
              setCalls.push([ref, data, options]),
            update: (ref: unknown, data: unknown) =>
              updateCalls.push([ref, data]),
          }),
        serverTimestamp: () => ({ __server: true }),
        ...baseStubs,
      },
    });

    const { voteForSubmission } = await import(
      `./votingService.ts?case=success-${Date.now()}`
    );

    await voteForSubmission('sub1', 'challenge1');

    assert.equal(setCalls.length, 1);
    const [, voteData] = setCalls[0] as [unknown, Record<string, unknown>];
    assert.equal(voteData.submissionId, 'sub1');
    assert.equal(voteData.challengeId, 'challenge1');
    assert.equal(voteData.userId, 'user1');
    assert.deepEqual(voteData.createdAt, { __server: true });

    assert.equal(updateCalls.length, 0);
  });
});
