// src/features/challenges/hooks/useActiveChallenge.ts

import { useEffect, useState } from 'react';

import { subscribeToActiveChallenge } from '../services/challengeService';
import type { Challenge } from '../types/challenge';

interface UseActiveChallengeResult {
  challenge: Challenge | null;
  loading: boolean;
  error: string | null;
}

/**
 * Aktif challenge'ı canlı olarak izler (Firestore onSnapshot).
 *
 * Önceki sürüm 10 saniyede bir `getDocs` ile polling yapıyordu; bu hem
 * gereksiz Firestore okuması hem de component unmount olduğunda devam eden
 * bir fetch'in state'i güncellemeye çalışması riskini taşıyordu. onSnapshot
 * abonelik modeli her iki sorunu da ortadan kaldırır: değişiklik anında
 * yansır ve cleanup'ta abonelik tamamen kesilir.
 */
export const useActiveChallenge = (): UseActiveChallengeResult => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToActiveChallenge(
      (activeChallenge) => {
        setChallenge(activeChallenge);
        setLoading(false);
      },
      (subscriptionError) => {
        console.error('Aktif challenge dinlenirken hata:', subscriptionError);
        setError('Aktif challenge yüklenirken bir hata oluştu.');
        setLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, []);

  return { challenge, loading, error };
};
