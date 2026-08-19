import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';

import {
  deleteSubmission,
  getMySubmissionForChallenge,
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

  useFocusEffect(
    useCallback(() => {
      loadSubmissions();
    }, [loadSubmissions]),
  );

  return {
    submissions,
    loading,
    error,
    refresh: loadSubmissions,
  };
};

interface UseMySubmissionResult {
  mySubmission: Submission | null;
  loading: boolean;
  deleting: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  removeMySubmission: () => Promise<void>;
}

/**
 * Giriş yapmış kullanıcının bu challenge için gönderdiği çizimi (varsa)
 * izler. `useFocusEffect` kullanılıyor çünkü ChallengeActionsPanel,
 * kullanıcı editor/galeri ekranına gidip geri döndüğünde unmount
 * olmuyor — sadece ekran her odaklandığında (focus) yeniden kontrol
 * edilerek "PIXEL ART OLUŞTUR" butonu ile "senin çizimin" kartı
 * arasındaki geçiş güncel kalıyor (ör. çizim gönderildikten veya
 * silindikten hemen sonra).
 */
export const useMySubmission = (
  challengeId: string,
): UseMySubmissionResult => {
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadMySubmission = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const submission = await getMySubmissionForChallenge(challengeId);

      setMySubmission(submission);
    } catch (err) {
      console.error('Kendi gönderi kontrol edilemedi:', err);

      setError('Gönderi bilgisi alınırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [challengeId]);

  useFocusEffect(
    useCallback(() => {
      loadMySubmission();
    }, [loadMySubmission]),
  );

  const removeMySubmission = useCallback(async (): Promise<void> => {
    if (!mySubmission || deleting) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);

      await deleteSubmission(mySubmission.id);

      setMySubmission(null);
    } catch (err) {
      console.error('Gönderi silinemedi:', err);

      setError('Çizim silinirken bir hata oluştu.');
    } finally {
      setDeleting(false);
    }
  }, [mySubmission, deleting]);

  return {
    mySubmission,
    loading,
    deleting,
    error,
    refresh: loadMySubmission,
    removeMySubmission,
  };
};
