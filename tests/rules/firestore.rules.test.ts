import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, afterEach, before, describe, test } from 'node:test';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

/**
 * Firestore Security Rules testleri. Gerçek kural dosyası (firestore.rules)
 * Firestore emülatöründe çalıştırılır:
 *
 *   npm run test:rules
 *
 * Bu testler, istemci kodu atlanıp doğrudan Firestore SDK'sıyla yazılsa bile
 * oylama/gönderim kısıtlarının sunucuda (kurallarda) korunduğunu kanıtlar.
 */

const OPEN = 'open-challenge';
const OTHER = 'other-challenge';
const ENDED = 'ended-challenge';
const COMPLETED = 'completed-challenge';

const HOUR = 60 * 60 * 1000;

let testEnv: RulesTestEnvironment;

const pixelsFor = (resolution: number): string[] =>
  Array.from({ length: resolution * resolution }, () => '#FDFBF7');

const challenge = (overrides: Record<string, unknown>) => ({
  title: 't',
  theme: 't',
  description: 'd',
  gridSize: 16,
  winnerSubmissionId: null,
  status: 'active',
  startsAt: Timestamp.fromMillis(Date.now() - HOUR),
  endsAt: Timestamp.fromMillis(Date.now() + HOUR),
  ...overrides,
});

const submissionPayload = (
  challengeId: string,
  userId: string,
  overrides: Record<string, unknown> = {},
) => ({
  userId,
  challengeId,
  pixels: pixelsFor(16),
  resolution: 16,
  voteCount: 0,
  createdAt: serverTimestamp(),
  ...overrides,
});

const votePayload = (
  challengeId: string,
  submissionId: string,
  userId: string,
  overrides: Record<string, unknown> = {},
) => ({
  submissionId,
  challengeId,
  userId,
  createdAt: serverTimestamp(),
  ...overrides,
});

const seed = async (): Promise<void> => {
  await testEnv.clearFirestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(doc(db, 'challenges', OPEN), challenge({}));
    await setDoc(doc(db, 'challenges', OTHER), challenge({}));
    await setDoc(
      doc(db, 'challenges', ENDED),
      challenge({
        startsAt: Timestamp.fromMillis(Date.now() - 3 * HOUR),
        endsAt: Timestamp.fromMillis(Date.now() - HOUR),
      }),
    );
    await setDoc(
      doc(db, 'challenges', COMPLETED),
      challenge({ status: 'completed' }),
    );

    // bob'un çizimleri (alice oy verecek)
    for (const challengeId of [OPEN, OTHER, ENDED]) {
      await setDoc(
        doc(db, 'submissions', `${challengeId}_bob`),
        submissionPayload(challengeId, 'bob', { createdAt: Timestamp.now() }),
      );
    }
    await setDoc(
      doc(db, 'submissions', `${OPEN}_alice`),
      submissionPayload(OPEN, 'alice', { createdAt: Timestamp.now() }),
    );
  });
};

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-pixel-art-rules',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

after(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

describe('submissions', () => {
  test('açık challenge için geçerli gönderi oluşturulabilir', async () => {
    await seed();
    const db = testEnv.authenticatedContext('carol').firestore();

    await assertSucceeds(
      setDoc(doc(db, 'submissions', `${OPEN}_carol`), submissionPayload(OPEN, 'carol')),
    );
  });

  test('32x32 gönderi de kabul edilir', async () => {
    await seed();
    const db = testEnv.authenticatedContext('carol').firestore();

    await assertSucceeds(
      setDoc(
        doc(db, 'submissions', `${OPEN}_carol`),
        submissionPayload(OPEN, 'carol', { resolution: 32, pixels: pixelsFor(32) }),
      ),
    );
  });

  test('giriş yapmamış kullanıcı gönderi oluşturamaz', async () => {
    await seed();
    const db = testEnv.unauthenticatedContext().firestore();

    await assertFails(
      setDoc(doc(db, 'submissions', `${OPEN}_carol`), submissionPayload(OPEN, 'carol')),
    );
  });

  test('doküman id deterministik değilse reddedilir (mükerrer gönderi yolu kapalı)', async () => {
    await seed();
    const db = testEnv.authenticatedContext('carol').firestore();

    await assertFails(
      setDoc(doc(db, 'submissions', 'rastgele-id'), submissionPayload(OPEN, 'carol')),
    );
  });

  test('aynı challenge için ikinci gönderi reddedilir', async () => {
    await seed();
    const db = testEnv.authenticatedContext('alice').firestore();

    // alice'in OPEN için gönderisi seed'de zaten var.
    await assertFails(
      setDoc(doc(db, 'submissions', `${OPEN}_alice`), submissionPayload(OPEN, 'alice')),
    );
  });

  test('başkası adına gönderi oluşturulamaz', async () => {
    await seed();
    const db = testEnv.authenticatedContext('carol').firestore();

    await assertFails(
      setDoc(doc(db, 'submissions', `${OPEN}_dave`), submissionPayload(OPEN, 'dave')),
    );
  });

  test('süresi dolmuş challenge için gönderi reddedilir', async () => {
    await seed();
    const db = testEnv.authenticatedContext('carol').firestore();

    await assertFails(
      setDoc(doc(db, 'submissions', `${ENDED}_carol`), submissionPayload(ENDED, 'carol')),
    );
  });

  test('tamamlanmış challenge için gönderi reddedilir', async () => {
    await seed();
    const db = testEnv.authenticatedContext('carol').firestore();

    await assertFails(
      setDoc(
        doc(db, 'submissions', `${COMPLETED}_carol`),
        submissionPayload(COMPLETED, 'carol'),
      ),
    );
  });

  test('var olmayan challenge için gönderi reddedilir', async () => {
    await seed();
    const db = testEnv.authenticatedContext('carol').firestore();

    await assertFails(
      setDoc(doc(db, 'submissions', 'yok_carol'), submissionPayload('yok', 'carol')),
    );
  });

  test('geçersiz ızgara boyutu reddedilir', async () => {
    await seed();
    const db = testEnv.authenticatedContext('carol').firestore();

    await assertFails(
      setDoc(
        doc(db, 'submissions', `${OPEN}_carol`),
        submissionPayload(OPEN, 'carol', { resolution: 24, pixels: pixelsFor(24) }),
      ),
    );
  });

  test('piksel sayısı çözünürlükle uyuşmuyorsa reddedilir', async () => {
    await seed();
    const db = testEnv.authenticatedContext('carol').firestore();

    await assertFails(
      setDoc(
        doc(db, 'submissions', `${OPEN}_carol`),
        submissionPayload(OPEN, 'carol', { pixels: pixelsFor(8) }),
      ),
    );
  });

  test("voteCount 0 dışında bir değerle başlayamaz", async () => {
    await seed();
    const db = testEnv.authenticatedContext('carol').firestore();

    await assertFails(
      setDoc(
        doc(db, 'submissions', `${OPEN}_carol`),
        submissionPayload(OPEN, 'carol', { voteCount: 500 }),
      ),
    );
  });

  test('fazladan alan içeren gönderi reddedilir', async () => {
    await seed();
    const db = testEnv.authenticatedContext('carol').firestore();

    await assertFails(
      setDoc(
        doc(db, 'submissions', `${OPEN}_carol`),
        submissionPayload(OPEN, 'carol', { isWinner: true }),
      ),
    );
  });

  test('time-lapse kaydı (moves) olan gönderi kabul edilir', async () => {
    await seed();
    const db = testEnv.authenticatedContext('carol').firestore();

    await assertSucceeds(
      setDoc(
        doc(db, 'submissions', `${OPEN}_carol`),
        submissionPayload(OPEN, 'carol', { moves: 'FF0000:0.1.2/00FF00:5' }),
      ),
    );
  });

  test('moves string değilse veya çok uzunsa reddedilir', async () => {
    await seed();
    const db = testEnv.authenticatedContext('carol').firestore();

    await assertFails(
      setDoc(
        doc(db, 'submissions', `${OPEN}_carol`),
        submissionPayload(OPEN, 'carol', { moves: ['FF0000:0'] }),
      ),
    );
    await assertFails(
      setDoc(
        doc(db, 'submissions', `${OPEN}_carol`),
        submissionPayload(OPEN, 'carol', { moves: 'A'.repeat(60001) }),
      ),
    );
  });

  test('gönderi güncellenemez (voteCount dahil)', async () => {
    await seed();
    const db = testEnv.authenticatedContext('bob').firestore();

    await assertFails(updateDoc(doc(db, 'submissions', `${OPEN}_bob`), { voteCount: 999 }));
  });

  test('sahibi, challenge açıkken kendi gönderisini silebilir', async () => {
    await seed();
    const db = testEnv.authenticatedContext('bob').firestore();

    await assertSucceeds(deleteDoc(doc(db, 'submissions', `${OPEN}_bob`)));
  });

  test('challenge bittikten sonra gönderi silinemez', async () => {
    await seed();
    const db = testEnv.authenticatedContext('bob').firestore();

    await assertFails(deleteDoc(doc(db, 'submissions', `${ENDED}_bob`)));
  });

  test('başkasının gönderisi silinemez', async () => {
    await seed();
    const db = testEnv.authenticatedContext('carol').firestore();

    await assertFails(deleteDoc(doc(db, 'submissions', `${OPEN}_bob`)));
  });

  test('giriş yapmış kullanıcı gönderileri okuyabilir, anonim okuyamaz', async () => {
    await seed();

    await assertSucceeds(
      getDoc(doc(testEnv.authenticatedContext('carol').firestore(), 'submissions', `${OPEN}_bob`)),
    );
    await assertFails(
      getDoc(doc(testEnv.unauthenticatedContext().firestore(), 'submissions', `${OPEN}_bob`)),
    );
  });
});

describe('votes', () => {
  test("başkasının çizimine oy verilebilir", async () => {
    await seed();
    const db = testEnv.authenticatedContext('alice').firestore();

    await assertSucceeds(
      setDoc(doc(db, 'votes', `${OPEN}_alice`), votePayload(OPEN, `${OPEN}_bob`, 'alice')),
    );
  });

  test('kendi çizimine oy verilemez', async () => {
    await seed();
    const db = testEnv.authenticatedContext('alice').firestore();

    await assertFails(
      setDoc(doc(db, 'votes', `${OPEN}_alice`), votePayload(OPEN, `${OPEN}_alice`, 'alice')),
    );
  });

  test('oy başka bir çizime taşınabilir (aynı doküman güncellenir)', async () => {
    await seed();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), 'submissions', `${OPEN}_dave`),
        submissionPayload(OPEN, 'dave', { createdAt: Timestamp.now() }),
      );
    });
    const db = testEnv.authenticatedContext('alice').firestore();

    await assertSucceeds(
      setDoc(doc(db, 'votes', `${OPEN}_alice`), votePayload(OPEN, `${OPEN}_bob`, 'alice')),
    );
    await assertSucceeds(
      setDoc(doc(db, 'votes', `${OPEN}_alice`), votePayload(OPEN, `${OPEN}_dave`, 'alice')),
    );
  });

  test('süresi dolmuş challenge için oy verilemez', async () => {
    await seed();
    const db = testEnv.authenticatedContext('alice').firestore();

    await assertFails(
      setDoc(doc(db, 'votes', `${ENDED}_alice`), votePayload(ENDED, `${ENDED}_bob`, 'alice')),
    );
  });

  test('tamamlanmış challenge için oy verilemez', async () => {
    await seed();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), 'submissions', `${COMPLETED}_bob`),
        submissionPayload(COMPLETED, 'bob', { createdAt: Timestamp.now() }),
      );
    });
    const db = testEnv.authenticatedContext('alice').firestore();

    await assertFails(
      setDoc(
        doc(db, 'votes', `${COMPLETED}_alice`),
        votePayload(COMPLETED, `${COMPLETED}_bob`, 'alice'),
      ),
    );
  });

  test('var olmayan çizime oy verilemez', async () => {
    await seed();
    const db = testEnv.authenticatedContext('alice').firestore();

    await assertFails(
      setDoc(doc(db, 'votes', `${OPEN}_alice`), votePayload(OPEN, 'hayali-cizim', 'alice')),
    );
  });

  test('başka bir challenge’ın çiziminine oy verilemez', async () => {
    await seed();
    const db = testEnv.authenticatedContext('alice').firestore();

    await assertFails(
      setDoc(doc(db, 'votes', `${OPEN}_alice`), votePayload(OPEN, `${OTHER}_bob`, 'alice')),
    );
  });

  test('oy dokümanı id formatı bozuksa reddedilir (ikinci oy yolu kapalı)', async () => {
    await seed();
    const db = testEnv.authenticatedContext('alice').firestore();

    await assertFails(
      setDoc(doc(db, 'votes', 'rastgele'), votePayload(OPEN, `${OPEN}_bob`, 'alice')),
    );
  });

  test('başkası adına oy kullanılamaz', async () => {
    await seed();
    const db = testEnv.authenticatedContext('alice').firestore();

    await assertFails(
      setDoc(doc(db, 'votes', `${OPEN}_carol`), votePayload(OPEN, `${OPEN}_bob`, 'carol')),
    );
  });

  test('fazladan alan içeren oy reddedilir', async () => {
    await seed();
    const db = testEnv.authenticatedContext('alice').firestore();

    await assertFails(
      setDoc(
        doc(db, 'votes', `${OPEN}_alice`),
        votePayload(OPEN, `${OPEN}_bob`, 'alice', { weight: 100 }),
      ),
    );
  });

  test('oy geri alınabilir ama yalnızca challenge açıkken', async () => {
    await seed();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'votes', `${OPEN}_alice`), votePayload(OPEN, `${OPEN}_bob`, 'alice', { createdAt: Timestamp.now() }));
      await setDoc(doc(db, 'votes', `${ENDED}_alice`), votePayload(ENDED, `${ENDED}_bob`, 'alice', { createdAt: Timestamp.now() }));
    });
    const db = testEnv.authenticatedContext('alice').firestore();

    await assertSucceeds(deleteDoc(doc(db, 'votes', `${OPEN}_alice`)));
    await assertFails(deleteDoc(doc(db, 'votes', `${ENDED}_alice`)));
  });

  test('kullanıcı yalnızca kendi oy dokümanını okuyabilir', async () => {
    await seed();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), 'votes', `${OPEN}_alice`),
        votePayload(OPEN, `${OPEN}_bob`, 'alice', { createdAt: Timestamp.now() }),
      );
    });

    await assertSucceeds(
      getDoc(doc(testEnv.authenticatedContext('alice').firestore(), 'votes', `${OPEN}_alice`)),
    );
    await assertFails(
      getDoc(doc(testEnv.authenticatedContext('carol').firestore(), 'votes', `${OPEN}_alice`)),
    );
  });
});

describe('challenges ve aiRateLimits', () => {
  test("istemci challenge yazamaz", async () => {
    await seed();
    const db = testEnv.authenticatedContext('alice').firestore();

    await assertFails(setDoc(doc(db, 'challenges', 'yeni'), challenge({})));
    await assertFails(updateDoc(doc(db, 'challenges', OPEN), { status: 'completed' }));
  });

  test('giriş yapmış kullanıcı challenge okuyabilir', async () => {
    await seed();

    await assertSucceeds(
      getDoc(doc(testEnv.authenticatedContext('alice').firestore(), 'challenges', OPEN)),
    );
  });

  test('aiRateLimits istemciye tamamen kapalı', async () => {
    await seed();
    const db = testEnv.authenticatedContext('alice').firestore();

    await assertFails(getDoc(doc(db, 'aiRateLimits', 'alice_inspiration')));
    await assertFails(setDoc(doc(db, 'aiRateLimits', 'alice_inspiration'), { count: 0 }));
  });
});

describe('reports', () => {
  const reportPayload = (overrides: Record<string, unknown> = {}) => ({
    submissionId: `${OPEN}_bob`,
    challengeId: OPEN,
    reportedUserId: 'bob',
    reporterId: 'alice',
    reason: 'inappropriate',
    createdAt: serverTimestamp(),
    ...overrides,
  });

  test('başkasının çizimi şikayet edilebilir', async () => {
    await seed();
    const db = testEnv.authenticatedContext('alice').firestore();

    await assertSucceeds(
      setDoc(doc(db, 'reports', `${OPEN}_bob_alice`), reportPayload()),
    );
  });

  test('kendi çizimini şikayet edemez', async () => {
    await seed();
    const db = testEnv.authenticatedContext('bob').firestore();

    await assertFails(
      setDoc(
        doc(db, 'reports', `${OPEN}_bob_bob`),
        reportPayload({ reporterId: 'bob' }),
      ),
    );
  });

  test('aynı çizimi ikinci kez şikayet edemez', async () => {
    await seed();
    const db = testEnv.authenticatedContext('alice').firestore();

    await assertSucceeds(
      setDoc(doc(db, 'reports', `${OPEN}_bob_alice`), reportPayload()),
    );
    await assertFails(
      setDoc(doc(db, 'reports', `${OPEN}_bob_alice`), reportPayload({ reason: 'spam' })),
    );
  });

  test('geçersiz neden, olmayan çizim, uyuşmayan sahip ve başkası adına rapor reddedilir', async () => {
    await seed();
    const db = testEnv.authenticatedContext('alice').firestore();

    await assertFails(
      setDoc(doc(db, 'reports', `${OPEN}_bob_alice`), reportPayload({ reason: 'sevmedim' })),
    );
    await assertFails(
      setDoc(
        doc(db, 'reports', 'hayali_alice'),
        reportPayload({ submissionId: 'hayali' }),
      ),
    );
    await assertFails(
      setDoc(
        doc(db, 'reports', `${OPEN}_bob_alice`),
        reportPayload({ reportedUserId: 'carol' }),
      ),
    );
    await assertFails(
      setDoc(
        doc(db, 'reports', `${OPEN}_bob_carol`),
        reportPayload({ reporterId: 'carol' }),
      ),
    );
  });

  test('istemci raporları okuyamaz, değiştiremez veya silemez', async () => {
    await seed();
    const db = testEnv.authenticatedContext('alice').firestore();

    await assertSucceeds(
      setDoc(doc(db, 'reports', `${OPEN}_bob_alice`), reportPayload()),
    );
    await assertFails(getDoc(doc(db, 'reports', `${OPEN}_bob_alice`)));
    await assertFails(updateDoc(doc(db, 'reports', `${OPEN}_bob_alice`), { reason: 'spam' }));
    await assertFails(deleteDoc(doc(db, 'reports', `${OPEN}_bob_alice`)));
  });
});

describe('users: push token', () => {
  const seedUser = async () => {
    await seed();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users', 'alice'), {
        email: 'alice@example.com',
        createdAt: Timestamp.now(),
        stats: { streak: 3, badges: ['first_entry'] },
      });
    });
  };

  test('kullanıcı kendi push token\'ını yazıp silebilir', async () => {
    await seedUser();
    const db = testEnv.authenticatedContext('alice').firestore();
    const ref = doc(db, 'users', 'alice');

    await assertSucceeds(updateDoc(ref, { pushToken: 'ExponentPushToken[abc]' }));
    await assertSucceeds(updateDoc(ref, { pushToken: deleteField() }));
  });

  test('istatistik (stats) ve diğer alanlar istemciden değiştirilemez', async () => {
    await seedUser();
    const db = testEnv.authenticatedContext('alice').firestore();
    const ref = doc(db, 'users', 'alice');

    await assertFails(updateDoc(ref, { 'stats.streak': 999 }));
    await assertFails(updateDoc(ref, { stats: { streak: 999 } }));
    await assertFails(updateDoc(ref, { email: 'x@y.z' }));
    await assertFails(updateDoc(ref, { pushToken: 'ok', email: 'x@y.z' }));
  });

  test('başkasının push token\'ı yazılamaz, token string değilse veya çok uzunsa reddedilir', async () => {
    await seedUser();

    await assertFails(
      updateDoc(doc(testEnv.authenticatedContext('bob').firestore(), 'users', 'alice'), {
        pushToken: 'x',
      }),
    );

    const db = testEnv.authenticatedContext('alice').firestore();
    await assertFails(updateDoc(doc(db, 'users', 'alice'), { pushToken: 123 }));
    await assertFails(updateDoc(doc(db, 'users', 'alice'), { pushToken: 'a'.repeat(201) }));
  });

  test('kullanıcı profili silinemez', async () => {
    await seedUser();
    const db = testEnv.authenticatedContext('alice').firestore();

    await assertFails(deleteDoc(doc(db, 'users', 'alice')));
  });
});

describe('blocks', () => {
  test('kullanıcı başkasını engelleyebilir, okuyabilir ve engeli kaldırabilir', async () => {
    await seed();
    const db = testEnv.authenticatedContext('alice').firestore();
    const ref = doc(db, 'users', 'alice', 'blocks', 'bob');

    await assertSucceeds(setDoc(ref, { createdAt: serverTimestamp() }));
    await assertSucceeds(getDoc(ref));
    await assertSucceeds(deleteDoc(ref));
  });

  test('kendini engelleyemez ve başkası adına engel ekleyemez', async () => {
    await seed();
    const db = testEnv.authenticatedContext('alice').firestore();

    await assertFails(
      setDoc(doc(db, 'users', 'alice', 'blocks', 'alice'), { createdAt: serverTimestamp() }),
    );
    await assertFails(
      setDoc(doc(db, 'users', 'bob', 'blocks', 'carol'), { createdAt: serverTimestamp() }),
    );
  });

  test('başkasının engel listesi okunamaz ve fazladan alan eklenemez', async () => {
    await seed();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users', 'bob', 'blocks', 'carol'), {
        createdAt: Timestamp.now(),
      });
    });
    const db = testEnv.authenticatedContext('alice').firestore();

    await assertFails(getDoc(doc(db, 'users', 'bob', 'blocks', 'carol')));
    await assertFails(
      setDoc(doc(db, 'users', 'alice', 'blocks', 'dave'), {
        createdAt: serverTimestamp(),
        note: 'x',
      }),
    );
  });
});

test('kural dosyası emülatörde yüklendi', () => {
  assert.ok(testEnv);
});
