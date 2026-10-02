/**
 * Kullanıcı istatistikleri, seri (streak) ve rozet kuralları. Firebase'e
 * bağımlı olmayan saf fonksiyonlar; Cloud Function'lar bunları çağırıp
 * sonucu `users/{uid}.stats` alanına yazar.
 *
 * Seri, takvim gününe değil ARDIŞIK CHALLENGE'lara göre sayılır: challenge'lar
 * 24 saat arayla başladığı için, bir challenge'ın başlangıcı bir öncekinden
 * en fazla ~30 saat sonraysa seri devam eder. Böylece saat dilimi ve gün
 * sınırı sorunu yoktur.
 */
export interface UserStats {
  streak: number;
  bestStreak: number;
  entries: number;
  wins: number;
  /** Katıldığı son challenge'ın başlangıç zamanı (ms). */
  lastChallengeStartsAtMs: number;
  badges: string[];
}

export const BADGE_IDS = [
  'first_entry',
  'streak_3',
  'streak_7',
  'champion',
  'popular',
] as const;

export type BadgeId = (typeof BADGE_IDS)[number];

/** İki ardışık challenge arasında serinin sürmesi için izin verilen en uzun fark. */
export const MAX_CONSECUTIVE_GAP_MS = 30 * 60 * 60 * 1000;

/** "Popüler" rozeti için bir çizimin alması gereken oy sayısı. */
export const POPULAR_VOTE_THRESHOLD = 10;

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

const addBadges = (stats: UserStats, ids: string[]): UserStats => {
  const merged = Array.from(new Set([...stats.badges, ...ids]));

  return merged.length === stats.badges.length
    ? stats
    : { ...stats, badges: merged };
};

/** Eşikleri karşılayan rozetleri ekler; rozetler asla geri alınmaz. */
export const withEarnedBadges = (stats: UserStats): UserStats => {
  const earned: string[] = [];

  if (stats.entries >= 1) earned.push('first_entry');
  if (stats.bestStreak >= 3) earned.push('streak_3');
  if (stats.bestStreak >= 7) earned.push('streak_7');
  if (stats.wins >= 1) earned.push('champion');

  return addBadges(stats, earned);
};

/**
 * Kullanıcı bir challenge'a katıldığında istatistiği günceller. Aynı (ya da
 * daha eski) challenge için tekrar çağrılırsa hiçbir şeyi değiştirmez;
 * Cloud Function tetikleyicileri "en az bir kez" çalıştığı için bu önemlidir.
 */
export const applyParticipation = (
  stats: UserStats,
  challengeStartsAtMs: number,
): UserStats => {
  if (challengeStartsAtMs <= stats.lastChallengeStartsAtMs) {
    return stats;
  }

  const gap = challengeStartsAtMs - stats.lastChallengeStartsAtMs;
  const continues = stats.lastChallengeStartsAtMs > 0 && gap <= MAX_CONSECUTIVE_GAP_MS;
  const streak = continues ? stats.streak + 1 : 1;

  return withEarnedBadges({
    ...stats,
    streak,
    bestStreak: Math.max(stats.bestStreak, streak),
    entries: stats.entries + 1,
    lastChallengeStartsAtMs: challengeStartsAtMs,
  });
};

/** Kullanıcının bir challenge'ı kazandığını kaydeder. */
export const applyWin = (stats: UserStats): UserStats =>
  withEarnedBadges({ ...stats, wins: stats.wins + 1 });

/** Bir çizim yeterli oya ulaştıysa "popüler" rozetini verir. */
export const applyPopularity = (stats: UserStats, voteCount: number): UserStats =>
  voteCount >= POPULAR_VOTE_THRESHOLD ? addBadges(stats, ['popular']) : stats;
