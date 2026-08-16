import { useCallback, useEffect, useState } from 'react';

import { getActiveChallenge } from '../services/challengeService';
import type { Challenge } from '../types/challenge';

interface UseActiveChallengeResult {
  challenge: Challenge | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useActiveChallenge =
  (): UseActiveChallengeResult => {
    const [challenge, setChallenge] =
      useState<Challenge | null>(null);

    const [loading, setLoading] =
      useState<boolean>(true);

    const [error, setError] =
      useState<string | null>(null);

    const fetchChallenge = useCallback(
      async (): Promise<void> => {
        try {
          setLoading(true);
          setError(null);

          const activeChallenge =
            await getActiveChallenge();

          setChallenge(activeChallenge);
        } catch (error) {
          console.error(
            'Aktif challenge yüklenirken hata:',
            error,
          );

          setError(
            'Aktif challenge yüklenirken bir hata oluştu.',
          );
        } finally {
          setLoading(false);
        }
      },
      [],
    );

    useEffect(() => {
      void fetchChallenge();
    }, [fetchChallenge]);

    return {
      challenge,
      loading,
      error,
      refetch: fetchChallenge,
    };
  };