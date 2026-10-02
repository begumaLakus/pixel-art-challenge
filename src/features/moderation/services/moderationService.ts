import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from '../../../services/firebase/firestore';
import { auth } from '../../auth/services/authServices';

/** Firestore kuralındaki izinli nedenlerle birebir aynı olmalı. */
export const REPORT_REASONS = [
  { id: 'inappropriate', label: 'Uygunsuz içerik' },
  { id: 'spam', label: 'Spam' },
  { id: 'other', label: 'Diğer' },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]['id'];

/** Bir kullanıcı bir çizimi en fazla bir kez şikayet edebilir. */
export const buildReportId = (submissionId: string, reporterId: string): string =>
  `${submissionId}_${reporterId}`;

const requireUser = () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Kullanıcı oturumu bulunamadı.');
  }

  return user;
};

export interface ReportSubmissionInput {
  submissionId: string;
  challengeId: string;
  reportedUserId: string;
  reason: ReportReason;
}

export const reportSubmission = async (
  input: ReportSubmissionInput,
): Promise<void> => {
  const user = requireUser();

  await setDoc(doc(db, 'reports', buildReportId(input.submissionId, user.uid)), {
    submissionId: input.submissionId,
    challengeId: input.challengeId,
    reportedUserId: input.reportedUserId,
    reporterId: user.uid,
    reason: input.reason,
    createdAt: serverTimestamp(),
  });
};

export const blockUser = async (blockedUserId: string): Promise<void> => {
  const user = requireUser();

  await setDoc(doc(db, 'users', user.uid, 'blocks', blockedUserId), {
    createdAt: serverTimestamp(),
  });
};

export const unblockUser = async (blockedUserId: string): Promise<void> => {
  const user = requireUser();

  await deleteDoc(doc(db, 'users', user.uid, 'blocks', blockedUserId));
};

/** Engellediğin kullanıcıların id listesini canlı izler. */
export const subscribeToBlockedUsers = (
  onChange: (blockedUserIds: string[]) => void,
  onError: (error: FirestoreError) => void,
): Unsubscribe => {
  const user = auth.currentUser;

  if (!user) {
    return () => {};
  }

  return onSnapshot(
    collection(db, 'users', user.uid, 'blocks'),
    (snapshot) => onChange(snapshot.docs.map((document) => document.id)),
    onError,
  );
};
