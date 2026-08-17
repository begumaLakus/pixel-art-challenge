import type { Challenge } from '@/src/features/challenges/types/challenge';
import type { Submission } from '@/src/features/submission/types/types';

/**
 * Tamamlanmış bir challenge ve onun kazanan çizimi.
 *
 * winnerSubmission null olabilir:
 *  - challenge'a hiç katılım olmadıysa (Cloud Function winnerSubmissionId'yi null bırakır),
 *  - kazanan doküman silinmişse,
 *  - kazanan doküman başka bir challenge'a aitse (tutarsız veri).
 */
export interface ArchivedChallenge {
  challenge: Challenge;
  winnerSubmission: Submission | null;
}
