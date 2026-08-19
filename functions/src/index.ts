import { initializeApp } from 'firebase-admin/app';
import {
  Firestore,
  getFirestore,
  Timestamp,
} from 'firebase-admin/firestore';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';

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
 * Otonom challenge yaşam döngüsünün asıl mantığı. Test edilebilirlik için
 * `db` ve `now` parametre olarak enjekte edilir; `manageChallenges`
 * scheduler'ı bu fonksiyonu gerçek `db`/`Date` ile çağırır. Davranış
 * öncekiyle birebir aynıdır, sadece modül seviyesindeki closure'lardan
 * (db) parametreye taşındı.
 */
export const runChallengeManagementCycle = async (
  db: Pick<Firestore, 'collection'>,
  now: Date,
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
       * 2. Challenge'ın süresi doldu.
       * En yüksek oy alan submission'ı bul.
       */
      const submissionsSnapshot = await db
        .collection('submissions')
        .where(
          'challengeId',
          '==',
          activeChallenge.id,
        )
        .orderBy('voteCount', 'desc')
        .limit(1)
        .get();

      const winnerSubmissionId =
        submissionsSnapshot.empty
          ? null
          : submissionsSnapshot.docs[0].id;

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
     * 5. Önceki challenge'ın temasını çıkar.
     */
    const availableThemes = THEMES.filter(
      (item) => item.theme !== previousTheme,
    );

    /*
     * 6. Rastgele yeni tema seç.
     */
    const selectedTheme =
      availableThemes[
        Math.floor(
          Math.random() * availableThemes.length,
        )
      ];

    const startsAt = now;
    const endsAt = new Date(
      now.getTime() + CHALLENGE_DURATION_MS,
    );

    /*
     * 7. Yeni challenge oluştur.
     */
    const challengeRef = await db
      .collection('challenges')
      .add({
        title: selectedTheme.title,
        theme: selectedTheme.theme,
        description: selectedTheme.description,
        status: 'active',
        gridSize: DEFAULT_GRID_SIZE,
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
  } catch (error) {
    console.error(
      'manageChallenges fonksiyonunda hata:',
      error,
    );
  }
};

export const manageChallenges = onSchedule(
  {
    schedule: 'every 5 minutes',
    maxInstances: 1,
  },
  async () => {
    await runChallengeManagementCycle(db, new Date());
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

    await Promise.all(
      getAffectedSubmissionIds(beforeData, afterData).map((submissionId) =>
        recomputeVoteCountForSubmission(db, submissionId),
      ),
    );
  },
);
