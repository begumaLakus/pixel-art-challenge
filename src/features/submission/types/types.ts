import type { Timestamp } from 'firebase/firestore';

import type { PixelResolution } from '@/src/features/editor/hooks/usePixelEditor';

export interface Submission {
  id: string;
  userId: string;
  challengeId: string;
  pixels: string[];
  resolution: PixelResolution;
  voteCount: number;
  createdAt: Timestamp;
}

export interface CreateSubmissionData {
  challengeId: string;
  pixels: string[];
  resolution: PixelResolution;
}