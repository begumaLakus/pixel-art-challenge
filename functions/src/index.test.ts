import assert from 'node:assert/strict';
import { describe, test, type TestContext } from 'node:test';

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
  // `collection(name).doc(id).set(...)` desteği — `enforceRateLimit` gibi
  // dokümanı doğrudan (üzerine yazarak) oluşturan/sıfırlayan fonksiyonlar
  // için. Sağlanmazsa `onSet` çağrılmaz, sadece yok sayılır.
  onSet?: (collectionName: string, docId: string, data: unknown) => void;
  // `ref.delete()` / `doc(id).delete()` desteği — hesap silme testleri için.
  onDelete?: (collectionName: string, docId: string) => void;
}) {
  const { resolveGet, onUpdate, onAdd, resolveDoc, onSet, onDelete } = options;

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
              delete: async () => {
                onDelete?.(collectionName, docItem.id);
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
        set: async (data: unknown) => {
          onSet?.(name, docId, data);
        },
        delete: async () => {
          onDelete?.(name, docId);
        },
      }),
    }),
  };
}

const mockFirebaseAdmin = (t: TestContext): void => {
  // Gerçek firebase-admin, kimlik bilgisi olmayan bu sandbox ortamında
  // `initializeApp()`/`getFirestore()` sırasında GCP metadata sunucusuna
  // erişmeye çalışıp süresiz asılı kalabiliyor. Modül yüklenirken
  // (initializeApp/getFirestore/onSchedule üst seviyede çağrılıyor) bu SDK
  // sınırlarını mock'layarak testleri ağdan tamamen izole ediyoruz.
  t.mock.module('firebase-admin/app', {
    namedExports: { initializeApp: () => ({}) },
  });
  t.mock.module('firebase-admin/auth', {
    namedExports: { getAuth: () => ({ deleteUser: async () => {} }) },
  });
  t.mock.module('firebase-admin/firestore', {
    namedExports: {
      getFirestore: () => ({}),
      Firestore: class {},
      FieldValue: { delete: () => ({ __deleteField: true }) },
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
      onDocumentCreated: (_path: unknown, handler: unknown) => ({
        __isCloudFunction: true,
        __handler: handler,
      }),
    },
  });
  // `defineSecret`, gerçek Firebase ortamında Secret Manager'a bağlanır;
  // burada sadece modülün yüklenebilmesi için `.value()` çağrılabilir
  // (boş string dönen) sahte bir secret nesnesi veriyoruz. Testler
  // `apiKey`'i doğrudan `runChallengeManagementCycle`/`generateThemeWithAI`
  // parametresi olarak enjekte ettiği için bu mock'un değeri önemsiz.
  t.mock.module('firebase-functions/params', {
    namedExports: {
      defineSecret: () => ({ value: () => '' }),
    },
  });
  // `onCall`/`HttpsError`, `getCreativeInspiration` gibi callable
  // fonksiyonların bağlandığı gerçek modül. `HttpsError` gerçek sınıfa
  // yakın davranmalı (code + message) ki testler `error.code` ile
  // doğrulama yapabilsin.
  t.mock.module('firebase-functions/v2/https', {
    namedExports: {
      onCall: (_config: unknown, handler: unknown) => ({
        __isCloudFunction: true,
        __handler: handler,
      }),
      HttpsError: class HttpsError extends Error {
        code: string;
        constructor(code: string, message: string) {
          super(message);
          this.code = code;
        }
      },
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

// Gemini REST yanıtının, `generateThemeWithAI`'nin okuduğu şekle uygun
// sahte bir sürümünü üretir.
const fakeGeminiResponse = (payload: unknown) => ({
  ok: true,
  json: async () => ({
    candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }],
  }),
});

describe('runChallengeManagementCycle', () => {
  test("hiç challenge yokken ilk challenge'i oluşturur (THEMES[0], Math.random -> 0)", async (t: TestContext) => {
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

  test('önceki temayla aynı tema arka arkaya seçilmez', async (t: TestContext) => {
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

  test('aktif challenge süresi dolmadıysa hiçbir şey yapmaz (erken çıkış)', async (t: TestContext) => {
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

  test('süresi dolan challenge en çok oy alan gönderiyi kazanan ilan eder ve yeni challenge başlatır', async (t: TestContext) => {
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
          // voteCount alanı bilerek yanıltıcı: kazanan `votes` sayımından çıkmalı.
          return {
            empty: false,
            docs: [
              { id: 'late-submission', data: () => ({ voteCount: 99, createdAt: fakeTimestamp(new Date('2026-01-01T10:00:00.000Z')) }) },
              { id: 'winning-submission', data: () => ({ voteCount: 0, createdAt: fakeTimestamp(new Date('2026-01-01T09:00:00.000Z')) }) },
            ],
          };
        }

        if (collectionName === 'votes') {
          return {
            empty: false,
            docs: [
              { id: 'v1', data: () => ({ submissionId: 'winning-submission' }) },
              { id: 'v2', data: () => ({ submissionId: 'late-submission' }) },
              { id: 'v3', data: () => ({ submissionId: 'winning-submission' }) },
            ],
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

  test("süresi dolan challenge'a hiç gönderi yapılmadıysa winnerSubmissionId null olur", async (t: TestContext) => {
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
        if (collectionName === 'submissions' || collectionName === 'votes') {
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

  test('eşitlikte en erken gönderilen çizim kazanır ve silinmiş çizimlerin artık oyları sayılmaz', async (t: TestContext) => {
    mockFirebaseAdmin(t);

    const { determineWinnerSubmissionId } = await import(
      `./index.ts?case=tie-break-${Date.now()}`
    );

    const db = makeFakeDb({
      resolveGet: (collectionName) => {
        if (collectionName === 'submissions') {
          return {
            empty: false,
            docs: [
              { id: 'b-later', data: () => ({ createdAt: fakeTimestamp(new Date('2026-01-01T12:00:00.000Z')) }) },
              { id: 'a-earlier', data: () => ({ createdAt: fakeTimestamp(new Date('2026-01-01T08:00:00.000Z')) }) },
            ],
          };
        }

        return {
          empty: false,
          docs: [
            { id: 'v1', data: () => ({ submissionId: 'b-later' }) },
            { id: 'v2', data: () => ({ submissionId: 'a-earlier' }) },
            { id: 'v3', data: () => ({ submissionId: 'deleted-submission' }) },
            { id: 'v4', data: () => ({ submissionId: 'deleted-submission' }) },
          ],
        };
      },
    });

    assert.equal(await determineWinnerSubmissionId(db, 'challenge-1'), 'a-earlier');
  });

  test('hiç oy yoksa bile gönderi varsa en erken gönderilen kazanır', async (t: TestContext) => {
    mockFirebaseAdmin(t);

    const { selectWinner } = await import(`./index.ts?case=select-winner-${Date.now()}`);

    assert.equal(selectWinner([]), null);
    assert.equal(
      selectWinner([
        { id: 'x', votes: 0, createdAtMs: 200 },
        { id: 'y', votes: 0, createdAtMs: 100 },
      ]),
      'y',
    );
    assert.equal(
      selectWinner([
        { id: 'x', votes: 3, createdAtMs: 200 },
        { id: 'y', votes: 2, createdAtMs: 100 },
      ]),
      'x',
    );
  });

  test('db sorgusu hata fırlatırsa fonksiyon hatayı yutar (throw etmez)', async (t: TestContext) => {
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

describe('runChallengeManagementCycle ile AI tema üretimi entegrasyonu', () => {
  test('Gemini başarılı yanıt döndürürse yeni challenge AI temasını kullanır', async (t: TestContext) => {
    mockFirebaseAdmin(t);

    const { runChallengeManagementCycle } = await import(
      `./index.ts?case=ai-success-${Date.now()}`
    );

    const aiTheme = {
      theme: 'kayip_robotlar',
      title: 'Kayıp Robotlar',
      description: 'Pas tutmuş ama gururlu robotlar çizim zamanı! 🤖✨',
    };

    const fetchMock = t.mock.method(globalThis, 'fetch', async () => fakeGeminiResponse(aiTheme));

    const addCalls: unknown[] = [];

    const db = makeFakeDb({
      resolveGet: () => ({ empty: true, docs: [] }),
      onAdd: (collectionName, data) => {
        addCalls.push([collectionName, data]);
        return 'new-challenge-id';
      },
    });

    await runChallengeManagementCycle(db, new Date('2026-01-01T00:00:00.000Z'), 'fake-api-key');

    assert.equal(fetchMock.mock.calls.length, 1);
    const [, payload] = addCalls[0] as [string, Record<string, unknown>];
    assert.equal(payload.theme, aiTheme.theme);
    assert.equal(payload.title, aiTheme.title);
    assert.equal(payload.description, aiTheme.description);
  });

  test('Gemini hata verirse (ağ hatası) sabit listeye düşülür, challenge yine de oluşur', async (t: TestContext) => {
    mockFirebaseAdmin(t);

    const { runChallengeManagementCycle, THEMES } = await import(
      `./index.ts?case=ai-fallback-${Date.now()}`
    );

    t.mock.method(Math, 'random', () => 0);
    t.mock.method(globalThis, 'fetch', async () => {
      throw new Error('ağ hatası');
    });

    const addCalls: unknown[] = [];

    const db = makeFakeDb({
      resolveGet: () => ({ empty: true, docs: [] }),
      onAdd: (collectionName, data) => {
        addCalls.push([collectionName, data]);
        return 'new-challenge-id';
      },
    });

    await runChallengeManagementCycle(db, new Date('2026-01-01T00:00:00.000Z'), 'fake-api-key');

    const [, payload] = addCalls[0] as [string, Record<string, unknown>];
    assert.equal(payload.theme, THEMES[0].theme);
  });
});

describe('pickFallbackTheme', () => {
  test('önceki temayı listeden hariç tutar', async (t: TestContext) => {
    mockFirebaseAdmin(t);

    const { pickFallbackTheme, THEMES } = await import(
      `./index.ts?case=pick-fallback-${Date.now()}`
    );

    t.mock.method(Math, 'random', () => 0);

    const result = pickFallbackTheme(THEMES[0].theme);

    assert.equal(result.theme, THEMES[1].theme);
  });

  test('önceki tema yoksa (null) tüm listeden seçebilir', async (t: TestContext) => {
    mockFirebaseAdmin(t);

    const { pickFallbackTheme, THEMES } = await import(
      `./index.ts?case=pick-fallback-null-${Date.now()}`
    );

    t.mock.method(Math, 'random', () => 0);

    const result = pickFallbackTheme(null);

    assert.equal(result.theme, THEMES[0].theme);
  });
});

describe('generateThemeWithAI', () => {
  test('apiKey verilmezse ağa hiç çıkmadan null döner', async (t: TestContext) => {
    mockFirebaseAdmin(t);

    const { generateThemeWithAI } = await import(
      `./index.ts?case=ai-no-key-${Date.now()}`
    );

    const fetchMock = t.mock.method(globalThis, 'fetch', async () => {
      throw new Error('fetch çağrılmamalıydı');
    });

    const result = await generateThemeWithAI(undefined, null);

    assert.equal(result, null);
    assert.equal(fetchMock.mock.calls.length, 0);
  });

  test('fetch reddedilirse (network hatası) null döner, throw etmez', async (t: TestContext) => {
    mockFirebaseAdmin(t);

    const { generateThemeWithAI } = await import(
      `./index.ts?case=ai-network-error-${Date.now()}`
    );

    t.mock.method(globalThis, 'fetch', async () => {
      throw new Error('ağ hatası');
    });

    const result = await generateThemeWithAI('fake-api-key', null);

    assert.equal(result, null);
  });

  test('HTTP hatası durumunda null döner', async (t: TestContext) => {
    mockFirebaseAdmin(t);

    const { generateThemeWithAI } = await import(
      `./index.ts?case=ai-http-error-${Date.now()}`
    );

    t.mock.method(globalThis, 'fetch', async () => ({
      ok: false,
      status: 500,
      text: async () => 'internal error',
    }));

    const result = await generateThemeWithAI('fake-api-key', null);

    assert.equal(result, null);
  });

  test('geçersiz şekilde dönen tema (eksik alan) null döner', async (t: TestContext) => {
    mockFirebaseAdmin(t);

    const { generateThemeWithAI } = await import(
      `./index.ts?case=ai-invalid-shape-${Date.now()}`
    );

    t.mock.method(globalThis, 'fetch', async () =>
      fakeGeminiResponse({ theme: 'gecerli_slug' /* title, description eksik */ }),
    );

    const result = await generateThemeWithAI('fake-api-key', null);

    assert.equal(result, null);
  });

  test('geçersiz slug formatında tema null döner', async (t: TestContext) => {
    mockFirebaseAdmin(t);

    const { generateThemeWithAI } = await import(
      `./index.ts?case=ai-invalid-slug-${Date.now()}`
    );

    t.mock.method(globalThis, 'fetch', async () =>
      fakeGeminiResponse({
        theme: 'Geçersiz Slug!',
        title: 'Başlık',
        description: 'Açıklama',
      }),
    );

    const result = await generateThemeWithAI('fake-api-key', null);

    assert.equal(result, null);
  });

  test('önceki temanın birebir aynısı dönerse null döner (fallback tetiklenir)', async (t: TestContext) => {
    mockFirebaseAdmin(t);

    const { generateThemeWithAI } = await import(
      `./index.ts?case=ai-repeat-${Date.now()}`
    );

    t.mock.method(globalThis, 'fetch', async () =>
      fakeGeminiResponse({
        theme: 'uzay_macerasi',
        title: 'Uzay Macerası',
        description: 'Aynı tema tekrar geldi.',
      }),
    );

    const result = await generateThemeWithAI('fake-api-key', 'uzay_macerasi');

    assert.equal(result, null);
  });

  test('geçerli, özgün bir tema başarıyla döner', async (t: TestContext) => {
    mockFirebaseAdmin(t);

    const { generateThemeWithAI } = await import(
      `./index.ts?case=ai-valid-${Date.now()}`
    );

    const aiTheme = {
      theme: 'kayip_robotlar',
      title: 'Kayıp Robotlar',
      description: 'Pas tutmuş ama gururlu robotlar çizim zamanı! 🤖✨',
    };

    t.mock.method(globalThis, 'fetch', async () => fakeGeminiResponse(aiTheme));

    const result = await generateThemeWithAI('fake-api-key', 'uzay_macerasi');

    assert.deepEqual(result, aiTheme);
  });
});

describe('recomputeVoteCountForSubmission', () => {
  test('submission silinmişse hiçbir şey güncellemez', async (t: TestContext) => {
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

  test("submission varsa voteCount'u votes koleksiyonundaki gerçek doküman sayısına eşitler", async (t: TestContext) => {
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

  test('hiç oy yoksa voteCount 0 olur', async (t: TestContext) => {
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
  test('oy oluşturulduğunda (before yok) sadece yeni hedefi döner', async (t: TestContext) => {
    mockFirebaseAdmin(t);

    const { getAffectedSubmissionIds } = await import(
      `./index.ts?case=affected-create-${Date.now()}`
    );

    assert.deepEqual(
      getAffectedSubmissionIds(null, { userId: 'u1', challengeId: 'c1', submissionId: 'subA' }),
      ['subA'],
    );
  });

  test('oy silindiğinde (after yok) sadece eski hedefi döner', async (t: TestContext) => {
    mockFirebaseAdmin(t);

    const { getAffectedSubmissionIds } = await import(
      `./index.ts?case=affected-delete-${Date.now()}`
    );

    assert.deepEqual(
      getAffectedSubmissionIds({ userId: 'u1', challengeId: 'c1', submissionId: 'subA' }, null),
      ['subA'],
    );
  });

  test('oy başka bir çizime taşındığında hem eski hem yeni hedefi döner', async (t: TestContext) => {
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

  test('before ve after yoksa boş dizi döner', async (t: TestContext) => {
    mockFirebaseAdmin(t);

    const { getAffectedSubmissionIds } = await import(
      `./index.ts?case=affected-none-${Date.now()}`
    );

    assert.deepEqual(getAffectedSubmissionIds(null, null), []);
  });
});

describe('onVoteWritten (bağlama/wiring)', () => {
  test("`onDocumentWritten` ile 'votes/{voteId}' yoluna bağlanmış bir Cloud Function olarak dışa aktarılır", async (t: TestContext) => {
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

describe('enforceRateLimit', () => {
  test('doküman hiç yoksa izin verir ve pencereyi 1 sayaçla başlatır', async (t: TestContext) => {
    mockFirebaseAdmin(t);

    const { enforceRateLimit } = await import(
      `./index.ts?case=rate-first-${Date.now()}`
    );

    const setCalls: unknown[] = [];

    const db = makeFakeDb({
      resolveGet: () => ({ empty: true, docs: [] }),
      resolveDoc: () => ({ exists: false }),
      onSet: (collectionName, docId, data) => {
        setCalls.push([collectionName, docId, data]);
      },
    });

    await assert.doesNotReject(() =>
      enforceRateLimit(db, 'user1', 'inspiration', 5, 60_000, new Date('2026-01-01T00:00:00Z')),
    );

    assert.equal(setCalls.length, 1);
    const [collectionName, docId, data] = setCalls[0] as [string, string, Record<string, unknown>];
    assert.equal(collectionName, 'aiRateLimits');
    assert.equal(docId, 'user1_inspiration');
    assert.equal(data.count, 1);
  });

  test('limitin altındaysa sayacı bir artırır', async (t: TestContext) => {
    mockFirebaseAdmin(t);

    const { enforceRateLimit } = await import(
      `./index.ts?case=rate-increment-${Date.now()}`
    );

    const now = new Date('2026-01-01T00:02:00Z');
    const windowStart = new Date('2026-01-01T00:00:00Z');
    const updateCalls: unknown[] = [];

    const db = makeFakeDb({
      resolveGet: () => ({ empty: true, docs: [] }),
      resolveDoc: () => ({
        exists: true,
        data: () => ({ windowStart: fakeTimestamp(windowStart), count: 2 }),
      }),
      onUpdate: (collectionName, docId, data) => {
        updateCalls.push([collectionName, docId, data]);
      },
    });

    await enforceRateLimit(db, 'user1', 'inspiration', 5, 5 * 60_000, now);

    assert.equal(updateCalls.length, 1);
    const [, , data] = updateCalls[0] as [string, string, Record<string, unknown>];
    assert.equal(data.count, 3);
  });

  test('limit aşıldıysa resource-exhausted hatası fırlatır', async (t: TestContext) => {
    mockFirebaseAdmin(t);

    const { enforceRateLimit } = await import(
      `./index.ts?case=rate-exceeded-${Date.now()}`
    );

    const now = new Date('2026-01-01T00:02:00Z');
    const windowStart = new Date('2026-01-01T00:00:00Z');

    const db = makeFakeDb({
      resolveGet: () => ({ empty: true, docs: [] }),
      resolveDoc: () => ({
        exists: true,
        data: () => ({ windowStart: fakeTimestamp(windowStart), count: 5 }),
      }),
    });

    await assert.rejects(
      () => enforceRateLimit(db, 'user1', 'inspiration', 5, 5 * 60_000, now),
      (error: any) => {
        assert.equal(error.code, 'resource-exhausted');
        return true;
      },
    );
  });

  test('pencere dolmuşsa limite ulaşılmış olsa bile sıfırdan başlar (izin verir)', async (t: TestContext) => {
    mockFirebaseAdmin(t);

    const { enforceRateLimit } = await import(
      `./index.ts?case=rate-window-reset-${Date.now()}`
    );

    const now = new Date('2026-01-01T00:10:00Z');
    const windowStart = new Date('2026-01-01T00:00:00Z'); // 10 dakika önce

    const setCalls: unknown[] = [];

    const db = makeFakeDb({
      resolveGet: () => ({ empty: true, docs: [] }),
      resolveDoc: () => ({
        exists: true,
        data: () => ({ windowStart: fakeTimestamp(windowStart), count: 5 }),
      }),
      onSet: (collectionName, docId, data) => {
        setCalls.push([collectionName, docId, data]);
      },
    });

    // Pencere 5 dakika, son istek 10 dakika önceydi -> dolmuş.
    await assert.doesNotReject(() =>
      enforceRateLimit(db, 'user1', 'inspiration', 5, 5 * 60_000, now),
    );

    assert.equal(setCalls.length, 1);
    const [, , data] = setCalls[0] as [string, string, Record<string, unknown>];
    assert.equal(data.count, 1);
  });

  test("farklı bucket'lar birbirinden bağımsız dokümanlar kullanır", async (t: TestContext) => {
    mockFirebaseAdmin(t);

    const { enforceRateLimit } = await import(
      `./index.ts?case=rate-bucket-${Date.now()}`
    );

    const setCalls: unknown[] = [];

    const db = makeFakeDb({
      resolveGet: () => ({ empty: true, docs: [] }),
      resolveDoc: () => ({ exists: false }),
      onSet: (collectionName, docId, data) => {
        setCalls.push([collectionName, docId, data]);
      },
    });

    await enforceRateLimit(db, 'user1', 'inspiration', 5, 60_000, new Date());
    await enforceRateLimit(db, 'user1', 'moderation', 5, 60_000, new Date());

    assert.equal(setCalls.length, 2);
    const docIds = setCalls.map((call) => (call as [string, string, unknown])[1]);
    assert.deepEqual(docIds, ['user1_inspiration', 'user1_moderation']);
  });
});

describe('generateCreativeInspiration', () => {
  test('apiKey yoksa ağa hiç çıkmadan null döner', async (t: TestContext) => {
    mockFirebaseAdmin(t);

    const { generateCreativeInspiration } = await import(
      `./index.ts?case=insp-no-key-${Date.now()}`
    );

    const fetchMock = t.mock.method(globalThis, 'fetch', async () => {
      throw new Error('fetch çağrılmamalıydı');
    });

    const result = await generateCreativeInspiration(undefined, 'Uzay Macerası', 'açıklama');

    assert.equal(result, null);
    assert.equal(fetchMock.mock.calls.length, 0);
  });

  test('fetch reddedilirse null döner, throw etmez', async (t: TestContext) => {
    mockFirebaseAdmin(t);

    const { generateCreativeInspiration } = await import(
      `./index.ts?case=insp-network-error-${Date.now()}`
    );

    t.mock.method(globalThis, 'fetch', async () => {
      throw new Error('ağ hatası');
    });

    const result = await generateCreativeInspiration('fake-api-key', 'Uzay Macerası', 'açıklama');

    assert.equal(result, null);
  });

  test('boş öneri (whitespace) null döner', async (t: TestContext) => {
    mockFirebaseAdmin(t);

    const { generateCreativeInspiration } = await import(
      `./index.ts?case=insp-empty-${Date.now()}`
    );

    t.mock.method(globalThis, 'fetch', async () => fakeGeminiResponse({ suggestion: '   ' }));

    const result = await generateCreativeInspiration('fake-api-key', 'Uzay Macerası', 'açıklama');

    assert.equal(result, null);
  });

  test('geçerli önerinin baş/son boşlukları kırpılarak döner', async (t: TestContext) => {
    mockFirebaseAdmin(t);

    const { generateCreativeInspiration } = await import(
      `./index.ts?case=insp-success-${Date.now()}`
    );

    t.mock.method(globalThis, 'fetch', async () =>
      fakeGeminiResponse({ suggestion: '  Kaybolmuş bir robotun son mesajını çiz! 🤖  ' }),
    );

    const result = await generateCreativeInspiration('fake-api-key', 'Uzay Macerası', 'açıklama');

    assert.equal(result, 'Kaybolmuş bir robotun son mesajını çiz! 🤖');
  });
});

describe('handleGetCreativeInspiration', () => {
  test('aktif challenge yoksa failed-precondition hatası fırlatır', async (t: TestContext) => {
    mockFirebaseAdmin(t);

    const { handleGetCreativeInspiration } = await import(
      `./index.ts?case=handle-no-challenge-${Date.now()}`
    );

    const db = makeFakeDb({
      resolveGet: (collectionName) => {
        if (collectionName === 'aiRateLimits') {
          throw new Error('rate limit koleksiyonu sorgulanmamalı (sadece doc erişimi olmalı)');
        }
        return { empty: true, docs: [] };
      },
      resolveDoc: () => ({ exists: false }),
    });

    await assert.rejects(
      () => handleGetCreativeInspiration(db, 'user1', 'fake-api-key', new Date()),
      (error: any) => {
        assert.equal(error.code, 'failed-precondition');
        return true;
      },
    );
  });

  test('rate limit aşıldıysa Gemini hiç çağrılmadan hata fırlatır', async (t: TestContext) => {
    mockFirebaseAdmin(t);

    const { handleGetCreativeInspiration } = await import(
      `./index.ts?case=handle-rate-limited-${Date.now()}`
    );

    const now = new Date('2026-01-01T00:02:00Z');
    const windowStart = new Date('2026-01-01T00:00:00Z');

    const fetchMock = t.mock.method(globalThis, 'fetch', async () => {
      throw new Error('Gemini çağrılmamalıydı');
    });

    const db = makeFakeDb({
      resolveGet: () => ({ empty: true, docs: [] }),
      resolveDoc: () => ({
        exists: true,
        data: () => ({ windowStart: fakeTimestamp(windowStart), count: 5 }),
      }),
    });

    await assert.rejects(
      () => handleGetCreativeInspiration(db, 'user1', 'fake-api-key', now),
      (error: any) => {
        assert.equal(error.code, 'resource-exhausted');
        return true;
      },
    );

    assert.equal(fetchMock.mock.calls.length, 0);
  });

  test('Gemini başarısız olursa unavailable hatası fırlatır', async (t: TestContext) => {
    mockFirebaseAdmin(t);

    const { handleGetCreativeInspiration } = await import(
      `./index.ts?case=handle-ai-failure-${Date.now()}`
    );

    t.mock.method(globalThis, 'fetch', async () => {
      throw new Error('ağ hatası');
    });

    const db = makeFakeDb({
      resolveGet: (collectionName) => {
        if (collectionName === 'challenges') {
          return {
            empty: false,
            docs: [
              {
                id: 'active-1',
                data: () => ({ title: 'Uzay Macerası', description: 'açıklama' }),
              },
            ],
          };
        }
        return { empty: true, docs: [] };
      },
      resolveDoc: () => ({ exists: false }),
    });

    await assert.rejects(
      () => handleGetCreativeInspiration(db, 'user1', 'fake-api-key', new Date()),
      (error: any) => {
        assert.equal(error.code, 'unavailable');
        return true;
      },
    );
  });

  test('başarılı durumda aktif challenge temasına göre önerimi döner', async (t: TestContext) => {
    mockFirebaseAdmin(t);

    const { handleGetCreativeInspiration } = await import(
      `./index.ts?case=handle-success-${Date.now()}`
    );

    const fetchMock = t.mock.method(globalThis, 'fetch', async (_url: string, init: any) => {
      const body = JSON.parse(init.body);
      assert.match(body.contents[0].parts[0].text, /Uzay Macerası/);
      return fakeGeminiResponse({ suggestion: 'Kaybolmuş bir uzay gemisi çiz! 🚀' });
    });

    const db = makeFakeDb({
      resolveGet: (collectionName) => {
        if (collectionName === 'challenges') {
          return {
            empty: false,
            docs: [
              {
                id: 'active-1',
                data: () => ({ title: 'Uzay Macerası', description: 'açıklama' }),
              },
            ],
          };
        }
        return { empty: true, docs: [] };
      },
      resolveDoc: () => ({ exists: false }),
    });

    const result = await handleGetCreativeInspiration(db, 'user1', 'fake-api-key', new Date());

    assert.deepEqual(result, { suggestion: 'Kaybolmuş bir uzay gemisi çiz! 🚀' });
    assert.equal(fetchMock.mock.calls.length, 1);
  });
});

describe('getCreativeInspiration (bağlama/wiring)', () => {
  test('kimliği doğrulanmamış istekte unauthenticated hatası fırlatır', async (t: TestContext) => {
    mockFirebaseAdmin(t);

    const { getCreativeInspiration } = await import(
      `./index.ts?case=call-unauthenticated-${Date.now()}`
    );

    assert.equal((getCreativeInspiration as any).__isCloudFunction, true);

    const handler = (getCreativeInspiration as any).__handler;

    await assert.rejects(
      () => handler({ auth: undefined, data: {} }),
      (error: any) => {
        assert.equal(error.code, 'unauthenticated');
        return true;
      },
    );
  });
});


describe('pickPalette', () => {
  test('aynı tema her zaman aynı paleti alır', async (t: TestContext) => {
    mockFirebaseAdmin(t);
    const { pickPalette } = await import(`./index.ts?case=palette-det-${Date.now()}`);

    assert.deepEqual(pickPalette('uzay_macerasi'), pickPalette('uzay_macerasi'));
  });

  test('her palet geçerli hex renkler, bir koyu ve bir açık renk içerir', async (t: TestContext) => {
    mockFirebaseAdmin(t);
    const { PALETTES } = await import(`./index.ts?case=palette-valid-${Date.now()}`);

    const luminance = (hex: string): number => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    for (const palette of PALETTES as string[][]) {
      assert.ok(palette.length >= 5 && palette.length <= 8);
      for (const color of palette) {
        assert.match(color, /^#[0-9A-Fa-f]{6}$/);
      }
      const values = palette.map(luminance);
      assert.ok(Math.min(...values) < 40, 'koyu renk olmalı');
      assert.ok(Math.max(...values) > 200, 'açık renk olmalı');
    }
  });

  test('yeni challenge dokümanına palet yazılır', async (t: TestContext) => {
    mockFirebaseAdmin(t);
    const { runChallengeManagementCycle } = await import(
      `./index.ts?case=palette-cycle-${Date.now()}`
    );
    t.mock.method(Math, 'random', () => 0);

    const added: Record<string, unknown>[] = [];
    const db = makeFakeDb({
      resolveGet: () => ({ empty: true, docs: [] }),
      onAdd: (_collection, data) => {
        added.push(data as Record<string, unknown>);
        return 'new-id';
      },
    });

    await runChallengeManagementCycle(db, new Date('2026-01-02T00:00:00.000Z'));

    assert.equal(added.length, 1);
    assert.ok(Array.isArray(added[0].palette));
    assert.ok((added[0].palette as string[]).length >= 5);
  });
});


describe('kullanıcı istatistikleri entegrasyonu', () => {
  const startsAt = new Date('2026-03-01T00:00:00.000Z');

  test('katılım, kullanıcının users dokümanına stats olarak yazılır', async (t: TestContext) => {
    mockFirebaseAdmin(t);
    const { recordParticipation } = await import(`./index.ts?case=stats-part-${Date.now()}`);

    const writes: unknown[] = [];
    const db = makeFakeDb({
      resolveGet: () => ({ empty: true, docs: [] }),
      resolveDoc: (collectionName) =>
        collectionName === 'challenges'
          ? { exists: true, data: () => ({ startsAt: fakeTimestamp(startsAt) }) }
          : { exists: false },
      onSet: (collectionName, docId, data) => writes.push([collectionName, docId, data]),
    });

    await recordParticipation(db, { userId: 'u1', challengeId: 'c1' });

    assert.equal(writes.length, 1);
    const [collection, docId, data] = writes[0] as [string, string, { stats: Record<string, unknown> }];
    assert.equal(collection, 'users');
    assert.equal(docId, 'u1');
    assert.equal(data.stats.streak, 1);
    assert.equal(data.stats.entries, 1);
    assert.deepEqual(data.stats.badges, ['first_entry']);
  });

  test('aynı challenge ikinci kez işlenirse yazma yapılmaz (idempotent)', async (t: TestContext) => {
    mockFirebaseAdmin(t);
    const { recordParticipation } = await import(`./index.ts?case=stats-idem-${Date.now()}`);

    const writes: unknown[] = [];
    const db = makeFakeDb({
      resolveGet: () => ({ empty: true, docs: [] }),
      resolveDoc: (collectionName) =>
        collectionName === 'challenges'
          ? { exists: true, data: () => ({ startsAt: fakeTimestamp(startsAt) }) }
          : {
              exists: true,
              data: () => ({
                stats: {
                  streak: 1,
                  bestStreak: 1,
                  entries: 1,
                  wins: 0,
                  badges: ['first_entry'],
                  lastChallengeStartsAtMs: startsAt.getTime(),
                },
              }),
            },
      onSet: (...args) => writes.push(args),
    });

    await recordParticipation(db, { userId: 'u1', challengeId: 'c1' });

    assert.equal(writes.length, 0);
  });

  test('challenge yoksa hiçbir şey yazılmaz', async (t: TestContext) => {
    mockFirebaseAdmin(t);
    const { recordParticipation } = await import(`./index.ts?case=stats-nochal-${Date.now()}`);

    const writes: unknown[] = [];
    const db = makeFakeDb({
      resolveGet: () => ({ empty: true, docs: [] }),
      onSet: (...args) => writes.push(args),
    });

    await recordParticipation(db, { userId: 'u1', challengeId: 'yok' });

    assert.equal(writes.length, 0);
  });

  test('kazanan çizimin sahibi sampiyon rozeti alır', async (t: TestContext) => {
    mockFirebaseAdmin(t);
    const { recordWin } = await import(`./index.ts?case=stats-win-${Date.now()}`);

    const writes: unknown[] = [];
    const db = makeFakeDb({
      resolveGet: () => ({ empty: true, docs: [] }),
      resolveDoc: (collectionName) =>
        collectionName === 'submissions'
          ? { exists: true, data: () => ({ userId: 'winner-uid' }) }
          : { exists: false },
      onSet: (collectionName, docId, data) => writes.push([collectionName, docId, data]),
    });

    await recordWin(db, 'sub-1');

    const [, docId, data] = writes[0] as [string, string, { stats: { wins: number; badges: string[] } }];
    assert.equal(docId, 'winner-uid');
    assert.equal(data.stats.wins, 1);
    assert.ok(data.stats.badges.includes('champion'));
  });

  test('10 oya ulasan cizimin sahibi populer rozeti alir, altindaysa yazma yapilmaz', async (t: TestContext) => {
    mockFirebaseAdmin(t);
    const { awardPopularBadge } = await import(`./index.ts?case=stats-pop-${Date.now()}`);

    const makeDb = (voteCount: number, writes: unknown[]) =>
      makeFakeDb({
        resolveGet: () => ({ empty: true, docs: [] }),
        resolveDoc: (collectionName) =>
          collectionName === 'submissions'
            ? { exists: true, data: () => ({ userId: 'owner', voteCount }) }
            : { exists: false },
        onSet: (...args) => writes.push(args),
      });

    const low: unknown[] = [];
    await awardPopularBadge(makeDb(9, low), 'sub-1');
    assert.equal(low.length, 0);

    const high: unknown[] = [];
    await awardPopularBadge(makeDb(10, high), 'sub-1');
    assert.equal(high.length, 1);
  });
});


describe('AI jüri yorumu', () => {
  const drawing = Array.from({ length: 16 }, (_, index) => (index < 6 ? '#FF0000' : '#FDFBF7'));
  const baseInput = {
    themeTitle: 'Sevimli Canavarlar',
    themeDescription: 'Korkutma, güldür!',
    pixels: drawing,
    resolution: 4,
  };

  test('Gemini geçerli yorum döndürürse yorum üretilir', async (t: TestContext) => {
    mockFirebaseAdmin(t);
    const { generateJuryComment } = await import(`./index.ts?case=jury-ok-${Date.now()}`);

    t.mock.method(globalThis, 'fetch', async () =>
      fakeGeminiResponse({ comment: 'Tatlı bir canavar!' }),
    );

    assert.equal(await generateJuryComment('key', baseInput), 'Tatlı bir canavar!');
  });

  test('çizim neredeyse boşsa Gemini hiç çağrılmaz', async (t: TestContext) => {
    mockFirebaseAdmin(t);
    const { generateJuryComment } = await import(`./index.ts?case=jury-empty-${Date.now()}`);

    const fetchMock = t.mock.method(globalThis, 'fetch', async () => {
      throw new Error('çağrılmamalıydı');
    });

    const blank = Array.from({ length: 16 }, () => '#FDFBF7');
    assert.equal(await generateJuryComment('key', { ...baseInput, pixels: blank }), null);
    assert.equal(fetchMock.mock.calls.length, 0);
  });

  test('API anahtarı yoksa veya yanıt geçersizse null döner', async (t: TestContext) => {
    mockFirebaseAdmin(t);
    const { generateJuryComment } = await import(`./index.ts?case=jury-null-${Date.now()}`);

    assert.equal(await generateJuryComment(undefined, baseInput), null);

    t.mock.method(globalThis, 'fetch', async () => fakeGeminiResponse({ comment: 'x'.repeat(500) }));
    assert.equal(await generateJuryComment('key', baseInput), null);
  });

  const makeJuryDb = (options: {
    existingJury?: boolean;
    updates: unknown[];
    sets?: unknown[];
    rateLimit?: { windowStart: Date; count: number };
  }) =>
    makeFakeDb({
      resolveGet: () => ({ empty: true, docs: [] }),
      resolveDoc: (collectionName, docId) => {
        if (collectionName === 'submissions') {
          return {
            exists: true,
            data: () => ({
              userId: 'u1',
              challengeId: 'c1',
              pixels: drawing,
              resolution: 4,
              ...(options.existingJury ? { jury: { text: 'eski' } } : {}),
            }),
          };
        }
        if (collectionName === 'challenges') {
          return {
            exists: true,
            data: () => ({ title: 'Sevimli Canavarlar', description: 'Korkutma, güldür!' }),
          };
        }
        if (collectionName === 'aiRateLimits' && options.rateLimit) {
          return {
            exists: true,
            data: () => ({
              windowStart: fakeTimestamp(options.rateLimit!.windowStart),
              count: options.rateLimit!.count,
            }),
          };
        }
        void docId;
        return { exists: false };
      },
      onUpdate: (collectionName, docId, data) => options.updates.push([collectionName, docId, data]),
      onSet: (...args) => options.sets?.push(args),
    });

  test('yorum submission dokümanına jury alanı olarak yazılır', async (t: TestContext) => {
    mockFirebaseAdmin(t);
    const { attachJuryComment } = await import(`./index.ts?case=jury-attach-${Date.now()}`);

    t.mock.method(globalThis, 'fetch', async () => fakeGeminiResponse({ comment: 'Harika kalp!' }));

    const updates: unknown[] = [];
    await attachJuryComment(makeJuryDb({ updates }), 'sub-1', 'key', new Date('2026-03-01T10:00:00Z'));

    assert.equal(updates.length, 1);
    const [collection, id, data] = updates[0] as [string, string, { jury: { text: string } }];
    assert.equal(collection, 'submissions');
    assert.equal(id, 'sub-1');
    assert.equal(data.jury.text, 'Harika kalp!');
  });

  test('yorum zaten varsa tekrar üretilmez (idempotent)', async (t: TestContext) => {
    mockFirebaseAdmin(t);
    const { attachJuryComment } = await import(`./index.ts?case=jury-idem-${Date.now()}`);

    const fetchMock = t.mock.method(globalThis, 'fetch', async () => {
      throw new Error('çağrılmamalıydı');
    });

    const updates: unknown[] = [];
    await attachJuryComment(makeJuryDb({ existingJury: true, updates }), 'sub-1', 'key', new Date());

    assert.equal(updates.length, 0);
    assert.equal(fetchMock.mock.calls.length, 0);
  });

  test('saatlik kota dolmuşsa yorum üretilmez ve Gemini çağrılmaz', async (t: TestContext) => {
    mockFirebaseAdmin(t);
    const { attachJuryComment } = await import(`./index.ts?case=jury-quota-${Date.now()}`);

    const fetchMock = t.mock.method(globalThis, 'fetch', async () => {
      throw new Error('çağrılmamalıydı');
    });

    const now = new Date('2026-03-01T10:00:00Z');
    const updates: unknown[] = [];
    await attachJuryComment(
      makeJuryDb({
        updates,
        rateLimit: { windowStart: new Date(now.getTime() - 60_000), count: 6 },
      }),
      'sub-1',
      'key',
      now,
    );

    assert.equal(updates.length, 0);
    assert.equal(fetchMock.mock.calls.length, 0);
  });
});


describe('hesap silme', () => {
  const NOW = new Date('2026-03-01T12:00:00.000Z');
  const recentAuthTime = Math.floor(NOW.getTime() / 1000) - 30;

  const makeDeleteDb = (deleted: [string, string][]) =>
    makeFakeDb({
      resolveGet: (collectionName, calls) => {
        const whereCall = calls.find((call) => call[0] === 'where') as unknown[] | undefined;

        if (collectionName === 'submissions') {
          return { empty: false, docs: [{ id: 'sub-1', data: () => ({}) }] };
        }
        if (collectionName === 'votes') {
          // submissionId ile sorgu: bu çizime verilen oy; userId ile sorgu: kullanıcının verdiği oy
          return whereCall?.[1] === 'submissionId'
            ? { empty: false, docs: [{ id: 'vote-on-sub', data: () => ({}) }] }
            : { empty: false, docs: [{ id: 'vote-own', data: () => ({}) }] };
        }
        if (collectionName === 'users/u1/blocks') {
          return { empty: false, docs: [{ id: 'blocked-1', data: () => ({}) }] };
        }
        return { empty: true, docs: [] };
      },
      onDelete: (collectionName, docId) => deleted.push([collectionName, docId]),
    });

  test('kullanıcının çizimleri, oyları, engelleri ve profili silinir', async (t: TestContext) => {
    mockFirebaseAdmin(t);
    const { deleteUserData } = await import(`./index.ts?case=del-data-${Date.now()}`);

    const deleted: [string, string][] = [];
    await deleteUserData(makeDeleteDb(deleted), 'u1');

    assert.deepEqual(deleted.sort(), [
      ['submissions', 'sub-1'],
      ['users', 'u1'],
      ['users/u1/blocks', 'blocked-1'],
      ['votes', 'vote-on-sub'],
      ['votes', 'vote-own'],
    ]);
  });

  test('yakın zamanda giriş yapılmışsa veri ve auth kullanıcısı silinir', async (t: TestContext) => {
    mockFirebaseAdmin(t);
    const { handleDeleteMyAccount } = await import(`./index.ts?case=del-ok-${Date.now()}`);

    const deleted: [string, string][] = [];
    const deletedAuthUsers: string[] = [];

    const result = await handleDeleteMyAccount(
      makeDeleteDb(deleted),
      'u1',
      recentAuthTime,
      NOW,
      async (userId: string) => {
        deletedAuthUsers.push(userId);
      },
    );

    assert.deepEqual(result, { deleted: true });
    assert.deepEqual(deletedAuthUsers, ['u1']);
    assert.ok(deleted.length > 0);
  });

  test('eski veya bilinmeyen auth_time ile hiçbir şey silinmez', async (t: TestContext) => {
    mockFirebaseAdmin(t);
    const { handleDeleteMyAccount } = await import(`./index.ts?case=del-stale-${Date.now()}`);

    for (const authTime of [undefined, Math.floor(NOW.getTime() / 1000) - 3600]) {
      const deleted: [string, string][] = [];
      const deletedAuthUsers: string[] = [];

      await assert.rejects(
        () =>
          handleDeleteMyAccount(makeDeleteDb(deleted), 'u1', authTime, NOW, async (userId: string) => {
            deletedAuthUsers.push(userId);
          }),
        (error: { code: string }) => error.code === 'failed-precondition',
      );

      assert.equal(deleted.length, 0);
      assert.equal(deletedAuthUsers.length, 0);
    }
  });

  test('giriş yapmamış istek unauthenticated hatası alır', async (t: TestContext) => {
    mockFirebaseAdmin(t);
    const { deleteMyAccount } = await import(`./index.ts?case=del-unauth-${Date.now()}`);

    await assert.rejects(
      () => deleteMyAccount.__handler({ auth: undefined }),
      (error: { code: string }) => error.code === 'unauthenticated',
    );
  });
});


describe('push bildirimleri', () => {
  const TOKEN = 'ExponentPushToken[abc]';

  const makeUsersDb = (updates: unknown[]) =>
    makeFakeDb({
      resolveGet: (collectionName) =>
        collectionName === 'users'
          ? {
              empty: false,
              docs: [
                { id: 'u1', data: () => ({ pushToken: TOKEN }) },
                { id: 'u2', data: () => ({ pushToken: 'gecersiz' }) },
                { id: 'u3', data: () => ({}) },
              ],
            }
          : { empty: true, docs: [] },
      resolveDoc: (collectionName, docId) => {
        if (collectionName === 'users') {
          return { exists: true, data: () => ({ pushToken: TOKEN }) };
        }
        if (collectionName === 'submissions') {
          return { exists: true, data: () => ({ userId: 'winner' }) };
        }
        void docId;
        return { exists: false };
      },
      onUpdate: (...args) => updates.push(args),
    });

  test('notifyAllUsers yalnızca geçerli token\'lı kullanıcılara mesaj gönderir', async (t: TestContext) => {
    mockFirebaseAdmin(t);
    const { notifyAllUsers } = await import(`./index.ts?case=push-all-${Date.now()}`);

    const sent: unknown[][] = [];
    await notifyAllUsers(makeUsersDb([]), { title: 'T', body: 'B' }, async (messages: unknown[]) => {
      sent.push(messages);
      return [];
    });

    assert.equal(sent.length, 1);
    assert.equal(sent[0].length, 1);
    assert.equal((sent[0][0] as { to: string }).to, TOKEN);
  });

  test('kayıtsız cihaz token\'ı kullanıcı profilinden silinir', async (t: TestContext) => {
    mockFirebaseAdmin(t);
    const { notifyAllUsers } = await import(`./index.ts?case=push-clean-${Date.now()}`);

    const updates: unknown[] = [];
    await notifyAllUsers(makeUsersDb(updates), { title: 'T', body: 'B' }, async () => [TOKEN]);

    assert.equal(updates.length, 1);
    const [collection, docId, data] = updates[0] as [string, string, { pushToken: unknown }];
    assert.equal(collection, 'users');
    assert.equal(docId, 'u1');
    assert.deepEqual(data.pushToken, { __deleteField: true });
  });

  test('geçerli token yoksa hiç gönderim yapılmaz', async (t: TestContext) => {
    mockFirebaseAdmin(t);
    const { deliverPush } = await import(`./index.ts?case=push-none-${Date.now()}`);

    let called = false;
    await deliverPush(
      makeUsersDb([]),
      [{ userId: 'u', token: 'gecersiz' }],
      { title: 'T', body: 'B' },
      async () => {
        called = true;
        return [];
      },
    );

    assert.equal(called, false);
  });

  test('kazanana tebrik bildirimi gider', async (t: TestContext) => {
    mockFirebaseAdmin(t);
    const { notifyWinner } = await import(`./index.ts?case=push-win-${Date.now()}`);

    const sent: { to: string; title: string }[][] = [];
    await notifyWinner(makeUsersDb([]), 'sub-1', async (messages: { to: string; title: string }[]) => {
      sent.push(messages);
      return [];
    });

    assert.equal(sent.length, 1);
    assert.equal(sent[0][0].title, 'Tebrikler, şampiyonsun!');
  });
});
