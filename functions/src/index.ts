import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import {
  FieldValue,
  Firestore,
  getFirestore,
  Timestamp,
} from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import {
  onDocumentCreated,
  onDocumentWritten,
} from 'firebase-functions/v2/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import {
  buildMessages,
  isExpoPushToken,
  sendPushMessages,
  type PushContent,
} from './push.ts';
import {
  MIN_FILLED_CELLS,
  buildJuryPrompt,
  describePixels,
  normalizeJuryComment,
} from './jury.ts';
import {
  applyParticipation,
  applyPopularity,
  applyWin,
  readStats,
  type UserStats,
} from './stats.ts';

initializeApp();

const db = getFirestore();

interface ChallengeDoc {
  title: string;
  theme: string;
  description: string;
  status: 'active' | 'completed';
  startsAt: Timestamp;
  endsAt: Timestamp;
  winnerSubmissionId: string | null;
  createdAt: Timestamp;
  completedAt: Timestamp | null;
  gridSize: number;
  palette?: string[];
}

interface VoteDoc {
  userId: string;
  challengeId: string;
  submissionId: string;
}

export const THEMES = [
  {
    theme: 'uzay_macerasi',
    title: 'Uzay Macerası',
    description:
      'Uzayda kaybolan astronot kedi mi olur yoksa yürüyen pizza gezegeni mi? Galaksinin en çılgın pikselini fırlat! 🚀👽👾',
  },
  {
    theme: 'cilgin_canlilar',
    title: 'Çılgın Canlılar',
    description:
      'Kahve bağımlısı bir koala ya da kaslı bir tavuk! Doğanın en sevimli ama bir o kadar saçma canlısını çiziyoruz. 🐱🐰🐼',
  },
  {
    theme: 'masalsi_doga',
    title: 'Masalsı Doğa',
    description:
      'Alev atan dondurmalı dağlar mı yoksa dans eden mantarlar mı? Doğanın şirazesini biraz kaydırma vakti! 🌿🍄🌸',
  },
  {
    theme: 'gece_acikmalari',
    title: 'Gece Acıkmaları',
    description:
      "Gece saat 3'te buzdolabını açtığında sana bakan o leziz dilim! Acıktıran, ağız sulandıran pikseller gelsin. 🍕🍟🍔",
  },
  {
    theme: 'buyulu_dunyam',
    title: 'Büyülü Dünyam',
    description:
      'Ejderhanın sırtında çay içen büyücü! Fantastik dünyaların kapısını arala, hayal gücünü serbest bırak. 🧙‍♂️🐉🦄',
  },
  {
    theme: 'nostalji_atari',
    title: 'Nostalji Atari',
    description:
      "90'ların atari salonlarına geri dönüyoruz! Kaset üfleme günlerinin hatırına en nostaljik pikselini döktür. 🕹️🎮👾",
  },
  {
    theme: 'gelecegin_sehri',
    title: 'Geleceğin Şehri',
    description:
      'Neon ışıklar, uçan arabalar ve bilgisayar korsanı kediler! Geleceğin karanlık ama havalı dünyasını çiz. 🤖🕶️⚡',
  },
  {
    theme: 'derin_okyanus',
    title: 'Derin Okyanus',
    description:
      'Gözlük takmış bir köpekbalığı ya da denizaltında parti veren ahtapot! Okyanusun derinliklerine dalıyoruz. 🐙🦭🌊',
  },
  {
    theme: 'sevimli_canavarlar',
    title: 'Sevimli Canavarlar',
    description:
      'Yatağın altındaki o korkunç ama aslında sevilmek isteyen tatlı canavar! Korkutma, güldür! 👹👾🎃',
  },
  {
    theme: 'cilgin_araclar',
    title: 'Çılgın Araçlar',
    description:
      'Uçan kamyonet, roket motorlu bisiklet ya da dondurma arabası! Tekerleği yeniden icat etme vakti. 🏎️🚀🛵',
  },
  {
    theme: 'perili_gece',
    title: 'Perili Gece',
    description:
      'Kahvesini yudumlayan hayalet ve dans eden iskeletler! Gece yarısı perili ev partisine davetlisin. 👻💀🕯️',
  },
  {
    theme: 'sira_disi_meslekler',
    title: 'Sıra Dışı Meslekler',
    description:
      'Piksel dünyasının çılgın bilim insanı, ninja aşçısı ya da uzaylı polisi! Mesleğini piksellerle icra et. 👨‍🔬🕵️‍♂️👩‍🍳',
  },
];

export const CHALLENGE_DURATION_MS = 24 * 60 * 60 * 1000;

// Yeni oluşturulan challenge'lar için varsayılan grid boyutu. İstemci
// tarafı (usePixelEditor) DEFAULT_RESOLUTION olarak aynı değeri kullanır;
// challenge dokümanının Challenge tipiyle (gridSize: number, zorunlu alan)
// tutarlı kalması için burada da açıkça yazılıyor.
export const DEFAULT_GRID_SIZE = 16;

/**
 * "Günün paleti": her challenge sınırlı sayıda renkle çizilir (yaratıcı
 * kısıt). Her palet bir koyu ve bir açık renk içerir ki her tema çizilebilsin.
 * Palet temanın adından deterministik seçilir; AI'nin ürettiği temalar da
 * bir palet alır ve AI/ağ erişimine bağlı değildir.
 */
export const PALETTES: readonly (readonly string[])[] = [
  ['#151515', '#1D2B53', '#7E2553', '#29ADFF', '#FFEC27', '#FFF1E8'],
  ['#151515', '#FF77A8', '#FFCCAA', '#FFEC27', '#29ADFF', '#00E436', '#FFF1E8'],
  ['#151515', '#008751', '#00E436', '#AB5236', '#FFCCAA', '#FFEC27', '#FFF1E8'],
  ['#151515', '#7E2553', '#FF004D', '#FFA300', '#FFEC27', '#FFCCAA', '#FFF1E8'],
  ['#151515', '#1D2B53', '#29ADFF', '#00E436', '#83769C', '#FFF1E8'],
  ['#151515', '#5F574F', '#C2C3C7', '#FFF1E8', '#FF004D', '#29ADFF'],
];

export const pickPalette = (theme: string): string[] => {
  let hash = 0;

  for (let index = 0; index < theme.length; index += 1) {
    hash = (hash * 31 + theme.charCodeAt(index)) % 997;
  }

  return [...PALETTES[hash % PALETTES.length]];
};

/**
 * AI (Gemini) tarafından üretilen ya da sabit listeden seçilen bir temanın
 * ortak şekli. `THEMES` dizisindeki her eleman da bu şekle uyar; bu sayede
 * `runChallengeManagementCycle` iki kaynağı da (AI / sabit liste) aynı tipte
 * ele alabiliyor.
 */
export interface ThemeSuggestion {
  theme: string;
  title: string;
  description: string;
}

// Gemini'ye tema ürettirirken kullanılan model ve zaman aşımı süresi.
// `manageChallenges` her dakika çalıştığı için (bkz. aşağısı)
// timeout kısa tutuluyor: AI yavaş/yanıtsız kalırsa döngü uzun süre
// bloklanmadan sabit listeye düşmeli.
const GEMINI_MODEL = 'gemini-3.7-flash';
const GEMINI_TIMEOUT_MS = 8000;

// API anahtarı sadece sunucu (Cloud Functions) tarafında, Firebase Secret
// Manager üzerinden tutulur — istemci (mobil uygulama) tarafına hiçbir
// şekilde geçmez. Değeri `firebase functions:secrets:set GEMINI_API_KEY`
// ile ayarlanır; `manageChallenges` fonksiyonu `secrets: [GEMINI_API_KEY]`
// ile bu secret'a abone olur.
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

const THEME_SLUG_PATTERN = /^[a-z0-9]+(_[a-z0-9]+)*$/;

/**
 * Gemini'den dönen JSON'ın beklenen şekle uyup uymadığını doğrular.
 * Model `responseSchema` ile kısıtlansa da (bkz. `generateThemeWithAI`)
 * dönen alanların içeriği (boş string, aşırı uzun metin, geçersiz slug
 * formatı) yine de kontrol edilmeden Firestore'a yazılmamalı.
 */
const isValidThemeSuggestion = (value: unknown): value is ThemeSuggestion => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.theme === 'string' &&
    THEME_SLUG_PATTERN.test(candidate.theme) &&
    typeof candidate.title === 'string' &&
    candidate.title.trim().length > 0 &&
    candidate.title.length <= 60 &&
    typeof candidate.description === 'string' &&
    candidate.description.trim().length > 0 &&
    candidate.description.length <= 300
  );
};

const buildThemePrompt = (previousTheme: string | null): string => {
  const exampleList = THEMES.slice(0, 4)
    .map((item) => `- ${item.theme}: "${item.title}" — ${item.description}`)
    .join('\n');

  return `Sen "Pixel Art Challenge" adlı bir piksel sanat uygulaması için günlük yarışma teması üreten bir asistansın.
Kullanıcılar bir grid üzerinde bu temaya uygun piksel art çizip birbirleriyle yarışıyor.

Ton: eğlenceli, esprili, enerjik, Türkçe. Aşağıdaki örneklerle aynı tarzda ama TAMAMEN ÖZGÜN bir tema üret (örnekleri tekrarlama):
${exampleList}

Kurallar:
- "theme": küçük harf, sadece harf/rakam/alt çizgi (snake_case), 2-4 kelime, örn. "kayip_robotlar"
- "title": kısa ve çarpıcı başlık (en fazla 6-7 kelime)
- "description": 1-2 cümle, 2-3 emoji içersin, çizilecek şeyi somutlaştırsın (en fazla 220 karakter)
${previousTheme ? `- Önceki tema "${previousTheme}" idi; ona benzemeyen, tamamen farklı bir tema üret.` : ''}

Sadece istenen JSON şemasına uygun, özgün ve yeni bir tema üret.`;
};

/**
 * Sabit listeden, önceki temayı hariç tutarak rastgele bir tema seçer.
 * AI üretimi tamamen devre dışı kalsa bile (API key yok, timeout, ağ
 * hatası, geçersiz JSON) challenge döngüsü bu fonksiyon sayesinde asla
 * kesintiye uğramaz — önceki davranışla birebir aynı, sadece ayrı bir
 * fonksiyona çıkarıldı (fallback).
 */
export const pickFallbackTheme = (previousTheme: string | null): ThemeSuggestion => {
  const availableThemes = THEMES.filter((item) => item.theme !== previousTheme);

  return availableThemes[Math.floor(Math.random() * availableThemes.length)];
};

// Gemini responseSchema formatında (JSON Schema alt kümesi) bir şema.
type GeminiSchema = Record<string, unknown>;

/**
 * Gemini'nin `generateContent` REST endpoint'ine JSON-şema kısıtlı bir
 * istek atan düşük seviyeli yardımcı. Hem tema üretimi (`generateThemeWithAI`)
 * hem de yaratıcı ilham önerisi (`generateCreativeInspiration`) bunu
 * kullanıyor — ikisi de aynı ağ/timeout/parse mekaniğine ihtiyaç duyuyor,
 * sadece prompt ve beklenen şekil farklı.
 *
 * `apiKey` tanımlı değilse ağa hiç çıkmadan `null` döner. Herhangi bir
 * hatada da (timeout, ağ hatası, HTTP hatası, beklenmeyen yanıt şekli,
 * geçersiz JSON) throw ETMEZ — sadece `null` döner. Dönen değerin
 * BEKLENEN alan şekline uyup uymadığını doğrulamak çağıran tarafın işi
 * (her çağıran kendi domain kurallarını bilir — örn. tema slug formatı).
 */
const callGeminiJSON = async (
  apiKey: string | undefined,
  prompt: string,
  schema: GeminiSchema,
  timeoutMs: number,
): Promise<unknown | null> => {
  if (!apiKey) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 1,
            responseMimeType: 'application/json',
            responseSchema: schema,
          },
        }),
      },
    );

    if (!response.ok) {
      console.error('Gemini isteği HTTP hatası:', response.status, await response.text());
      return null;
    }

    const payload = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error('Gemini yanıtında beklenen metin alanı yok:', JSON.stringify(payload));
      return null;
    }

    return JSON.parse(text) as unknown;
  } catch (error) {
    console.error('Gemini isteği başarısız:', error);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
};

const THEME_RESPONSE_SCHEMA: GeminiSchema = {
  type: 'object',
  properties: {
    theme: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
  },
  required: ['theme', 'title', 'description'],
};

/**
 * Gemini'ye özgün bir tema (başlık + açıklama) ürettirir.
 *
 * `callGeminiJSON` zaten hiçbir zaman throw etmiyor (ağ/timeout/HTTP/parse
 * hatalarında `null` döner); burada ek olarak tema özelinde iki kontrol
 * daha yapılıyor: dönen şeklin geçerliliği (`isValidThemeSuggestion`) ve
 * önceki temanın birebir tekrarı. İkisinden biri başarısız olursa da
 * `null` dönüyor. Çağıran taraf (`runChallengeManagementCycle`) bunu
 * "sabit listeye düş" sinyali olarak kullanır; sistem hiçbir zaman AI
 * servisine bağımlı hale gelmez (fallback garantisi).
 */
export const generateThemeWithAI = async (
  apiKey: string | undefined,
  previousTheme: string | null,
): Promise<ThemeSuggestion | null> => {
  const parsed = await callGeminiJSON(
    apiKey,
    buildThemePrompt(previousTheme),
    THEME_RESPONSE_SCHEMA,
    GEMINI_TIMEOUT_MS,
  );

  if (!isValidThemeSuggestion(parsed)) {
    if (parsed !== null) {
      console.error('Gemini geçersiz formatta tema döndürdü:', JSON.stringify(parsed));
    }
    return null;
  }

  if (parsed.theme === previousTheme) {
    console.warn('Gemini önceki temayı tekrar önerdi, sabit listeye düşülüyor.');
    return null;
  }

  return parsed;
};

/**
 * Kazanan seçiminin tek kuralı: en çok oy alan çizim kazanır; eşitlikte
 * önce gönderilen (en erken `createdAt`) kazanır; o da eşitse doküman id'si
 * sözlük sırasına göre belirler. Böylece sonuç her çalıştırmada aynıdır.
 */
export interface WinnerCandidate {
  id: string;
  votes: number;
  createdAtMs: number;
}

export const selectWinner = (
  candidates: WinnerCandidate[],
): string | null => {
  if (candidates.length === 0) {
    return null;
  }

  return [...candidates].sort(
    (a, b) =>
      b.votes - a.votes ||
      a.createdAtMs - b.createdAtMs ||
      a.id.localeCompare(b.id),
  )[0].id;
};

/**
 * Bir challenge'ın kazananını `votes` koleksiyonunu doğrudan sayarak bulur.
 * Silinmiş çizimlere ait artık oylar adaylar arasında olmadığı için yok
 * sayılır.
 */
export const determineWinnerSubmissionId = async (
  db: Pick<Firestore, 'collection'>,
  challengeId: string,
): Promise<string | null> => {
  const [submissionsSnapshot, votesSnapshot] = await Promise.all([
    db.collection('submissions').where('challengeId', '==', challengeId).get(),
    db.collection('votes').where('challengeId', '==', challengeId).get(),
  ]);

  const tally = new Map<string, number>();

  for (const voteDocument of votesSnapshot.docs) {
    const { submissionId } = voteDocument.data() as VoteDoc;
    tally.set(submissionId, (tally.get(submissionId) ?? 0) + 1);
  }

  return selectWinner(
    submissionsSnapshot.docs.map((submissionDocument) => {
      const data = submissionDocument.data() as {
        createdAt?: { toDate: () => Date };
      };

      return {
        id: submissionDocument.id,
        votes: tally.get(submissionDocument.id) ?? 0,
        createdAtMs: data.createdAt?.toDate().getTime() ?? Number.MAX_SAFE_INTEGER,
      };
    }),
  );
};

/**
 * Otonom challenge yaşam döngüsünün asıl mantığı. Test edilebilirlik için
 * `db`, `now` ve `apiKey` parametre olarak enjekte edilir; `manageChallenges`
 * scheduler'ı bu fonksiyonu gerçek `db`/`Date`/secret değeriyle çağırır.
 * `apiKey` verilmezse (örn. testlerde) `generateThemeWithAI` hiç ağa
 * çıkmadan `null` döner ve davranış AI eklenmeden önceki haliyle birebir
 * aynı kalır.
 */
export const runChallengeManagementCycle = async (
  db: Pick<Firestore, 'collection'>,
  now: Date,
  apiKey?: string,
): Promise<void> => {
  const nowTimestamp = Timestamp.fromDate(now);

  try {
    /*
     * 1. Şu anda aktif challenge var mı?
     */
    const activeSnapshot = await db
      .collection('challenges')
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (!activeSnapshot.empty) {
      const activeChallenge = activeSnapshot.docs[0];
      const data = activeChallenge.data() as ChallengeDoc;

      const endsAt = data.endsAt.toDate();

      /*
       * Challenge'ın süresi henüz dolmadıysa
       * yeni challenge oluşturma.
       */
      if (endsAt > now) {
        console.log(
          'Aktif challenge devam ediyor:',
          activeChallenge.id,
        );

        return;
      }

      /*
       * 2. Challenge'ın süresi doldu. Kazananı, `submissions.voteCount`
       * alanına (tetikleyiciyle asenkron güncelleniyor) güvenmeden, doğrudan
       * `votes` koleksiyonunu sayarak belirle.
       */
      const winnerSubmissionId = await determineWinnerSubmissionId(
        db,
        activeChallenge.id,
      );

      /*
       * 3. Challenge'ı tamamla ve kazananı kaydet.
       */
      await activeChallenge.ref.update({
        status: 'completed',
        completedAt: nowTimestamp,
        winnerSubmissionId,
      });

      console.log(
        'Challenge tamamlandı:',
        activeChallenge.id,
        'Kazanan:',
        winnerSubmissionId ?? 'katılım olmadı',
      );

      if (winnerSubmissionId) {
        // Rozet/istatistik hatası yeni challenge'ın başlamasını engellememeli.
        try {
          await recordWin(db, winnerSubmissionId);
        } catch (statsError) {
          console.error('Kazanan istatistiği yazılamadı:', statsError);
        }

        try {
          await notifyWinner(db, winnerSubmissionId);
        } catch (pushError) {
          console.error('Kazanan bildirimi gönderilemedi:', pushError);
        }
      }
    }

    /*
     * 4. En son oluşturulan challenge'ın temasını bul.
     * Aynı temanın arka arkaya gelmesini engelliyoruz.
     */
    const latestSnapshot = await db
      .collection('challenges')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    const previousTheme = latestSnapshot.empty
      ? null
      : (
          latestSnapshot.docs[0].data() as ChallengeDoc
        ).theme;

    /*
     * 5. Yeni tema seç: önce Gemini'den özgün bir tema üretmeyi dene;
     * herhangi bir sebeple başarısız olursa (API key yok, timeout, ağ
     * hatası, geçersiz JSON, önceki temanın tekrarı) sabit listeye düş.
     * `generateThemeWithAI` hiçbir zaman throw etmediği için döngü
     * AI'nin durumundan tamamen bağımsız olarak her zaman devam eder.
     */
    const aiTheme = await generateThemeWithAI(apiKey, previousTheme);
    const selectedTheme = aiTheme ?? pickFallbackTheme(previousTheme);

    console.log(
      aiTheme
        ? 'Tema Gemini tarafından üretildi:'
        : 'Sabit listeden tema seçildi (fallback):',
      selectedTheme.theme,
    );

    const startsAt = now;
    const endsAt = new Date(
      now.getTime() + CHALLENGE_DURATION_MS,
    );

    /*
     * 6. Yeni challenge oluştur.
     */
    const challengeRef = await db
      .collection('challenges')
      .add({
        title: selectedTheme.title,
        theme: selectedTheme.theme,
        description: selectedTheme.description,
        status: 'active',
        gridSize: DEFAULT_GRID_SIZE,
        palette: pickPalette(selectedTheme.theme),
        startsAt: Timestamp.fromDate(startsAt),
        endsAt: Timestamp.fromDate(endsAt),
        winnerSubmissionId: null,
        createdAt: nowTimestamp,
        completedAt: null,
      });

    console.log(
      'Yeni challenge oluşturuldu:',
      challengeRef.id,
      selectedTheme.theme,
    );

    // Bildirim hatası challenge döngüsünü etkilememeli.
    try {
      await notifyAllUsers(db, {
        title: 'Yeni tema yayında',
        body: `${selectedTheme.title}: bugün 24 saatin var, çizmeye başla!`,
        data: { screen: 'arena' },
      });
    } catch (pushError) {
      console.error('Yeni tema bildirimi gönderilemedi:', pushError);
    }
  } catch (error) {
    console.error(
      'manageChallenges fonksiyonunda hata:',
      error,
    );
  }
};

export const manageChallenges = onSchedule(
  {
    schedule: 'every 1 minutes',
    maxInstances: 1,
    secrets: [GEMINI_API_KEY],
  },
  async () => {
    await runChallengeManagementCycle(db, new Date(), GEMINI_API_KEY.value());
  },
);

const RATE_LIMIT_COLLECTION = 'aiRateLimits';

interface RateLimitDoc {
  windowStart: Timestamp;
  count: number;
}

/**
 * Kullanıcı başına AI çağrılarını sınırlamak için basit, sabit pencereli
 * (fixed-window) bir rate limiter. Her (kullanıcı, özellik) çifti için
 * `aiRateLimits/{uid}_{bucket}` adında ayrı bir doküman tutulur — `bucket`
 * sayesinde örn. "ilham" ve (ileride eklenecek) "moderasyon" özelliklerinin
 * kotaları birbirinden bağımsız olur, biri diğerini tüketmez.
 *
 * Pencere (`windowMs`) dolmuşsa sayaç sıfırlanır; dolmadıysa ve limit
 * (`maxPerWindow`) aşıldıysa `HttpsError('resource-exhausted', ...)`
 * fırlatılır — çağıran taraf (örn. `handleGetCreativeInspiration`) bunu
 * yakalamaz, olduğu gibi client'a kadar taşır ki kullanıcı "çok hızlı
 * istek attın" gibi anlamlı bir hata görsün.
 */
export const enforceRateLimit = async (
  db: Pick<Firestore, 'collection'>,
  uid: string,
  bucket: string,
  maxPerWindow: number,
  windowMs: number,
  now: Date,
): Promise<void> => {
  const docRef = db.collection(RATE_LIMIT_COLLECTION).doc(`${uid}_${bucket}`);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    await docRef.set({ windowStart: Timestamp.fromDate(now), count: 1 });
    return;
  }

  const data = snapshot.data() as RateLimitDoc;
  const windowElapsedMs = now.getTime() - data.windowStart.toDate().getTime();

  if (windowElapsedMs >= windowMs) {
    // Pencere dolmuş: sayaç sıfırdan başlar.
    await docRef.set({ windowStart: Timestamp.fromDate(now), count: 1 });
    return;
  }

  if (data.count >= maxPerWindow) {
    throw new HttpsError(
      'resource-exhausted',
      'Çok fazla istek gönderdin, birazdan tekrar dene.',
    );
  }

  await docRef.update({ count: data.count + 1 });
};

// "İlham iste" özelliği için kota: 5 dakikada en fazla 5 istek. Editör
// ekranında kullanıcı butona istediği kadar basabileceği için (moderasyon
// gibi sistem tetiklemeli değil, kullanıcı tetiklemeli) bu özelliğin kendi
// bağımsız kotası var.
const INSPIRATION_MAX_PER_WINDOW = 5;
const INSPIRATION_WINDOW_MS = 5 * 60 * 1000;

const INSPIRATION_RESPONSE_SCHEMA: GeminiSchema = {
  type: 'object',
  properties: {
    suggestion: { type: 'string' },
  },
  required: ['suggestion'],
};

const buildInspirationPrompt = (themeTitle: string, themeDescription: string): string =>
  `Sen "Pixel Art Challenge" uygulamasında, çizime başlamadan önce kullanıcıya kısa bir yaratıcı fikir veren bir asistansın.
Aktif tema: "${themeTitle}" — ${themeDescription}

Kullanıcıya bu temaya uygun, TEK bir somut çizim fikri öner: ne çizebileceğini ve hangi küçük detayın onu ilginç kılacağını anlat.

Kurallar:
- Türkçe yaz, 1-2 cümle, en fazla 200 karakter.
- Sadece metinsel bir fikir ver — çizimi SEN üretmiyorsun, sadece ilham veriyorsun.
- Eğlenceli/enerjik bir ton kullan, en fazla 1-2 emoji.

Sadece istenen JSON şemasına uygun bir öneri üret.`;

/**
 * Gemini'den, aktif temaya uygun kısa bir yaratıcı fikir metni ister.
 * `callGeminiJSON` gibi throw ETMEZ — herhangi bir hatada (API key yok,
 * timeout, ağ hatası, geçersiz/boş öneri) `null` döner. Çağıran taraf
 * (`handleGetCreativeInspiration`) `null` durumunda kullanıcıya anlamlı
 * bir hata gösterir; burada sabit bir metne "düşme" yok çünkü bu özellik
 * (tema üretiminin aksine) sistemin sürekliliği için zorunlu değil,
 * sadece isteğe bağlı bir yardımcı.
 */
export const generateCreativeInspiration = async (
  apiKey: string | undefined,
  themeTitle: string,
  themeDescription: string,
): Promise<string | null> => {
  const parsed = await callGeminiJSON(
    apiKey,
    buildInspirationPrompt(themeTitle, themeDescription),
    INSPIRATION_RESPONSE_SCHEMA,
    GEMINI_TIMEOUT_MS,
  );

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).suggestion !== 'string'
  ) {
    if (parsed !== null) {
      console.error('Gemini geçersiz formatta ilham döndürdü:', JSON.stringify(parsed));
    }
    return null;
  }

  const suggestion = (parsed as { suggestion: string }).suggestion.trim();

  return suggestion.length > 0 ? suggestion : null;
};

/**
 * "İlham iste" özelliğinin asıl mantığı. Test edilebilirlik için `db`,
 * `uid`, `apiKey` ve `now` parametre olarak enjekte edilir —
 * `runChallengeManagementCycle` ile aynı desen. Kimlik doğrulaması
 * (`request.auth` kontrolü) bilerek burada değil, `getCreativeInspiration`
 * sarmalayıcısında yapılıyor: bu fonksiyon zaten kimliği doğrulanmış bir
 * `uid` bekliyor.
 */
export const handleGetCreativeInspiration = async (
  db: Pick<Firestore, 'collection'>,
  uid: string,
  apiKey: string | undefined,
  now: Date,
): Promise<{ suggestion: string }> => {
  await enforceRateLimit(
    db,
    uid,
    'inspiration',
    INSPIRATION_MAX_PER_WINDOW,
    INSPIRATION_WINDOW_MS,
    now,
  );

  const activeSnapshot = await db
    .collection('challenges')
    .where('status', '==', 'active')
    .limit(1)
    .get();

  if (activeSnapshot.empty) {
    throw new HttpsError('failed-precondition', 'Şu anda aktif bir meydan okuma yok.');
  }

  const activeChallenge = activeSnapshot.docs[0].data() as ChallengeDoc;

  const suggestion = await generateCreativeInspiration(
    apiKey,
    activeChallenge.title,
    activeChallenge.description,
  );

  if (!suggestion) {
    throw new HttpsError('unavailable', 'Şu an ilham üretemiyorum, birazdan tekrar dene.');
  }

  return { suggestion };
};

/**
 * Editör ekranındaki "ilham iste" butonunun çağırdığı callable function.
 * Mobil taraf Firebase SDK'sının `httpsCallable` fonksiyonuyla bunu
 * çağırır; kimlik doğrulama otomatik olarak `request.auth` üzerinden
 * gelir (giriş yapmamış kullanıcı çağıramaz).
 */
export const getCreativeInspiration = onCall(
  { secrets: [GEMINI_API_KEY] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Bu özelliği kullanmak için giriş yapmalısın.');
    }

    return handleGetCreativeInspiration(
      db,
      request.auth.uid,
      GEMINI_API_KEY.value(),
      new Date(),
    );
  },
);

/**
 * `submissions/{id}.voteCount`, artık hiçbir client tarafından doğrudan
 * yazılamıyor (bkz. firestore.rules — submissions için `allow update:
 * if false`). Tek doğruluk kaynağı (source of truth) her zaman `votes`
 * koleksiyonundaki GERÇEK oy dokümanı sayısıdır. Bu fonksiyon, ilgili
 * submission'ın oy sayısını `votes` koleksiyonunu baştan SAYARAK yeniden
 * hesaplar (client tarafında yapılan `increment(±1)` gibi artımlı bir
 * güncelleme DEĞİL).
 *
 * Bunun bilinçli bir tercih olduğunu not düşelim: Cloud Functions
 * tetikleyicileri "en az bir kez" (at-least-once) çalışma garantisi
 * verir — yani aynı olay teorik olarak iki kez işlenebilir. Bir
 * increment tabanlı yaklaşım bu durumda çift sayım riski taşırdı;
 * "baştan sayma" (recompute) yaklaşımı ise doğası gereği idempotent'tir
 * — aynı olay kaç kez işlenirse işlensin sonuç hep doğru sayıya
 * yakınsar.
 *
 * Test edilebilirlik için `db` (sadece `collection` metoduna ihtiyaç
 * duyar) parametre olarak enjekte edilir — `runChallengeManagementCycle`
 * ile aynı desen.
 */
export const recomputeVoteCountForSubmission = async (
  db: Pick<Firestore, 'collection'>,
  submissionId: string,
): Promise<void> => {
  const submissionRef = db.collection('submissions').doc(submissionId);
  const submissionSnapshot = await submissionRef.get();

  if (!submissionSnapshot.exists) {
    // Gönderi silinmiş (ya da hiç var olmamış); sayılacak bir şey yok.
    return;
  }

  const votesSnapshot = await db
    .collection('votes')
    .where('submissionId', '==', submissionId)
    .get();

  await submissionRef.update({ voteCount: votesSnapshot.size });
};

/**
 * Bir `votes/{voteId}` yazma olayının `before`/`after` durumundan, oy
 * sayısı yeniden hesaplanması gereken submission id'lerini çıkarır.
 * Saf (side-effect'siz) bir fonksiyon olarak ayrıldı ki Firestore/Admin
 * SDK mock'lamaya hiç ihtiyaç duymadan test edilebilsin —
 * `runChallengeManagementCycle`'ın `db`/`now` enjeksiyonuyla aynı
 * testedilebilirlik amacını taşıyor.
 *
 * - Oluşturma (before yok, after var): sadece yeni hedef.
 * - Silme (before var, after yok): sadece eski hedef.
 * - Güncelleme/taşıma (ikisi de var, submissionId değişti): hem eski
 *   hem yeni hedef — Set kullanıldığı için submissionId değişmediyse
 *   (teoride olmaması gereken bir durum) tekilleşir.
 */
export const getAffectedSubmissionIds = (
  before: VoteDoc | null,
  after: VoteDoc | null,
): string[] => {
  const ids = new Set<string>();

  if (before?.submissionId) {
    ids.add(before.submissionId);
  }

  if (after?.submissionId) {
    ids.add(after.submissionId);
  }

  return Array.from(ids);
};

/**
 * `votes/{voteId}` koleksiyonundaki HER değişiklikte (oluşturma, silme,
 * ya da bir oyun başka bir çizime taşınması nedeniyle güncellenmesi)
 * tetiklenir ve etkilenen submission'ın (varsa hem eski hem yeni
 * hedefin) oy sayısını yeniden hesaplar. Client artık `votes`
 * koleksiyonu dışında hiçbir şeye yazamadığı için (bkz. firestore.rules),
 * oy sayma mantığının TAMAMI burada, güvenilir Admin SDK tarafında
 * yaşıyor.
 */
export const onVoteWritten = onDocumentWritten(
  'votes/{voteId}',
  async (event) => {
    const beforeData = event.data?.before.exists
      ? (event.data.before.data() as VoteDoc)
      : null;
    const afterData = event.data?.after.exists
      ? (event.data.after.data() as VoteDoc)
      : null;

    const affectedIds = getAffectedSubmissionIds(beforeData, afterData);

    await Promise.all(
      affectedIds.map((submissionId) =>
        recomputeVoteCountForSubmission(db, submissionId),
      ),
    );

    await Promise.all(
      affectedIds.map((submissionId) =>
        awardPopularBadge(db, submissionId).catch((error: unknown) =>
          console.error('Popüler rozeti yazılamadı:', error),
        ),
      ),
    );
  },
);

/**
 * `users/{uid}.stats` alanını okuyup `mutate` ile günceller. Doküman yoksa
 * boş istatistikle başlar; diğer alanlara (email, createdAt) dokunmaz.
 *
 * Not: okuma-değiştirme-yazma bir transaction değildir. Aynı kullanıcı için
 * aynı anda iki tetikleyici çalışırsa (ör. kazanma + katılım) çok nadir de
 * olsa biri diğerinin yazdığını ezebilir; günlük döngüde bu kabul edilebilir.
 */
export const updateUserStats = async (
  db: Pick<Firestore, 'collection'>,
  userId: string,
  mutate: (stats: UserStats) => UserStats,
): Promise<void> => {
  const userRef = db.collection('users').doc(userId);
  const snapshot = await userRef.get();
  const current = readStats(
    snapshot.exists
      ? (snapshot.data() as { stats?: unknown } | undefined)?.stats
      : undefined,
  );
  const next = mutate(current);

  if (next !== current) {
    await userRef.set({ stats: next }, { merge: true });
  }
};

/** Yeni bir gönderi oluşunca kullanıcının seri/katılım istatistiğini günceller. */
export const recordParticipation = async (
  db: Pick<Firestore, 'collection'>,
  submission: { userId: string; challengeId: string },
): Promise<void> => {
  const challengeSnapshot = await db
    .collection('challenges')
    .doc(submission.challengeId)
    .get();

  if (!challengeSnapshot.exists) {
    return;
  }

  const { startsAt } = challengeSnapshot.data() as ChallengeDoc;

  await updateUserStats(db, submission.userId, (stats) =>
    applyParticipation(stats, startsAt.toDate().getTime()),
  );
};

/** Kazanan çizimin sahibine zafer ve "şampiyon" rozetini işler. */
export const recordWin = async (
  db: Pick<Firestore, 'collection'>,
  winnerSubmissionId: string,
): Promise<void> => {
  const submissionSnapshot = await db
    .collection('submissions')
    .doc(winnerSubmissionId)
    .get();

  if (!submissionSnapshot.exists) {
    return;
  }

  const { userId } = submissionSnapshot.data() as { userId: string };

  await updateUserStats(db, userId, applyWin);
};

/** Bir çizim yeterli oya ulaştıysa sahibine "popüler" rozetini verir. */
export const awardPopularBadge = async (
  db: Pick<Firestore, 'collection'>,
  submissionId: string,
): Promise<void> => {
  const submissionSnapshot = await db
    .collection('submissions')
    .doc(submissionId)
    .get();

  if (!submissionSnapshot.exists) {
    return;
  }

  const { userId, voteCount } = submissionSnapshot.data() as {
    userId: string;
    voteCount?: number;
  };

  await updateUserStats(db, userId, (stats) =>
    applyPopularity(stats, voteCount ?? 0),
  );
};

/**
 * Her yeni gönderide katılım istatistiğini (seri, toplam çizim, "ilk çizim"
 * ve seri rozetleri) günceller.
 */
export const onSubmissionCreated = onDocumentCreated(
  'submissions/{submissionId}',
  async (event) => {
    const data = event.data?.data() as
      | { userId?: string; challengeId?: string }
      | undefined;

    if (!data?.userId || !data.challengeId) {
      return;
    }

    await recordParticipation(db, {
      userId: data.userId,
      challengeId: data.challengeId,
    });
  },
);

const JURY_RESPONSE_SCHEMA: GeminiSchema = {
  type: 'object',
  properties: { comment: { type: 'string' } },
  required: ['comment'],
};

// Bir kullanıcı çizimi silip tekrar göndererek AI maliyetini şişirmesin:
// kullanıcı başına saatte en fazla bu kadar jüri yorumu üretilir.
const JURY_MAX_PER_WINDOW = 6;
const JURY_WINDOW_MS = 60 * 60 * 1000;

/**
 * Gemini'den çizim için kısa bir jüri yorumu ister. Çizim neredeyse boşsa,
 * API anahtarı yoksa veya herhangi bir hata olursa `null` döner; jüri
 * yorumu isteğe bağlı bir ek özelliktir, gönderimi asla etkilemez.
 */
export const generateJuryComment = async (
  apiKey: string | undefined,
  input: {
    themeTitle: string;
    themeDescription: string;
    pixels: readonly string[];
    resolution: number;
  },
): Promise<string | null> => {
  const description = describePixels(input.pixels, input.resolution);

  if (description.filled < MIN_FILLED_CELLS) {
    return null;
  }

  const parsed = await callGeminiJSON(
    apiKey,
    buildJuryPrompt({
      themeTitle: input.themeTitle,
      themeDescription: input.themeDescription,
      resolution: input.resolution,
      description,
    }),
    JURY_RESPONSE_SCHEMA,
    GEMINI_TIMEOUT_MS,
  );

  const comment = normalizeJuryComment(parsed);

  if (parsed !== null && comment === null) {
    console.error('Gemini geçersiz jüri yorumu döndürdü:', JSON.stringify(parsed));
  }

  return comment;
};

/**
 * Yeni bir gönderi için jüri yorumunu üretip `submissions/{id}.jury` alanına
 * yazar. Test edilebilirlik için db/apiKey/now enjekte edilir.
 */
export const attachJuryComment = async (
  db: Pick<Firestore, 'collection'>,
  submissionId: string,
  apiKey: string | undefined,
  now: Date,
): Promise<void> => {
  const submissionRef = db.collection('submissions').doc(submissionId);
  const submissionSnapshot = await submissionRef.get();

  if (!submissionSnapshot.exists) {
    return;
  }

  const submission = submissionSnapshot.data() as {
    userId: string;
    challengeId: string;
    pixels: string[];
    resolution: number;
    jury?: unknown;
  };

  if (submission.jury) {
    // Tetikleyici "en az bir kez" çalışır; yorum zaten varsa tekrar üretme.
    return;
  }

  const challengeSnapshot = await db
    .collection('challenges')
    .doc(submission.challengeId)
    .get();

  if (!challengeSnapshot.exists) {
    return;
  }

  try {
    await enforceRateLimit(
      db,
      submission.userId,
      'jury',
      JURY_MAX_PER_WINDOW,
      JURY_WINDOW_MS,
      now,
    );
  } catch {
    // Kota dolmuş: yorum üretme, gönderi yine de geçerli.
    return;
  }

  const challenge = challengeSnapshot.data() as ChallengeDoc;

  const comment = await generateJuryComment(apiKey, {
    themeTitle: challenge.title,
    themeDescription: challenge.description,
    pixels: submission.pixels,
    resolution: submission.resolution,
  });

  if (comment) {
    await submissionRef.update({
      jury: { text: comment, createdAt: Timestamp.fromDate(now) },
    });
  }
};

/** Her yeni gönderi için bir AI jüri yorumu ekler. */
export const onSubmissionJury = onDocumentCreated(
  { document: 'submissions/{submissionId}', secrets: [GEMINI_API_KEY] },
  async (event) => {
    await attachJuryComment(
      db,
      event.params.submissionId,
      GEMINI_API_KEY.value(),
      new Date(),
    );
  },
);

/** Hesap silme için son girişin en fazla bu kadar yeni olması gerekir. */
export const RECENT_LOGIN_WINDOW_MS = 5 * 60 * 1000;

/**
 * Bir kullanıcının uygulamadaki kişisel verisini siler: çizimleri (ve onlara
 * verilen oylar), verdiği oylar, engel listesi ve profil dokümanı. Başkalarına
 * ait şikayet kayıtları (`reports`) moderasyon geçmişi olarak saklanır.
 *
 * Çizimler silindiğinde bir challenge'ın kazanan kaydı boşa düşebilir; arşiv
 * ekranı bunu "çizim kaldırıldı" olarak gösterir.
 */
export const deleteUserData = async (
  db: Pick<Firestore, 'collection'>,
  userId: string,
): Promise<void> => {
  const submissions = await db
    .collection('submissions')
    .where('userId', '==', userId)
    .get();

  for (const submission of submissions.docs) {
    const votesOnSubmission = await db
      .collection('votes')
      .where('submissionId', '==', submission.id)
      .get();

    for (const vote of votesOnSubmission.docs) {
      await vote.ref.delete();
    }

    await submission.ref.delete();
  }

  const ownVotes = await db.collection('votes').where('userId', '==', userId).get();

  for (const vote of ownVotes.docs) {
    await vote.ref.delete();
  }

  const blocks = await db.collection(`users/${userId}/blocks`).get();

  for (const block of blocks.docs) {
    await block.ref.delete();
  }

  await db.collection('users').doc(userId).delete();
};

/**
 * "Hesabımı sil" isteğinin asıl mantığı. Güvenlik için istek, kullanıcının
 * YAKIN zamanda (son 5 dk) şifresini girdiğini kanıtlayan bir kimlik
 * doğrulama zamanı (`auth_time`) taşımalıdır; istemci bu yüzden silmeden önce
 * şifreyle yeniden doğrulama yapar. Test edilebilirlik için `deleteAuthUser`
 * enjekte edilir.
 */
export const handleDeleteMyAccount = async (
  db: Pick<Firestore, 'collection'>,
  userId: string,
  authTimeSeconds: number | undefined,
  now: Date,
  deleteAuthUser: (userId: string) => Promise<void>,
): Promise<{ deleted: true }> => {
  if (
    typeof authTimeSeconds !== 'number' ||
    now.getTime() - authTimeSeconds * 1000 > RECENT_LOGIN_WINDOW_MS
  ) {
    throw new HttpsError(
      'failed-precondition',
      'Hesabını silmek için şifreni yeniden girmelisin.',
    );
  }

  await deleteUserData(db, userId);
  await deleteAuthUser(userId);

  return { deleted: true };
};

export const deleteMyAccount = onCall({}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Bu işlem için giriş yapmalısın.');
  }

  return handleDeleteMyAccount(
    db,
    request.auth.uid,
    request.auth.token.auth_time,
    new Date(),
    (userId) => getAuth().deleteUser(userId),
  );
});

type PushSender = typeof sendPushMessages;

/**
 * Bildirimi gönderir ve Expo'nun "kayıtsız cihaz" dediği token'ları
 * kullanıcı profilinden temizler. `sender` testlerde ağ çağrısını taklit eder.
 */
export const deliverPush = async (
  db: Pick<Firestore, 'collection'>,
  entries: readonly { userId: string; token: string }[],
  content: PushContent,
  sender: PushSender = sendPushMessages,
): Promise<void> => {
  const messages = buildMessages(
    entries.map((entry) => entry.token),
    content,
  );

  if (messages.length === 0) {
    return;
  }

  const invalid = new Set(await sender(messages));

  for (const entry of entries) {
    if (invalid.has(entry.token)) {
      await db
        .collection('users')
        .doc(entry.userId)
        .update({ pushToken: FieldValue.delete() });
    }
  }
};

/** Push token'ı kayıtlı tüm kullanıcılara bildirim gönderir. */
export const notifyAllUsers = async (
  db: Pick<Firestore, 'collection'>,
  content: PushContent,
  sender?: PushSender,
): Promise<void> => {
  const snapshot = await db
    .collection('users')
    .where('pushToken', '!=', null)
    .get();

  const entries = snapshot.docs
    .map((document) => ({
      userId: document.id,
      token: (document.data() as { pushToken?: unknown }).pushToken,
    }))
    .filter((entry): entry is { userId: string; token: string } =>
      isExpoPushToken(entry.token),
    );

  await deliverPush(db, entries, content, sender);
};

/** Tek bir kullanıcıya (push token'ı varsa) bildirim gönderir. */
export const notifyUser = async (
  db: Pick<Firestore, 'collection'>,
  userId: string,
  content: PushContent,
  sender?: PushSender,
): Promise<void> => {
  const snapshot = await db.collection('users').doc(userId).get();

  if (!snapshot.exists) {
    return;
  }

  const token = (snapshot.data() as { pushToken?: unknown } | undefined)?.pushToken;

  if (isExpoPushToken(token)) {
    await deliverPush(db, [{ userId, token }], content, sender);
  }
};

/** Kazanan çizimin sahibine tebrik bildirimi gönderir. */
export const notifyWinner = async (
  db: Pick<Firestore, 'collection'>,
  winnerSubmissionId: string,
  sender?: PushSender,
): Promise<void> => {
  const submissionSnapshot = await db
    .collection('submissions')
    .doc(winnerSubmissionId)
    .get();

  if (!submissionSnapshot.exists) {
    return;
  }

  const { userId } = submissionSnapshot.data() as { userId: string };

  await notifyUser(
    db,
    userId,
    {
      title: 'Tebrikler, şampiyonsun!',
      body: 'Çizimin günün en çok oyunu aldı.',
      data: { screen: 'archive' },
    },
    sender,
  );
};
