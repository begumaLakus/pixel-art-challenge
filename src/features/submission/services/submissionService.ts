import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';

import { db } from '../../../services/firebase/firestore';
import { auth } from '../../auth/services/authServices';

import { limit } from 'firebase/firestore';
import type {
  CreateSubmissionData,
  Submission,
} from '../types/types';

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

  const submissionRef = await addDoc(
    collection(db, 'submissions'),
    {
      userId: user.uid,
      challengeId: data.challengeId,
      pixels: data.pixels,
      resolution: data.resolution,
      voteCount: 0,
      createdAt: serverTimestamp(),
    },
  );

  return submissionRef.id;
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