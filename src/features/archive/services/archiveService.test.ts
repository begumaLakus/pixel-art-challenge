import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

const mockDb = (t: any): void => {
  t.mock.module('@/src/services/firebase/firestore', {
    namedExports: { db: { __fakeDb: true } },
  });
};

const baseFirestoreMocks = (overrides: Record<string, unknown> = {}) => ({
  collection: () => ({}),
  doc: (...args: unknown[]) => ({ __ref: args.join('/') }),
  getDoc: async () => ({ exists: () => false }),
  getDocs: async () => ({ empty: true, docs: [] }),
  query: () => ({}),
  Timestamp: class {},
  where: () => ({}),
  ...overrides,
});

const timestamp = (millis: number) => ({ toMillis: () => millis });

describe('archiveService.getArchivedChallenges', () => {
  test('tamamlanmış challenge yoksa boş liste döner', async (t) => {
    mockDb(t);
    t.mock.module('firebase/firestore', {
      namedExports: baseFirestoreMocks({
        getDocs: async () => ({ empty: true, docs: [] }),
      }),
    });

    const { getArchivedChallenges } = await import(
      `./archiveService.ts?case=empty-${Date.now()}`
    );

    assert.deepEqual(await getArchivedChallenges(), []);
  });

  test("tamamlanmış challenge'lar completedAt (yoksa endsAt) DESC sıralanır", async (t) => {
    mockDb(t);

    const makeChallengeDoc = (
      id: string,
      completedAtMillis: number | null,
      endsAtMillis: number,
    ) => ({
      id,
      data: () => ({
        title: id,
        description: '',
        theme: 'uzay_macerasi',
        gridSize: 16,
        startsAt: timestamp(endsAtMillis - 1000),
        endsAt: timestamp(endsAtMillis),
        status: 'completed',
        winnerSubmissionId: null,
        createdAt: timestamp(endsAtMillis - 2000),
        completedAt:
          completedAtMillis === null ? null : timestamp(completedAtMillis),
      }),
    });

    t.mock.module('firebase/firestore', {
      namedExports: baseFirestoreMocks({
        getDocs: async () => ({
          empty: false,
          docs: [
            makeChallengeDoc('a-old', 1000, 1500),
            // completedAt eksik -> endsAt'e (5000) düşmeli, en yeni olmalı
            makeChallengeDoc('b-no-completed-at', null, 5000),
            makeChallengeDoc('c-middle', 3000, 3500),
          ],
        }),
      }),
    });

    const { getArchivedChallenges } = await import(
      `./archiveService.ts?case=sort-${Date.now()}`
    );

    const result = await getArchivedChallenges();

    assert.deepEqual(
      result.map((entry: { challenge: { id: string } }) => entry.challenge.id),
      ['b-no-completed-at', 'c-middle', 'a-old'],
    );
  });

  test('winnerSubmissionId yoksa winnerSubmission null döner', async (t) => {
    mockDb(t);
    t.mock.module('firebase/firestore', {
      namedExports: baseFirestoreMocks({
        getDocs: async () => ({
          empty: false,
          docs: [
            {
              id: 'c1',
              data: () => ({
                title: 'c1',
                theme: 'uzay_macerasi',
                status: 'completed',
                winnerSubmissionId: null,
                endsAt: timestamp(1000),
                completedAt: timestamp(1000),
                createdAt: timestamp(0),
              }),
            },
          ],
        }),
      }),
    });

    const { getArchivedChallenges } = await import(
      `./archiveService.ts?case=no-winner-id-${Date.now()}`
    );

    const [entry] = await getArchivedChallenges();
    assert.equal(entry.winnerSubmission, null);
  });

  test('kazanan submission dokümanı yoksa null döner (hata fırlatmaz)', async (t) => {
    mockDb(t);
    t.mock.module('firebase/firestore', {
      namedExports: baseFirestoreMocks({
        getDoc: async () => ({ exists: () => false }),
        getDocs: async () => ({
          empty: false,
          docs: [
            {
              id: 'c1',
              data: () => ({
                title: 'c1',
                theme: 'uzay_macerasi',
                status: 'completed',
                winnerSubmissionId: 'missing-sub',
                endsAt: timestamp(1000),
                completedAt: timestamp(1000),
                createdAt: timestamp(0),
              }),
            },
          ],
        }),
      }),
    });

    const { getArchivedChallenges } = await import(
      `./archiveService.ts?case=missing-winner-doc-${Date.now()}`
    );

    const [entry] = await getArchivedChallenges();
    assert.equal(entry.winnerSubmission, null);
  });

  test("kazanan submission farklı bir challenge'a aitse (tutarsız veri) null döner", async (t) => {
    mockDb(t);
    t.mock.module('firebase/firestore', {
      namedExports: baseFirestoreMocks({
        getDoc: async () => ({
          exists: () => true,
          id: 'sub1',
          data: () => ({
            challengeId: 'OTHER_CHALLENGE',
            pixels: ['#fff'],
            resolution: 16,
          }),
        }),
        getDocs: async () => ({
          empty: false,
          docs: [
            {
              id: 'c1',
              data: () => ({
                title: 'c1',
                theme: 'uzay_macerasi',
                status: 'completed',
                winnerSubmissionId: 'sub1',
                endsAt: timestamp(1000),
                completedAt: timestamp(1000),
                createdAt: timestamp(0),
              }),
            },
          ],
        }),
      }),
    });

    const { getArchivedChallenges } = await import(
      `./archiveService.ts?case=mismatched-challenge-${Date.now()}`
    );

    const [entry] = await getArchivedChallenges();
    assert.equal(entry.winnerSubmission, null);
  });

  test("kazanan submission'ın pixels/resolution verisi eksikse null döner", async (t) => {
    mockDb(t);
    t.mock.module('firebase/firestore', {
      namedExports: baseFirestoreMocks({
        getDoc: async () => ({
          exists: () => true,
          id: 'sub1',
          data: () => ({
            challengeId: 'c1',
            pixels: [],
            resolution: 16,
          }),
        }),
        getDocs: async () => ({
          empty: false,
          docs: [
            {
              id: 'c1',
              data: () => ({
                title: 'c1',
                theme: 'uzay_macerasi',
                status: 'completed',
                winnerSubmissionId: 'sub1',
                endsAt: timestamp(1000),
                completedAt: timestamp(1000),
                createdAt: timestamp(0),
              }),
            },
          ],
        }),
      }),
    });

    const { getArchivedChallenges } = await import(
      `./archiveService.ts?case=missing-pixels-${Date.now()}`
    );

    const [entry] = await getArchivedChallenges();
    assert.equal(entry.winnerSubmission, null);
  });

  test('geçerli kazanan submission döner', async (t) => {
    mockDb(t);
    t.mock.module('firebase/firestore', {
      namedExports: baseFirestoreMocks({
        getDoc: async () => ({
          exists: () => true,
          id: 'sub1',
          data: () => ({
            challengeId: 'c1',
            pixels: ['#fff', '#000'],
            resolution: 16,
            voteCount: 7,
          }),
        }),
        getDocs: async () => ({
          empty: false,
          docs: [
            {
              id: 'c1',
              data: () => ({
                title: 'c1',
                theme: 'uzay_macerasi',
                status: 'completed',
                winnerSubmissionId: 'sub1',
                endsAt: timestamp(1000),
                completedAt: timestamp(1000),
                createdAt: timestamp(0),
              }),
            },
          ],
        }),
      }),
    });

    const { getArchivedChallenges } = await import(
      `./archiveService.ts?case=valid-winner-${Date.now()}`
    );

    const [entry] = await getArchivedChallenges();
    assert.ok(entry.winnerSubmission);
    assert.equal(entry.winnerSubmission.id, 'sub1');
    assert.equal(entry.winnerSubmission.voteCount, 7);
  });
});
