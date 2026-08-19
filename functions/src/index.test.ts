import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

/**
 * `runChallengeManagementCycle`, gerçek Firebase Admin SDK'ya bağlanmadan
 * test edilebilmesi için `db` (sadece `collection` metoduna ihtiyaç duyar)
 * ve `now` (Date) parametre olarak enjekte edilecek şekilde
 * `functions/src/index.ts` içinde dışa aktarıldı. Burada gerçek Firestore
 * admin SDK'sını taklit eden minimal, zincirlenebilir bir sahte
 * (fake) query builder kullanıyoruz.
 */

type FakeDoc = {
  id: string;
  data: () => Record<string, unknown>;
};

type ResolveGet = (
  collectionName: string,
  calls: unknown[][],
) => { empty: boolean; docs: FakeDoc[] };

type ResolveDoc = (
  collectionName: string,
  docId: string,
) => { exists: boolean; data?: () => Record<string, unknown> };

const fakeTimestamp = (date: Date) => ({
  toDate: () => date,
});

function makeFakeDb(options: {
  resolveGet: ResolveGet;
  onUpdate?: (collectionName: string, docId: string, data: unknown) => void;
  onAdd?: (collectionName: string, data: unknown) => string;
  // `collection(name).doc(id)` desteği — `recomputeVoteCountForSubmission`
  // gibi tek doküman okuyan/yazan fonksiyonlar için. Sağlanmazsa
  // `.doc(...).get()` her zaman "yok" (exists: false) döner; mevcut
  // `runChallengeManagementCycle` testleri `.doc()` hiç kullanmadığı için
  // bu opsiyonel alan onlarla tamamen geriye dönük uyumlu.
  resolveDoc?: ResolveDoc;
}) {
  const { resolveGet, onUpdate, onAdd, resolveDoc } = options;

  function makeQueryChain(collectionName: string, calls: unknown[][]): any {
    return {
      where: (...args: unknown[]) =>
        makeQueryChain(collectionName, [...calls, ['where', ...args]]),
      orderBy: (...args: unknown[]) =>
        makeQueryChain(collectionName, [...calls, ['orderBy', ...args]]),
      limit: (...args: unknown[]) =>
        makeQueryChain(collectionName, [...calls, ['limit', ...args]]),
      get: async () => {
        const result = resolveGet(collectionName, calls);
        return {
          empty: result.empty,
          size: result.docs.length,
          docs: result.docs.map((docItem) => ({
            id: docItem.id,
            data: docItem.data,
            ref: {
              update: async (data: unknown) => {
                onUpdate?.(collectionName, docItem.id, data);
              },
            },
          })),
        };
      },
    };
  }

  return {
    collection: (name: string) => ({
      ...makeQueryChain(name, []),
      add: async (data: unknown) => ({
        id: onAdd ? onAdd(name, data) : 'new-doc-id',
      }),
      doc: (docId: string) => ({
        get: async () => {
          const result = resolveDoc
            ? resolveDoc(name, docId)
            : { exists: false };

          return {
            exists: result.exists,
            data: result.data ?? (() => ({})),
          };
        },
        update: async (data: unknown) => {
          onUpdate?.(name, docId, data);
        },
      }),
    }),
  };
}

const mockFirebaseAdmin = (t: any): void => {
  // Gerçek firebase-admin, kimlik bilgisi olmayan bu sandbox ortamında
  // `initializeApp()`/`getFirestore()` sırasında GCP metadata sunucusuna
  // erişmeye çalışıp süresiz asılı kalabiliyor. Modül yüklenirken
  // (initializeApp/getFirestore/onSchedule üst seviyede çağrılıyor) bu SDK
  // sınırlarını mock'layarak testleri ağdan tamamen izole ediyoruz.
  t.mock.module('firebase-admin/app', {
    namedExports: { initializeApp: () => ({}) },
  });
  t.mock.module('firebase-admin/firestore', {
    namedExports: {
      getFirestore: () => ({}),
      Firestore: class {},
      Timestamp: {
        fromDate: (date: Date) => ({ toDate: () => date, __isFakeTimestamp: true }),
      },
    },
  });
  t.mock.module('firebase-functions/v2/scheduler', {
    namedExports: {
      onSchedule: (_config: unknown, handler: unknown) => ({
        __isCloudFunction: true,
        __handler: handler,
      }),
    },
  });
  t.mock.module('firebase-functions/v2/firestore', {
    namedExports: {
      onDocumentWritten: (_path: unknown, handler: unknown) => ({
        __isCloudFunction: true,
        __handler: handler,
      }),
    },
  });
};

const isActiveStatusQuery = (calls: unknown[][]) =>
  calls.some(
    (call) => call[0] === 'where' && call[1] === 'status' && call[3] === 'active',
  );

const isSubmissionIdQuery = (calls: unknown[][], submissionId: string) =>
  calls.some(
    (call) =>
      call[0] === 'where' && call[1] === 'submissionId' && call[3] === submissionId,
  );

describe('runChallengeManagementCycle', () => {
  test("hiç challenge yokken ilk challenge'i oluşturur (THEMES[0], Math.random -> 0)", async (t) => {
    mockFirebaseAdmin(t);

    const { runChallengeManagementCycle, THEMES, CHALLENGE_DURATION_MS, DEFAULT_GRID_SIZE } =
      await import(`./index.ts?case=first-${Date.now()}`);

    const randomSpy = t.mock.method(Math, 'random', () => 0);

    const addCalls: unknown[] = [];
    const updateCalls: unknown[] = [];

    const db = makeFakeDb({
      resolveGet: (collectionName, calls) => {
        if (collectionName === 'challenges') {
          // hem "aktif var mı" hem "en son challenge" sorgusu boş
          return { empty: true, docs: [] };
        }
        return { empty: true, docs: [] };
      },
      onAdd: (collectionName, data) => {
        addCalls.push([collectionName, data]);
        return 'new-challenge-id';
      },
      onUpdate: (collectionName, id, data) => {
        updateCalls.push([collectionName, id, data]);
      },
    });

    const now = new Date('2026-01-01T00:00:00.000Z');
    await runChallengeManagementCycle(db, now);

    assert.equal(updateCalls.length, 0, 'tamamlanacak aktif challenge yok');
    assert.equal(addCalls.length, 1);

    const [collectionName, payload] = addCalls[0] as [string, Record<string, unknown>];
    assert.equal(collectionName, 'challenges');
    assert.equal(payload.status, 'active');
    assert.equal(payload.theme, THEMES[0].theme);
    assert.equal(payload.gridSize, DEFAULT_GRID_SIZE);
    assert.equal(payload.winnerSubmissionId, null);
    assert.equal(payload.completedAt, null);

    const startsAt = (payload.startsAt as { toDate: () => Date }).toDate();
    const endsAt = (payload.endsAt as { toDate: () => Date }).toDate();
    assert.equal(startsAt.getTime(), now.getTime());
    assert.equal(endsAt.getTime() - startsAt.getTime(), CHALLENGE_DURATION_MS);

    randomSpy.mock.restore();
  });

  test('önceki temayla aynı tema arka arkaya seçilmez', async (t) => {
    mockFirebaseAdmin(t);

    const { runChallengeManagementCycle, THEMES } = await import(
      `./index.ts?case=no-repeat-${Date.now()}`
    );

    t.mock.method(Math, 'random', () => 0);

    const addCalls: unknown[] = [];
    const previousTheme = THEMES[0].theme;

    const db = makeFakeDb({
      resolveGet: (collectionName, calls) => {
        if (collectionName === 'challenges') {
          if (isActiveStatusQuery(calls)) {
            return { empty: true, docs: [] };
          }
          // "en son challenge" sorgusu -> önceki temayı taşıyan doküman
          return {
            empty: false,
            docs: [
              {
                id: 'prev-challenge',
                data: () => ({ theme: previousTheme, createdAt: fakeTimestamp(new Date()) }),
              },
            ],
          };
        }
        return { empty: true, docs: [] };
      },
      onAdd: (collectionName, data) => {
        addCalls.push([collectionName, data]);
        return 'new-challenge-id';
      },
    });

    await runChallengeManagementCycle(db, new Date('2026-01-01T00:00:00.000Z'));

    const [, payload] = addCalls[0] as [string, Record<string, unknown>];
    assert.notEqual(payload.theme, previousTheme);
    // Math.random -> 0 ve önceki tema filtrelendiği için beklenen tema THEMES[1] olmalı.
    assert.equal(payload.theme, THEMES[1].theme);
  });

  test('aktif challenge süresi dolmadıysa hiçbir şey yapmaz (erken çıkış)', async (t) => {
    mockFirebaseAdmin(t);

    const { runChallengeManagementCycle } = await import(
      `./index.ts?case=still-active-${Date.now()}`
    );

    const now = new Date('2026-01-01T12:00:00.000Z');
    const futureEndsAt = new Date(now.getTime() + 60 * 60 * 1000);

    const addCalls: unknown[] = [];
    const updateCalls: unknown[] = [];

    const db = makeFakeDb({
      resolveGet: (collectionName, calls) => {
        if (collectionName === 'challenges' && isActiveStatusQuery(calls)) {
          return {
            empty: false,
            docs: [
              {
                id: 'active-1',
                data: () => ({
                  status: 'active',
                  endsAt: fakeTimestamp(futureEndsAt),
                }),
              },
            ],
          };
        }
        throw new Error(
          `Beklenmeyen sorgu: challenge süresi dolmadıysa fonksiyon erken dönmeli (collection=${collectionName})`,
        );
      },
      onAdd: (collectionName, data) => {
        addCalls.push([collectionName, data]);
        return 'x';
      },
      onUpdate: (collectionName, id, data) => {
        updateCalls.push([collectionName, id, data]);
      },
    });

    await runChallengeManagementCycle(db, now);

    assert.equal(updateCalls.length, 0);
    assert.equal(addCalls.length, 0);
  });

  test('süresi dolan challenge en çok oy alan gönderiyi kazanan ilan eder ve yeni challenge başlatır', async (t) => {
    mockFirebaseAdmin(t);

    const { runChallengeManagementCycle } = await import(
      `./index.ts?case=winner-${Date.now()}`
    );

    t.mock.method(Math, 'random', () => 0);

    const now = new Date('2026-01-02T00:00:00.000Z');
    const pastEndsAt = new Date(now.getTime() - 1000);

    const addCalls: unknown[] = [];
    const updateCalls: unknown[] = [];

    const db = makeFakeDb({
      resolveGet: (collectionName, calls) => {
        if (collectionName === 'challenges') {
          if (isActiveStatusQuery(calls)) {
            return {
              empty: false,
              docs: [
                {
                  id: 'active-ended',
                  data: () => ({ status: 'active', endsAt: fakeTimestamp(pastEndsAt) }),
                },
              ],
            };
          }
          // "en son challenge" sorgusu (tema tekrarını önlemek için)
          return {
            empty: false,
            docs: [
              {
                id: 'active-ended',
                data: () => ({ theme: 'uzay_macerasi', createdAt: fakeTimestamp(pastEndsAt) }),
              },
            ],
          };
        }

        if (collectionName === 'submissions') {
          // orderBy(voteCount desc).limit(1) taklidi: en yüksek oylu doküman.
          return {
            empty: false,
            docs: [{ id: 'winning-submission', data: () => ({ voteCount: 42 }) }],
          };
        }

        throw new Error(`Beklenmeyen koleksiyon: ${collectionName}`);
      },
      onAdd: (collectionName, data) => {
        addCalls.push([collectionName, data]);
        return 'new-challenge-id';
      },
      onUpdate: (collectionName, id, data) => {
        updateCalls.push([collectionName, id, data]);
      },
    });

    await runChallengeManagementCycle(db, now);

    assert.equal(updateCalls.length, 1);
    const [updateCollection, updateId, updateData] = updateCalls[0] as [
      string,
      string,
      Record<string, unknown>,
    ];
    assert.equal(updateCollection, 'challenges');
    assert.equal(updateId, 'active-ended');
    assert.equal(updateData.status, 'completed');
    assert.equal(updateData.winnerSubmissionId, 'winning-submission');

    assert.equal(addCalls.length, 1, 'kazanan belirlendikten sonra yeni challenge da başlamalı');
  });

  test("süresi dolan challenge'a hiç gönderi yapılmadıysa winnerSubmissionId null olur", async (t) => {
    mockFirebaseAdmin(t);

    const { runChallengeManagementCycle } = await import(
      `./index.ts?case=no-submissions-${Date.now()}`
    );

    t.mock.method(Math, 'random', () => 0);

    const now = new Date('2026-01-02T00:00:00.000Z');
    const pastEndsAt = new Date(now.getTime() - 1000);
    const updateCalls: unknown[] = [];

    const db = makeFakeDb({
      resolveGet: (collectionName, calls) => {
        if (collectionName === 'challenges') {
          if (isActiveStatusQuery(calls)) {
            return {
              empty: false,
              docs: [
                {
                  id: 'active-ended',
                  data: () => ({ status: 'active', endsAt: fakeTimestamp(pastEndsAt) }),
                },
              ],
            };
          }
          return {
            empty: false,
            docs: [
              {
                id: 'active-ended',
                data: () => ({ theme: 'uzay_macerasi', createdAt: fakeTimestamp(pastEndsAt) }),
              },
            ],
          };
        }
        if (collectionName === 'submissions') {
          return { empty: true, docs: [] };
        }
        throw new Error(`Beklenmeyen koleksiyon: ${collectionName}`);
      },
      onAdd: () => 'new-challenge-id',
      onUpdate: (collectionName, id, data) => {
        updateCalls.push([collectionName, id, data]);
      },
    });

    await runChallengeManagementCycle(db, now);

    const [, , updateData] = updateCalls[0] as [string, string, Record<string, unknown>];
    assert.equal(updateData.winnerSubmissionId, null);
  });

  test('db sorgusu hata fırlatırsa fonksiyon hatayı yutar (throw etmez)', async (t) => {
    mockFirebaseAdmin(t);

    const { runChallengeManagementCycle } = await import(
      `./index.ts?case=error-${Date.now()}`
    );

    const db = {
      collection: () => {
        throw new Error('Firestore bağlantı hatası');
      },
    };

    await assert.doesNotReject(() =>
      runChallengeManagementCycle(db as any, new Date()),
    );
  });
});

describe('recomputeVoteCountForSubmission', () => {
  test('submission silinmişse hiçbir şey güncellemez', async (t) => {
    mockFirebaseAdmin(t);

    const { recomputeVoteCountForSubmission } = await import(
      `./index.ts?case=recompute-missing-${Date.now()}`
    );

    const updateCalls: unknown[] = [];

    const db = makeFakeDb({
      resolveGet: () => {
        throw new Error('submission yoksa votes sorgusu hiç atılmamalı');
      },
      resolveDoc: (collectionName, docId) => {
        assert.equal(collectionName, 'submissions');
        assert.equal(docId, 'deleted-sub');
        return { exists: false };
      },
      onUpdate: (collectionName, id, data) => {
        updateCalls.push([collectionName, id, data]);
      },
    });

    await recomputeVoteCountForSubmission(db, 'deleted-sub');

    assert.equal(updateCalls.length, 0);
  });

  test("submission varsa voteCount'u votes koleksiyonundaki gerçek doküman sayısına eşitler", async (t) => {
    mockFirebaseAdmin(t);

    const { recomputeVoteCountForSubmission } = await import(
      `./index.ts?case=recompute-count-${Date.now()}`
    );

    const updateCalls: unknown[] = [];

    const db = makeFakeDb({
      resolveGet: (collectionName, calls) => {
        if (collectionName === 'votes' && isSubmissionIdQuery(calls, 'sub1')) {
          return {
            empty: false,
            docs: [
              { id: 'challenge1_userA', data: () => ({}) },
              { id: 'challenge1_userB', data: () => ({}) },
              { id: 'challenge1_userC', data: () => ({}) },
            ],
          };
        }
        throw new Error(`Beklenmeyen sorgu: ${collectionName}`);
      },
      resolveDoc: (collectionName, docId) => {
        if (collectionName === 'submissions' && docId === 'sub1') {
          return { exists: true, data: () => ({ userId: 'owner' }) };
        }
        throw new Error(`Beklenmeyen doküman: ${collectionName}/${docId}`);
      },
      onUpdate: (collectionName, id, data) => {
        updateCalls.push([collectionName, id, data]);
      },
    });

    await recomputeVoteCountForSubmission(db, 'sub1');

    assert.equal(updateCalls.length, 1);
    const [collectionName, docId, data] = updateCalls[0] as [
      string,
      string,
      Record<string, unknown>,
    ];
    assert.equal(collectionName, 'submissions');
    assert.equal(docId, 'sub1');
    assert.equal(data.voteCount, 3);
  });

  test('hiç oy yoksa voteCount 0 olur', async (t) => {
    mockFirebaseAdmin(t);

    const { recomputeVoteCountForSubmission } = await import(
      `./index.ts?case=recompute-zero-${Date.now()}`
    );

    const updateCalls: unknown[] = [];

    const db = makeFakeDb({
      resolveGet: () => ({ empty: true, docs: [] }),
      resolveDoc: () => ({ exists: true, data: () => ({}) }),
      onUpdate: (collectionName, id, data) => {
        updateCalls.push([collectionName, id, data]);
      },
    });

    await recomputeVoteCountForSubmission(db, 'lonely-sub');

    assert.equal(updateCalls.length, 1);
    const [, , data] = updateCalls[0] as [string, string, Record<string, unknown>];
    assert.equal(data.voteCount, 0);
  });
});

describe('getAffectedSubmissionIds', () => {
  test('oy oluşturulduğunda (before yok) sadece yeni hedefi döner', async (t) => {
    mockFirebaseAdmin(t);

    const { getAffectedSubmissionIds } = await import(
      `./index.ts?case=affected-create-${Date.now()}`
    );

    assert.deepEqual(
      getAffectedSubmissionIds(null, { userId: 'u1', challengeId: 'c1', submissionId: 'subA' }),
      ['subA'],
    );
  });

  test('oy silindiğinde (after yok) sadece eski hedefi döner', async (t) => {
    mockFirebaseAdmin(t);

    const { getAffectedSubmissionIds } = await import(
      `./index.ts?case=affected-delete-${Date.now()}`
    );

    assert.deepEqual(
      getAffectedSubmissionIds({ userId: 'u1', challengeId: 'c1', submissionId: 'subA' }, null),
      ['subA'],
    );
  });

  test('oy başka bir çizime taşındığında hem eski hem yeni hedefi döner', async (t) => {
    mockFirebaseAdmin(t);

    const { getAffectedSubmissionIds } = await import(
      `./index.ts?case=affected-transfer-${Date.now()}`
    );

    assert.deepEqual(
      getAffectedSubmissionIds(
        { userId: 'u1', challengeId: 'c1', submissionId: 'subA' },
        { userId: 'u1', challengeId: 'c1', submissionId: 'subB' },
      ),
      ['subA', 'subB'],
    );
  });

  test('before ve after yoksa boş dizi döner', async (t) => {
    mockFirebaseAdmin(t);

    const { getAffectedSubmissionIds } = await import(
      `./index.ts?case=affected-none-${Date.now()}`
    );

    assert.deepEqual(getAffectedSubmissionIds(null, null), []);
  });
});

describe('onVoteWritten (bağlama/wiring)', () => {
  test("`onDocumentWritten` ile 'votes/{voteId}' yoluna bağlanmış bir Cloud Function olarak dışa aktarılır", async (t) => {
    mockFirebaseAdmin(t);

    const { onVoteWritten } = await import(
      `./index.ts?case=wiring-${Date.now()}`
    );

    // `firebase-functions/v2/firestore`'un `onDocumentWritten`'ı bu
    // testte mock'landığı için gerçek bir tetikleyici oluşturulmuyor;
    // burada sadece modülün onu doğru şekilde export ettiğini
    // doğruluyoruz. Asıl iş mantığı (`getAffectedSubmissionIds` +
    // `recomputeVoteCountForSubmission`) yukarıda ayrı ayrı, Admin
    // SDK'ya hiç dokunmadan test ediliyor.
    assert.equal((onVoteWritten as any).__isCloudFunction, true);
    assert.equal(typeof (onVoteWritten as any).__handler, 'function');
  });
});
