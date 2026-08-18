import type { Timestamp } from 'firebase/firestore';

export type ChallengeStatus = 'active' | 'completed';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  theme: string;
  /**
   * Bu challenge için piksel grid'inin bir kenar uzunluğu (kare grid varsayılır,
   * örn. 16 => 16x16). Editor modülü kullanıcıya bu boyutta bir grid sunmalı;
   * galeri/arşiv ekranları da submission.pixels dizisini bu değere göre
   * yorumlamalı. Grid boyutu challenge'a bağlıdır, submission'a değil —
   * böylece aynı challenge'a gönderilen tüm çizimler karşılaştırılabilir kalır.
   */
  gridSize: number;
  startsAt: Timestamp;
  endsAt: Timestamp;
  status: ChallengeStatus;
  winnerSubmissionId: string | null;
  createdAt: Timestamp;
  completedAt: Timestamp | null;
}
