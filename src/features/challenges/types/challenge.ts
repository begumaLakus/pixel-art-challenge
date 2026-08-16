import type { Timestamp } from 'firebase/firestore';

export type ChallengeStatus = 'active' | 'completed';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  theme: string;
  startsAt: Timestamp;
  endsAt: Timestamp;
  status: ChallengeStatus;
  winnerSubmissionId: string | null;
  createdAt: Timestamp;
  completedAt: Timestamp | null;
}