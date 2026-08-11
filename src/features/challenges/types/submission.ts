import type { Timestamp } from 'firebase/firestore';

export interface Submission {
  id: string;
  userId: string;
  challengeId: string;
  pixels: string[];
  voteCount: number;
  createdAt: Timestamp;
}