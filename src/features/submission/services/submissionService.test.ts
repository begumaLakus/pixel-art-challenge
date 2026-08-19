import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

interface FakeUser {
  uid: string;
}

const mockDbAndAuth = (t: any, user: FakeUser | null): void => {
  t.mock.module('../../../services/firebase/firestore', {
    namedExports: { db: { __fakeDb: true } },
  });
  t.mock.module('../../auth/services/authServices', {
    namedExports: { auth: { currentUser: user } },
  });
};

describe('submissionService.createSubmission', () => {
  test('oturum yoksa hata fırlatır', async (t) => {
    mockDbAndAuth(t, null);
    t.mock.module('firebase/firestore', {
      namedExports: {
        addDoc: async () => ({ id: 'new-id' }),
        collection: () => ({}),
        deleteDoc: async () => {},
        doc: () => ({}),
        getDocs: async () => ({ empty: true, docs: [] }),
        query: () => ({}),
        serverTimestamp: () => ({}),
        where: () => ({}),
        limit: () => ({}),
      },
    });

    const { createSubmission } = await import(
      `./submissionService.ts?case=no-user-${Date.now()}`
    );

    await assert.rejects(
      () =>
        createSubmission({
          challengeId: 'c1',
          pixels: [],
          resolution: 16,
        }),
      /Kullanıcı oturumu bulunamadı\./,
    );
  });

  test('kullanıcı bu challenge için zaten gönderi yaptıysa hata fırlatır', async (t) => {
    mockDbAndAuth(t, { uid: 'user1' });

    const addDocFn = t.mock.fn(async () => ({ id: 'new-id' }));

    t.mock.module('firebase/firestore', {
      namedExports: {
        addDoc: addDocFn,
        collection: () => ({}),
        deleteDoc: async () => {},
        doc: () => ({}),
        getDocs: async () => ({ empty: false, docs: [{ id: 'existing' }] }),
        query: () => ({}),
        serverTimestamp: () => ({}),
        where: () => ({}),
        limit: () => ({}),
      },
    });

    const { createSubmission } = await import(
      `./submissionService.ts?case=duplicate-${Date.now()}`
    );

    await assert.rejects(
      () =>
        createSubmission({
          challengeId: 'c1',
          pixels: [],
          resolution: 16,
        }),
      /Bu challenge için zaten bir çizim gönderdiniz\./,
    );
    assert.equal(addDocFn.mock.calls.length, 0);
  });

  test('geçerli gönderi oluşturulur ve doğru payload ile addDoc çağrılır', async (t) => {
    mockDbAndAuth(t, { uid: 'user1' });

    const addDocFn = t.mock.fn(async (_ref: unknown, payload: unknown) => ({
      id: 'new-submission-id',
    }));

    t.mock.module('firebase/firestore', {
      namedExports: {
        addDoc: addDocFn,
        collection: () => ({}),
        deleteDoc: async () => {},
        doc: () => ({}),
        getDocs: async () => ({ empty: true, docs: [] }),
        query: () => ({}),
        serverTimestamp: () => ({ __server: true }),
        where: () => ({}),
        limit: () => ({}),
      },
    });

    const { createSubmission } = await import(
      `./submissionService.ts?case=success-${Date.now()}`
    );

    const id = await createSubmission({
      challengeId: 'c1',
      pixels: ['#fff', '#000'],
      resolution: 16,
    });

    assert.equal(id, 'new-submission-id');
    assert.equal(addDocFn.mock.calls.length, 1);

    const [, payload] = addDocFn.mock.calls[0].arguments as [
      unknown,
      Record<string, unknown>,
    ];
    assert.equal(payload.userId, 'user1');
    assert.equal(payload.challengeId, 'c1');
    assert.deepEqual(payload.pixels, ['#fff', '#000']);
    assert.equal(payload.resolution, 16);
    assert.equal(payload.voteCount, 0);
    assert.deepEqual(payload.createdAt, { __server: true });
  });
});

describe('submissionService.getSubmissionsByChallenge', () => {
  test('sonuçları en yeni gönderi en üstte olacak şekilde sıralar (eksik createdAt en sona düşer)', async (t) => {
    mockDbAndAuth(t, { uid: 'user1' });

    const makeDoc = (id: string, createdAtMillis: number | null) => ({
      id,
      data: () => ({
        userId: 'someone',
        challengeId: 'c1',
        pixels: [],
        resolution: 16,
        voteCount: 0,
        createdAt:
          createdAtMillis === null
            ? undefined
            : { toMillis: () => createdAtMillis },
      }),
    });

    t.mock.module('firebase/firestore', {
      namedExports: {
        addDoc: async () => ({ id: 'x' }),
        collection: () => ({}),
        deleteDoc: async () => {},
        doc: () => ({}),
        getDocs: async () => ({
          empty: false,
          docs: [
            makeDoc('old', 1000),
            makeDoc('no-timestamp', null),
            makeDoc('newest', 3000),
            makeDoc('middle', 2000),
          ],
        }),
        query: () => ({}),
        serverTimestamp: () => ({}),
        where: () => ({}),
        limit: () => ({}),
      },
    });

    const { getSubmissionsByChallenge } = await import(
      `./submissionService.ts?case=sort-${Date.now()}`
    );

    const result = await getSubmissionsByChallenge('c1');

    assert.deepEqual(
      result.map((submission: { id: string }) => submission.id),
      ['newest', 'middle', 'old', 'no-timestamp'],
    );
  });
});

describe('submissionService.getMySubmissionForChallenge', () => {
  test('oturum yoksa null döner (sorgu hiç atılmaz)', async (t) => {
    mockDbAndAuth(t, null);

    const getDocsFn = t.mock.fn(async () => ({ empty: true, docs: [] }));
    t.mock.module('firebase/firestore', {
      namedExports: {
        addDoc: async () => ({ id: 'x' }),
        collection: () => ({}),
        deleteDoc: async () => {},
        doc: () => ({}),
        getDocs: getDocsFn,
        query: () => ({}),
        serverTimestamp: () => ({}),
        where: () => ({}),
        limit: () => ({}),
      },
    });

    const { getMySubmissionForChallenge } = await import(
      `./submissionService.ts?case=my-no-user-${Date.now()}`
    );

    const result = await getMySubmissionForChallenge('c1');
    assert.equal(result, null);
    assert.equal(getDocsFn.mock.calls.length, 0);
  });

  test('bu challenge için gönderi yoksa null döner', async (t) => {
    mockDbAndAuth(t, { uid: 'user1' });

    t.mock.module('firebase/firestore', {
      namedExports: {
        addDoc: async () => ({ id: 'x' }),
        collection: () => ({}),
        deleteDoc: async () => {},
        doc: () => ({}),
        getDocs: async () => ({ empty: true, docs: [] }),
        query: () => ({}),
        serverTimestamp: () => ({}),
        where: () => ({}),
        limit: () => ({}),
      },
    });

    const { getMySubmissionForChallenge } = await import(
      `./submissionService.ts?case=my-none-${Date.now()}`
    );

    assert.equal(await getMySubmissionForChallenge('c1'), null);
  });

  test('kullanıcının bu challenge için gönderisi varsa döner', async (t) => {
    mockDbAndAuth(t, { uid: 'user1' });

    t.mock.module('firebase/firestore', {
      namedExports: {
        addDoc: async () => ({ id: 'x' }),
        collection: () => ({}),
        deleteDoc: async () => {},
        doc: () => ({}),
        getDocs: async () => ({
          empty: false,
          docs: [
            {
              id: 'my-sub',
              data: () => ({
                userId: 'user1',
                challengeId: 'c1',
                pixels: ['#fff'],
                resolution: 16,
                voteCount: 3,
              }),
            },
          ],
        }),
        query: () => ({}),
        serverTimestamp: () => ({}),
        where: () => ({}),
        limit: () => ({}),
      },
    });

    const { getMySubmissionForChallenge } = await import(
      `./submissionService.ts?case=my-found-${Date.now()}`
    );

    const result = await getMySubmissionForChallenge('c1');
    assert.ok(result);
    assert.equal(result.id, 'my-sub');
    assert.equal(result.voteCount, 3);
  });
});

describe('submissionService.deleteSubmission', () => {
  test('doğru submission id ile deleteDoc çağırır', async (t) => {
    mockDbAndAuth(t, { uid: 'user1' });

    const deleteDocFn = t.mock.fn(async () => {});
    const docFn = t.mock.fn((...args: unknown[]) => ({ __ref: args.join('/') }));

    t.mock.module('firebase/firestore', {
      namedExports: {
        addDoc: async () => ({ id: 'x' }),
        collection: () => ({}),
        deleteDoc: deleteDocFn,
        doc: docFn,
        getDocs: async () => ({ empty: true, docs: [] }),
        query: () => ({}),
        serverTimestamp: () => ({}),
        where: () => ({}),
        limit: () => ({}),
      },
    });

    const { deleteSubmission } = await import(
      `./submissionService.ts?case=delete-${Date.now()}`
    );

    await deleteSubmission('sub-to-delete');

    assert.equal(deleteDocFn.mock.calls.length, 1);
    const [ref] = deleteDocFn.mock.calls[0].arguments;
    assert.ok((ref as { __ref: string }).__ref.includes('sub-to-delete'));
  });
});
