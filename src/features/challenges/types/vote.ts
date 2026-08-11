import type { Timestamp } from 'firebase/firestore';

export interface Vote {
  id: string;
  userId: string;
  submissionId: string;
  challengeId: string;
  createdAt: Timestamp;
}