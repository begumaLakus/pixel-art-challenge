import type { SpriteName } from '@/src/theme/sprites';

/** `users/{uid}.stats` — Cloud Function'lar yazar, istemci yalnızca okur. */
export interface UserStats {
  streak: number;
  bestStreak: number;
  entries: number;
  wins: number;
  lastChallengeStartsAtMs: number;
  badges: string[];
}

export interface BadgeInfo {
  id: string;
  title: string;
  description: string;
  sprite: SpriteName;
}

export const BADGES: readonly BadgeInfo[] = [
  {
    id: 'first_entry',
    title: 'İlk çizim',
    description: 'İlk challenge’ına katıldın.',
    sprite: 'star',
  },
  {
    id: 'streak_3',
    title: '3 gün seri',
    description: 'Üst üste 3 challenge’a katıl.',
    sprite: 'flame',
  },
  {
    id: 'streak_7',
    title: '7 gün seri',
    description: 'Üst üste 7 challenge’a katıl.',
    sprite: 'flame',
  },
  {
    id: 'champion',
    title: 'Şampiyon',
    description: 'Bir challenge’ı kazan.',
    sprite: 'trophy',
  },
  {
    id: 'popular',
    title: 'Popüler',
    description: 'Bir çizimin 10 oya ulaşsın.',
    sprite: 'heart',
  },
];

/** Sunucudaki MAX_CONSECUTIVE_GAP_MS ile aynı olmalı. */
export const MAX_CONSECUTIVE_GAP_MS = 30 * 60 * 60 * 1000;

export const EMPTY_STATS: UserStats = {
  streak: 0,
  bestStreak: 0,
  entries: 0,
  wins: 0,
  lastChallengeStartsAtMs: 0,
  badges: [],
};

const toCount = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;

/** Firestore'dan gelen (eksik/bozuk olabilecek) veriyi güvenli bir UserStats'a çevirir. */
export const readStats = (raw: unknown): UserStats => {
  if (typeof raw !== 'object' || raw === null) {
    return { ...EMPTY_STATS, badges: [] };
  }

  const data = raw as Record<string, unknown>;

  return {
    streak: toCount(data.streak),
    bestStreak: toCount(data.bestStreak),
    entries: toCount(data.entries),
    wins: toCount(data.wins),
    lastChallengeStartsAtMs: toCount(data.lastChallengeStartsAtMs),
    badges: Array.isArray(data.badges)
      ? data.badges.filter((id): id is string => typeof id === 'string')
      : [],
  };
};

/**
 * Seri hâlâ canlı mı? Kayıtlı seri, yalnızca son katıldığın challenge şu anki
 * (ya da bir öncekinin hemen ardından gelen) challenge ise gösterilir; bir
 * challenge'ı atlayınca seri sunucuda sıfırlanana kadar bile 0 görünür.
 */
export const getActiveStreak = (
  stats: UserStats,
  activeChallengeStartsAtMs: number | null,
): number => {
  if (stats.streak <= 0 || stats.lastChallengeStartsAtMs <= 0) {
    return 0;
  }

  if (activeChallengeStartsAtMs === null) {
    return stats.streak;
  }

  return activeChallengeStartsAtMs - stats.lastChallengeStartsAtMs <=
    MAX_CONSECUTIVE_GAP_MS
    ? stats.streak
    : 0;
};
