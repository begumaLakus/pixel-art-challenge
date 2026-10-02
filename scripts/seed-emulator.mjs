/**
 * Yerel emülatörleri örnek veriyle doldurur (gerçek Firebase projesine
 * dokunmaz). Önce `npm run emulators`, sonra `npm run seed` çalıştır.
 *
 *   - 1 aktif challenge (5 saat kalmış) + 5 örnek gönderi ve oylar
 *   - 3 tamamlanmış challenge, her birinin kazananıyla
 *   - Giriş yapabileceğin bir test kullanıcısı (aşağıdaki sabitler)
 *
 * Test kullanıcısı yalnızca emülatörde vardır; bu bilgiler hiçbir canlı
 * hesaba ait değildir.
 */
process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8089';
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';

const PROJECT_ID = 'demo-pixel-art';
const TEST_EMAIL = 'tester@pixel.test';
const TEST_PASSWORD = 'pixel-test-123';

const { initializeApp } = await import('firebase-admin/app');
const { getAuth } = await import('firebase-admin/auth');
const { Timestamp, getFirestore } = await import('firebase-admin/firestore');

initializeApp({ projectId: PROJECT_ID });

const db = getFirestore();
const auth = getAuth();

const BG = '#FDFBF7';

const PALETTE = {
  '.': BG,
  K: '#151515',
  R: '#FF5C7A',
  G: '#1E7F4A',
  Y: '#FFD21F',
  W: '#FFFFFF',
  B: '#3B82F6',
  P: '#8B5CF6',
  O: '#FF8A3D',
  L: '#C6F432',
};

const SPRITES = {
  heart: [
    '..RR.RR.',
    '.RRRRRRR',
    '.RRWRRRR',
    '.RRRRRRR',
    '..RRRRR.',
    '...RRR..',
    '....R...',
    '........',
  ],
  tulip: [
    '.R.R.R..',
    '.RRRRR..',
    '.RRRRR..',
    '..RRR...',
    '...G....',
    '.GGG.G..',
    '...GGG..',
    '...G....',
  ],
  invader: [
    '..P..P..',
    '...PP...',
    '..PPPP..',
    '.PP.PP.P',
    '.PPPPPPP',
    '.P.PP.P.',
    '.P....P.',
    '..P..P..',
  ],
  mushroom: [
    '..RRRR..',
    '.RRWWRR.',
    'RRRWWRRR',
    'RWWRRWWR',
    'RRRRRRRR',
    '..WWWW..',
    '..WKKW..',
    '..WWWW..',
  ],
  star: [
    '...Y....',
    '...Y....',
    'YYYYYYY.',
    '.YYYYY..',
    '..YYY...',
    '.YY.YY..',
    '.Y...Y..',
    '........',
  ],
  ghost: [
    '..WWWW..',
    '.WWWWWW.',
    'WKKWWKKW',
    'WKKWWKKW',
    'WWWWWWWW',
    'WWWWWWWW',
    'WW.WW.WW',
    'W..WW..W',
  ],
};

/** 8x8 sprite'ı 16x16 ızgaraya 2x büyüterek düz renk dizisine çevirir. */
const toPixels = (rows) => {
  const out = [];
  for (const row of rows) {
    const scaled = [...row].flatMap((cell) => {
      const color = PALETTE[cell] ?? BG;
      return [color, color];
    });
    out.push(scaled, scaled);
  }
  return out.flat();
};

/** Her pikselden bir satır = bir adım olacak şekilde time-lapse kaydı üretir. */
const toMoves = (pixels) => {
  const steps = [];

  for (let row = 0; row < 16; row += 1) {
    const groups = new Map();

    for (let column = 0; column < 16; column += 1) {
      const color = pixels[row * 16 + column];

      if (color === BG) continue;

      groups.set(color, [...(groups.get(color) ?? []), row * 16 + column]);
    }

    if (groups.size > 0) {
      steps.push(
        [...groups]
          .map(([color, indices]) => `${color.slice(1)}:${indices.join('.')}`)
          .join(';'),
      );
    }
  }

  return steps.join('/');
};

const JURY = {
  invader: 'Sevimli bir uzaylı! Gözlerine bir piksel parlaklık ekle.',
  ghost: 'Utangaç bir hayalet gibi duruyor, kenarlara bir gölge deneyebilirsin.',
  mushroom: 'Benekleri çok tatlı, sapı bir tık uzatırsan daha da güzel olur.',
  star: 'Parlak bir yıldız! Köşelerini simetrik yaparsan çok net okunur.',
  heart: 'Temiz ve okunaklı bir kalp, renk dengesi harika.',
};

const hoursFromNow = (hours) =>
  Timestamp.fromMillis(Date.now() + hours * 60 * 60 * 1000);

const CHALLENGES = [
  {
    id: 'seed-active',
    title: 'Sevimli Canavarlar',
    theme: 'sevimli_canavarlar',
    description:
      'Yatağın altındaki o korkunç ama aslında sevilmek isteyen tatlı canavar! Korkutma, güldür!',
    status: 'active',
    palette: ['#151515', '#7E2553', '#FF004D', '#FFA300', '#FFEC27', '#FFCCAA', '#FFF1E8'],
    startsAt: hoursFromNow(-19),
    endsAt: hoursFromNow(5),
    winnerSubmissionId: null,
    completedAt: null,
    entries: [
      ['elif', 'invader', 5],
      ['mert', 'ghost', 3],
      ['zeynep', 'mushroom', 2],
      ['can', 'star', 1],
      ['deniz', 'heart', 0],
    ],
  },
  {
    id: 'seed-done-1',
    title: 'Masalsı Doğa',
    theme: 'masalsi_doga',
    description: 'Dans eden mantarlar ve alev atan dondurmalı dağlar.',
    status: 'completed',
    startsAt: hoursFromNow(-48),
    endsAt: hoursFromNow(-24),
    completedAt: hoursFromNow(-24),
    entries: [
      ['elif', 'mushroom', 9],
      ['mert', 'tulip', 4],
      ['can', 'heart', 2],
    ],
  },
  {
    id: 'seed-done-2',
    title: 'Perili Gece',
    theme: 'perili_gece',
    description: 'Kahvesini yudumlayan hayalet ve dans eden iskeletler.',
    status: 'completed',
    startsAt: hoursFromNow(-72),
    endsAt: hoursFromNow(-48),
    completedAt: hoursFromNow(-48),
    entries: [
      ['zeynep', 'ghost', 7],
      ['deniz', 'star', 3],
    ],
  },
  {
    id: 'seed-done-3',
    title: 'Nostalji Atari',
    theme: 'nostalji_atari',
    description: "90'ların atari salonlarına geri dönüş.",
    status: 'completed',
    startsAt: hoursFromNow(-96),
    endsAt: hoursFromNow(-72),
    completedAt: hoursFromNow(-72),
    entries: [
      ['mert', 'invader', 6],
      ['elif', 'heart', 5],
      ['can', 'star', 1],
    ],
  },
];

// --- Auth: test kullanıcısı
let testUser;
try {
  testUser = await auth.getUserByEmail(TEST_EMAIL);
} catch {
  testUser = await auth.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    emailVerified: true,
  });
}

// Test kullanıcısına örnek seri ve rozetler (normalde Cloud Function yazar).
await db.collection('users').doc(testUser.uid).set({
  email: TEST_EMAIL,
  createdAt: Timestamp.now(),
  stats: {
    streak: 3,
    bestStreak: 3,
    entries: 5,
    wins: 1,
    lastChallengeStartsAtMs: Date.now() - 19 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000,
    badges: ['first_entry', 'streak_3', 'champion'],
  },
});

// --- Firestore: challenge + gönderi + oy
const batch = db.batch();
let submissionCount = 0;

for (const challenge of CHALLENGES) {
  const { entries, id, ...fields } = challenge;

  let winnerId = null;
  let winnerVotes = -1;

  entries.forEach(([author, sprite, votes], index) => {
    const userId = `seed-${author}`;
    const submissionId = `${id}_${userId}`;

    batch.set(db.collection('submissions').doc(submissionId), {
      userId,
      challengeId: id,
      pixels: toPixels(SPRITES[sprite]),
      moves: toMoves(toPixels(SPRITES[sprite])),
      ...(JURY[sprite] ? { jury: { text: JURY[sprite], createdAt: Timestamp.now() } } : {}),
      resolution: 16,
      voteCount: votes,
      createdAt: Timestamp.fromMillis(
        challenge.startsAt.toMillis() + (index + 1) * 60 * 60 * 1000,
      ),
    });

    for (let voter = 0; voter < votes; voter += 1) {
      const voterId = `seed-voter-${voter}`;
      batch.set(db.collection('votes').doc(`${id}_${voterId}_${author}`), {
        submissionId,
        challengeId: id,
        userId: voterId,
        createdAt: Timestamp.now(),
      });
    }

    if (votes > winnerVotes) {
      winnerVotes = votes;
      winnerId = submissionId;
    }
    submissionCount += 1;
  });

  batch.set(db.collection('challenges').doc(id), {
    ...fields,
    gridSize: 16,
    createdAt: challenge.startsAt,
    winnerSubmissionId: fields.status === 'completed' ? winnerId : null,
    completedAt: fields.completedAt ?? null,
  });
}

await batch.commit();

console.log(
  `Hazır: ${CHALLENGES.length} challenge, ${submissionCount} gönderi.\n` +
    `Test girişi -> e-posta: ${TEST_EMAIL}  şifre: ${TEST_PASSWORD}`,
);
