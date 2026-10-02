import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

interface FakeUser {
  uid: string;
}

const mockModules = (
  t: any,
  user: FakeUser | null,
  firestore: Record<string, unknown>,
): void => {
  t.mock.module('../../../services/firebase/firestore', {
    namedExports: { db: { __fakeDb: true } },
  });
  t.mock.module('../../auth/services/authServices', {
    namedExports: { auth: { currentUser: user } },
  });
  t.mock.module('firebase/firestore', {
    namedExports: {
      collection: (_db: unknown, ...path: string[]) => ({ path: path.join('/') }),
      deleteDoc: async () => {},
      doc: (_db: unknown, ...path: string[]) => ({ path: path.join('/') }),
      onSnapshot: () => () => {},
      serverTimestamp: () => ({ __server: true }),
      setDoc: async () => {},
      ...firestore,
    },
  });
};

describe('buildReportId', () => {
  test('çizim ve şikayet edenden deterministik id üretir', async (t) => {
    mockModules(t, null, {});
    const { buildReportId } = await import(`./moderationService.ts?case=id-${Date.now()}`);

    assert.equal(buildReportId('sub1', 'u1'), 'sub1_u1');
  });
});

describe('reportSubmission', () => {
  test('oturum yoksa hata fırlatır', async (t) => {
    mockModules(t, null, {});
    const { reportSubmission } = await import(`./moderationService.ts?case=rep-nouser-${Date.now()}`);

    await assert.rejects(
      () =>
        reportSubmission({
          submissionId: 's',
          challengeId: 'c',
          reportedUserId: 'x',
          reason: 'spam',
        }),
      /Kullanıcı oturumu bulunamadı/,
    );
  });

  test('doğru yola ve beklenen alanlarla yazar', async (t) => {
    const setDocFn = t.mock.fn(async (_ref: unknown, _data: unknown) => {});
    mockModules(t, { uid: 'alice' }, { setDoc: setDocFn });
    const { reportSubmission } = await import(`./moderationService.ts?case=rep-ok-${Date.now()}`);

    await reportSubmission({
      submissionId: 'c1_bob',
      challengeId: 'c1',
      reportedUserId: 'bob',
      reason: 'inappropriate',
    });

    const [ref, data] = setDocFn.mock.calls[0].arguments as [
      { path: string },
      Record<string, unknown>,
    ];
    assert.equal(ref.path, 'reports/c1_bob_alice');
    assert.deepEqual(data, {
      submissionId: 'c1_bob',
      challengeId: 'c1',
      reportedUserId: 'bob',
      reporterId: 'alice',
      reason: 'inappropriate',
      createdAt: { __server: true },
    });
  });
});

describe('blockUser / unblockUser', () => {
  test('engel kullanıcının kendi alt koleksiyonuna yazılır ve silinir', async (t) => {
    const setDocFn = t.mock.fn(async (_ref: unknown, _data: unknown) => {});
    const deleteDocFn = t.mock.fn(async (_ref: unknown) => {});
    mockModules(t, { uid: 'alice' }, { setDoc: setDocFn, deleteDoc: deleteDocFn });
    const { blockUser, unblockUser } = await import(`./moderationService.ts?case=block-${Date.now()}`);

    await blockUser('bob');
    await unblockUser('bob');

    assert.equal((setDocFn.mock.calls[0].arguments[0] as { path: string }).path, 'users/alice/blocks/bob');
    assert.equal((deleteDocFn.mock.calls[0].arguments[0] as { path: string }).path, 'users/alice/blocks/bob');
  });

  test('oturum yoksa engelleme hata fırlatır', async (t) => {
    mockModules(t, null, {});
    const { blockUser } = await import(`./moderationService.ts?case=block-nouser-${Date.now()}`);

    await assert.rejects(() => blockUser('bob'), /Kullanıcı oturumu bulunamadı/);
  });
});

describe('subscribeToBlockedUsers', () => {
  test("doküman id'lerini onChange'e iletir", async (t) => {
    const onSnapshotFn = t.mock.fn(
      (_ref: unknown, next: (snapshot: { docs: { id: string }[] }) => void) => {
        next({ docs: [{ id: 'bob' }, { id: 'carol' }] });
        return () => {};
      },
    );
    mockModules(t, { uid: 'alice' }, { onSnapshot: onSnapshotFn });
    const { subscribeToBlockedUsers } = await import(`./moderationService.ts?case=sub-${Date.now()}`);

    const received: string[][] = [];
    subscribeToBlockedUsers((ids: string[]) => received.push(ids), () => {});

    assert.deepEqual(received, [['bob', 'carol']]);
  });

  test('oturum yoksa hiç dinlemeden no-op unsubscribe döner', async (t) => {
    const onSnapshotFn = t.mock.fn(() => () => {});
    mockModules(t, null, { onSnapshot: onSnapshotFn });
    const { subscribeToBlockedUsers } = await import(`./moderationService.ts?case=sub-nouser-${Date.now()}`);

    const unsubscribe = subscribeToBlockedUsers(() => {}, () => {});

    assert.equal(typeof unsubscribe, 'function');
    assert.equal(onSnapshotFn.mock.calls.length, 0);
  });
});
