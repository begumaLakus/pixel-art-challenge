import { useCallback, useEffect, useState } from 'react';

import {
  getSubmissionsByChallenge,
} from '../services/submissionService';

import type { Submission } from '../types/types';

interface UseSubmissionsResult {
  submissions: Submission[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useSubmissions = (
  challengeId: string,
): UseSubmissionsResult => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubmissions = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const data =
        await getSubmissionsByChallenge(challengeId);

      setSubmissions(data);
    } catch (err) {
      console.error('Submissionlar alınamadı:', err);

      setError(
        'Çalışmalar yüklenirken bir hata oluştu.',
      );
    } finally {
      setLoading(false);
    }
  }, [challengeId]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  return {
    submissions,
    loading,
    error,
    refresh: loadSubmissions,
  };
};