import {
  collection,
  getDocs,
  limit,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';

import { db } from '@/src/services/firebase/firestore';
import type { Challenge } from '../types/challenge';

const challengesCollection = collection(db, 'challenges');

export const getActiveChallenge =
  async (): Promise<Challenge | null> => {
    const now = Timestamp.now();

    const activeChallengeQuery = query(
      challengesCollection,
      where('status', '==', 'active'),
      where('startsAt', '<=', now),
      where('endsAt', '>', now),
      limit(1),
    );

    const snapshot = await getDocs(activeChallengeQuery);

    if (snapshot.empty) {
      return null;
    }

    const document = snapshot.docs[0];

    return {
      id: document.id,
      ...document.data(),
    } as Challenge;
  };