import type { Timestamp } from 'firebase/firestore';

export interface Submission {
  id: string;
  userId: string;
  challengeId: string;
  /**
   * Piksel verisi. Boyut bilgisi burada TUTULMAZ — kaynak referans ilgili
   * Challenge.gridSize alanıdır (bkz. ../types/challenge.ts). Bu dizi,
   * o challenge'ın gridSize değerine göre yorumlanmalıdır. Kodlama şeması
   * (satır satır hex renk vb.) editor/oylama modülünün sorumluluğundadır,
   * bu modül sadece veri sözleşmesini taşır.
   */
  pixels: string[];
  voteCount: number;
  createdAt: Timestamp;
}
