import { initializeApp } from 'firebase-admin/app';
import {
  getFirestore,
  Timestamp,
} from 'firebase-admin/firestore';
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
  gridSiz:number;
}

const THEMES = [
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

const CHALLENGE_DURATION_MS = 24 * 60 * 60 * 1000;

export const manageChallenges = onSchedule(
  {
    schedule: 'every 5 minutes',
    maxInstances: 1,
  },
  async () => {
    const now = new Date();
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
  },
);