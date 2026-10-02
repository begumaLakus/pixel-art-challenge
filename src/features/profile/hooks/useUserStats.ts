import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { auth } from '@/src/features/auth/services/authServices';
import { db } from '@/src/services/firebase/firestore';

import { EMPTY_STATS, readStats, type UserStats } from '../utils/stats';

interface UseUserStatsResult {
  stats: UserStats;
  loading: boolean;
}

/**
 * Giriş yapmış kullanıcının istatistiklerini (seri, rozetler) canlı izler.
 * Doküman henüz yoksa (hiç katılım yok) boş istatistik döner.
 */
export const useUserStats = (): UseUserStatsResult => {
  const [stats, setStats] = useState<UserStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    return onSnapshot(
      doc(db, 'users', userId),
      (snapshot) => {
        setStats(readStats(snapshot.data()?.stats));
        setLoading(false);
      },
      (error) => {
        console.error('İstatistikler okunamadı:', error);
        setLoading(false);
      },
    );
  }, [userId]);

  return { stats, loading };
};
