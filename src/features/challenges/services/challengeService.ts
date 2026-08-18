import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  query,
  Timestamp,
  where,
  type DocumentData,
  type FirestoreError,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from '@/src/services/firebase/firestore';
import type { Challenge } from '../types/challenge';

const challengesCollection = collection(db, 'challenges');

const buildActiveChallengeQuery = () => {
  const now = Timestamp.now();

  return query(
    challengesCollection,
    where('status', '==', 'active'),
    where('startsAt', '<=', now),
    where('endsAt', '>', now),
    limit(1),
  );
};

/**
 * Firestore dokümanını Challenge tipine güvenli biçimde eşler. Önceki
 * `{ id, ...doc.data() } as Challenge` yaklaşımı runtime'da doğrulanmayan bir
 * cast'ti; alan alan eşleme en azından beklenmeyen/eksik alanları sessizce
 * yaymaz ve şemayı burada tek noktada tutar.
 */
const mapChallengeDocument = (
  document: QueryDocumentSnapshot<DocumentData>,
): Challenge => {
  const data = document.data();

  return {
    id: document.id,
    title: data.title,
    description: data.description,
    theme: data.theme,
    gridSize: data.gridSize,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    status: data.status,
    winnerSubmissionId: data.winnerSubmissionId ?? null,
    createdAt: data.createdAt,
    completedAt: data.completedAt ?? null,
  };
};

/**
 * Tek seferlik aktif challenge sorgusu (ör. deep-link/bildirim hazırlığı
 * gibi ekran dışı senaryolar için). Ekran state'i için `subscribeToActiveChallenge`
 * tercih edilmeli.
 */
export const getActiveChallenge = async (): Promise<Challenge | null> => {
  const snapshot = await getDocs(buildActiveChallengeQuery());

  if (snapshot.empty) {
    return null;
  }

  return mapChallengeDocument(snapshot.docs[0]);
};

/**
 * Aktif challenge'ı gerçek zamanlı dinler. Challenge lifecycle'ı
 * (active -> completed geçişi, bir sonraki challenge'ın başlaması) Cloud
 * Function tarafından yönetildiği için doküman değişikliklerini anında
 * yansıtmak, sabit aralıklı polling'e göre hem daha doğru hem daha az
 * okuma maliyetlidir.
 */
export const subscribeToActiveChallenge = (
  onChange: (challenge: Challenge | null) => void,
  onError: (error: FirestoreError) => void,
): Unsubscribe =>
  onSnapshot(
    buildActiveChallengeQuery(),
    (snapshot) => {
      onChange(snapshot.empty ? null : mapChallengeDocument(snapshot.docs[0]));
    },
    onError,
  );
