import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  email: string;
  createdAt: Timestamp;
}