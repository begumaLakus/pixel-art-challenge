import { useCallback, useEffect, useState } from 'react';

import { getArchivedChallenges } from '../services/archiveService';
import type { ArchivedChallenge } from '../types/types';

interface UseArchiveResult {
  archivedChallenges: ArchivedChallenge[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useArchive = (): UseArchiveResult => {
  const [archivedChallenges, setArchivedChallenges] =
    useState<ArchivedChallenge[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadArchive = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const data = await getArchivedChallenges();

      setArchivedChallenges(data);
    } catch (err) {
      console.error('Arşiv yüklenemedi:', err);

      setError('Arşiv yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArchive();
  }, [loadArchive]);

  return {
    archivedChallenges,
    loading,
    error,
    refresh: loadArchive,
  };
};
