import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';

import { db } from '../../../services/firebase/firestore';
import { auth } from '../../auth/services/authServices';

import type {
  CreateSubmissionData,
  Submission,
} from '../types/types';

/**
 * Gönderi dokümanının ID'si deterministiktir: `${challengeId}_${userId}`.
 * `firestore.rules` bu formatı zorunlu kıldığı için bir kullanıcı bir
 * challenge'a sunucu tarafında da en fazla bir çizim gönderebilir.
 */
const buildSubmissionId = (challengeId: string, userId: string): string =>
  `${challengeId}_${userId}`;

export const createSubmission = async (
  data: CreateSubmissionData,
): Promise<string> => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Kullanıcı oturumu bulunamadı.');
  }

  // Kullanıcının bu challenge'a daha önce katılıp katılmadığını kontrol et
  const existingSubmissionQuery = query(
    collection(db, 'submissions'),
    where('userId', '==', user.uid),
    where('challengeId', '==', data.challengeId),
    limit(1),
  );

  const existingSnapshot = await getDocs(
    existingSubmissionQuery,
  );

  if (!existingSnapshot.empty) {
    throw new Error(
      'Bu challenge için zaten bir çizim gönderdiniz.',
    );
  }

  const submissionId = buildSubmissionId(data.challengeId, user.uid);

  await setDoc(doc(db, 'submissions', submissionId), {
    userId: user.uid,
    challengeId: data.challengeId,
    pixels: data.pixels,
    resolution: data.resolution,
    voteCount: 0,
    ...(data.moves ? { moves: data.moves } : {}),
    createdAt: serverTimestamp(),
  });

  return submissionId;
};

export const getSubmissionsByChallenge = async (
  challengeId: string,
): Promise<Submission[]> => {
  const submissionsQuery = query(
    collection(db, 'submissions'),
    where('challengeId', '==', challengeId),
  );

  const snapshot = await getDocs(submissionsQuery);

  return snapshot.docs
    .map((document) => ({
      id: document.id,
      ...document.data(),
    }) as Submission) // <-- Burada Submission[] yerine tekil Submission kullanıyoruz
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() ?? 0;
      const bTime = b.createdAt?.toMillis?.() ?? 0;

      return bTime - aTime;
    });
};

/**
 * Giriş yapmış kullanıcının belirli bir challenge için gönderdiği çizimi
 * (varsa) getirir. `createSubmission` içindeki mükerrer katılım
 * kontrolüyle aynı sorguyu kullanır; ChallengeActionsPanel bu fonksiyonla
 * kullanıcının zaten katılıp katılmadığını (ve katıldıysa hangi çizimle)
 * belirler.
 */
export const getMySubmissionForChallenge = async (
  challengeId: string,
): Promise<Submission | null> => {
  const user = auth.currentUser;

  if (!user) {
    return null;
  }

  const mySubmissionQuery = query(
    collection(db, 'submissions'),
    where('userId', '==', user.uid),
    where('challengeId', '==', challengeId),
    limit(1),
  );

  const snapshot = await getDocs(mySubmissionQuery);

  if (snapshot.empty) {
    return null;
  }

  const document = snapshot.docs[0];

  return {
    id: document.id,
    ...document.data(),
  } as Submission;
};

/**
 * Kullanıcının kendi gönderisini siler. Silindikten sonra
 * `createSubmission`'daki mükerrer katılım kontrolü artık bu challenge
 * için bir kayıt bulamayacağından kullanıcı yeniden katılabilir.
 */
export const deleteSubmission = async (
  submissionId: string,
): Promise<void> => {
  await deleteDoc(doc(db, 'submissions', submissionId));
};
