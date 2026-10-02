/** Challenge bitmeden kaç ms önce hatırlatılacağı. */
export const REMINDER_LEAD_MS = 2 * 60 * 60 * 1000;

/** Hatırlatmanın şimdiden en az bu kadar sonra olması gerekir (geçmişe zamanlanmaz). */
const MIN_FUTURE_MS = 60 * 1000;

/**
 * "Challenge bitiyor" hatırlatmasının zamanı: bitişten 2 saat önce. Bu an
 * geçmişteyse (ya da çok yakınsa) hatırlatma zamanlanmaz ve null döner.
 */
export const getReminderTime = (
  endsAtMs: number,
  nowMs: number,
  leadMs: number = REMINDER_LEAD_MS,
): Date | null => {
  const at = endsAtMs - leadMs;

  return at - nowMs >= MIN_FUTURE_MS ? new Date(at) : null;
};
