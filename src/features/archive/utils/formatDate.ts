const MONTHS_TR = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

/**
 * "12 Mart 2026" biçiminde Türkçe tarih. Eski dokümanlarda tarih alanı eksik
 * olabileceği için `toDate()` doğrudan çağrılmaz; okunamazsa `null` döner.
 */
export const formatTurkishDate = (
  value: { toDate?: () => Date } | null | undefined,
): string | null => {
  const date = value?.toDate?.();

  if (!date || Number.isNaN(date.getTime())) {
    return null;
  }

  return `${date.getDate()} ${MONTHS_TR[date.getMonth()]} ${date.getFullYear()}`;
};
