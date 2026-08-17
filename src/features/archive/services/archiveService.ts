import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';

import { db } from '@/src/services/firebase/firestore';

import type { Challenge } from '@/src/features/challenges/types/challenge';
import type { Submission } from '@/src/features/submission/types/types';
import type { ArchivedChallenge } from '../types/types';

const CHALLENGES_COLLECTION = 'challenges';
const SUBMISSIONS_COLLECTION = 'submissions';

/**
 * Firestore Timestamp alanları eski dokümanlarda eksik olabilir,
 * bu yüzden doğrudan toMillis() çağırmıyoruz.
 */
const toMillis = (
  value: Timestamp | null | undefined,
): number => value?.toMillis?.() ?? 0;

/**
 * Sıralama için challenge'ın tamamlanma zamanı.
 * completedAt yoksa endsAt'e düşer.
 */
const getCompletionMillis = (
  challenge: Challenge,
): number =>
  toMillis(challenge.completedAt) ||
  toMillis(challenge.endsAt);

/**
 * Yalnızca status === 'completed' olan challenge'ları getirir.
 * Aktif challenge bu sorguya hiç girmez.
 *
 * Sıralama bilinçli olarak client tarafında yapılıyor: böylece
 * (status ASC, completedAt DESC) composite index'ine ihtiyaç kalmıyor.
 * Aynı yaklaşım getSubmissionsByChallenge içinde de kullanılıyor.
 */
export const getCompletedChallenges = async (): Promise<
  Challenge[]
> => {
  const completedChallengesQuery = query(
    collection(db, CHALLENGES_COLLECTION),
    where('status', '==', 'completed'),
  );

  const snapshot = await getDocs(completedChallengesQuery);

  return snapshot.docs
    .map(
      (document) =>
        ({
          id: document.id,
          ...document.data(),
        }) as Challenge,
    )
    .sort(
      (a, b) =>
        getCompletionMillis(b) - getCompletionMillis(a),
    );
};

/**
 * Challenge'ın kazanan çizimini getirir.
 *
 * Hata fırlatmaz; kazanan okunamazsa null döner ki tek bir
 * bozuk kayıt arşivin tamamını düşürmesin.
 */
const getWinnerSubmission = async (
  challenge: Challenge,
): Promise<Submission | null> => {
  if (!challenge.winnerSubmissionId) {
    return null;
  }

  try {
    const submissionRef = doc(
      db,
      SUBMISSIONS_COLLECTION,
      challenge.winnerSubmissionId,
    );

    const snapshot = await getDoc(submissionRef);

    if (!snapshot.exists()) {
      return null;
    }

    const submission = {
      id: snapshot.id,
      ...snapshot.data(),
    } as Submission;

    /*
     * Kazanan çizim gerçekten bu challenge'a mı ait?
     * Tutarsız veriye karşı koruma.
     */
    if (submission.challengeId !== challenge.id) {
      console.warn(
        'Kazanan submission farklı bir challenge’a ait, atlanıyor:',
        {
          challengeId: challenge.id,
          submissionId: submission.id,
          submissionChallengeId: submission.challengeId,
        },
      );

      return null;
    }

    /*
     * PixelGrid pixels dizisi ve resolution olmadan çizim yapamaz.
     */
    if (
      !Array.isArray(submission.pixels) ||
      submission.pixels.length === 0 ||
      !submission.resolution
    ) {
      console.warn(
        'Kazanan submission çizim verisi eksik, atlanıyor:',
        submission.id,
      );

      return null;
    }

    return submission;
  } catch (error) {
    console.error(
      'Kazanan submission alınamadı:',
      challenge.winnerSubmissionId,
      error,
    );

    return null;
  }
};

/**
 * Arşiv ekranının ihtiyaç duyduğu tüm veri:
 * tamamlanmış challenge'lar + kazanan çizimleri.
 */
export const getArchivedChallenges = async (): Promise<
  ArchivedChallenge[]
> => {
  const challenges = await getCompletedChallenges();

  return Promise.all(
    challenges.map(async (challenge) => ({
      challenge,
      winnerSubmission: await getWinnerSubmission(
        challenge,
      ),
    })),
  );
};
