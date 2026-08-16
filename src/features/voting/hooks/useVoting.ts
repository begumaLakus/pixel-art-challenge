import { useCallback, useEffect, useState } from 'react';

import {
    hasUserVoted,
    voteForSubmission,
} from '../services/votingService';

interface UseVotingResult {
  hasVoted: boolean;
  loading: boolean;
  voting: boolean;
  error: string | null;
  vote: () => Promise<void>;
}

export const useVoting = (
  submissionId: string,
): UseVotingResult => {
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkVoteStatus = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const voted = await hasUserVoted(submissionId);

      setHasVoted(voted);
    } catch (err) {
      console.error('Oy durumu kontrol edilemedi:', err);

      setError('Oy durumu kontrol edilemedi.');
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    checkVoteStatus();
  }, [checkVoteStatus]);

  const vote = async (): Promise<void> => {
    if (hasVoted || voting) {
      return;
    }

    try {
      setVoting(true);
      setError(null);

      await voteForSubmission(submissionId);

      setHasVoted(true);
    } catch (err) {
      console.error('Oy verilemedi:', err);

      if (
        err instanceof Error &&
        err.message === 'Bu çalışmaya zaten oy verdiniz.'
      ) {
        setHasVoted(true);
        setError(err.message);
        return;
      }

      setError('Oy verilirken bir hata oluştu.');
    } finally {
      setVoting(false);
    }
  };

  return {
    hasVoted,
    loading,
    voting,
    error,
    vote,
  };
};