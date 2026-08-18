import type { Timestamp } from 'firebase/firestore';

/**
 * Bir kullanıcının bir challenge içinde en fazla bir submission'a oy
 * verebilmesi kısıtı bu tip tarafından ifade edilmez / garanti edilmez.
 * Bu kısıt Firestore Security Rules veya bir Cloud Function seviyesinde
 * (userId + challengeId üzerinde tekillik) uygulanmalıdır — bu modülün
 * dosyalarında böyle bir kural görünmüyor, oylama modülünde doğrulanmalı.
 */
export interface Vote {
  id: string;
  userId: string;
  submissionId: string;
  challengeId: string;
  createdAt: Timestamp;
}
