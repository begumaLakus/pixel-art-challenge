import type { Timestamp } from 'firebase/firestore';

import type { PixelResolution } from '@/src/features/editor/hooks/usePixelEditor';

export interface Submission {
  id: string;
  userId: string;
  challengeId: string;
  pixels: string[];
  resolution: PixelResolution;
  voteCount: number;
  /** Çizimin adım adım kaydı (time-lapse); eski gönderilerde yoktur. */
  moves?: string;
  /** Yapay zekâ jürinin yorumu; sunucu yazar, yorum üretilemezse yoktur. */
  jury?: { text: string };
  createdAt: Timestamp;
}

export interface CreateSubmissionData {
  challengeId: string;
  pixels: string[];
  resolution: PixelResolution;
  /** Time-lapse kaydı; boşsa gönderilmez. */
  moves?: string;
}