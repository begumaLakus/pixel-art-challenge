import {
    doc,
    getDoc,
    increment,
    runTransaction,
    serverTimestamp,
} from 'firebase/firestore';

import { db } from '../../../services/firebase/firestore';
import { auth } from '../../auth/services/authServices';

const VOTES_COLLECTION = 'votes';
const SUBMISSIONS_COLLECTION = 'submissions';

/**
 * Kullanıcının belirli bir submission'a daha önce oy verip vermediğini kontrol eder.
 */
export const hasUserVoted = async (
  submissionId: string,
): Promise<boolean> => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Kullanıcı oturumu bulunamadı.');
  }

  const voteId = `${submissionId}_${user.uid}`;

  const voteRef = doc(db, VOTES_COLLECTION, voteId);
  const voteSnapshot = await getDoc(voteRef);

  return voteSnapshot.exists();
};

/**
 * Submission'a oy verir.
 *
 * Aynı kullanıcı aynı submission'a yalnızca bir kez oy verebilir.
 */
export const voteForSubmission = async (
  submissionId: string,
): Promise<void> => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Kullanıcı oturumu bulunamadı.');
  }

  const voteId = `${submissionId}_${user.uid}`;

  const voteRef = doc(db, VOTES_COLLECTION, voteId);

  const submissionRef = doc(
    db,
    SUBMISSIONS_COLLECTION,
    submissionId,
  );

  await runTransaction(db, async (transaction) => {
    const voteSnapshot = await transaction.get(voteRef);
    const submissionSnapshot = await transaction.get(
      submissionRef,
    );

    if (voteSnapshot.exists()) {
      throw new Error('Bu çalışmaya zaten oy verdiniz.');
    }

    if (!submissionSnapshot.exists()) {
      throw new Error('Gönderi bulunamadı.');
    }

    transaction.set(voteRef, {
      submissionId,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });

    transaction.update(submissionRef, {
      voteCount: increment(1),
    });
  });
};