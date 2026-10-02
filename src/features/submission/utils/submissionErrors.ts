const DUPLICATE_MESSAGE = 'Bu challenge için zaten bir çizim gönderdiniz.';

/**
 * Çizim gönderirken oluşan hatayı kullanıcıya gösterilecek mesaja çevirir.
 * Sunucu kuralları (süre dolmuş, mükerrer gönderi) Firestore'da
 * `permission-denied` olarak döner; ham teknik metin arayüze sızmaz.
 */
export const getSubmissionErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message === DUPLICATE_MESSAGE) {
    return 'Bu challenge için zaten bir çizim gönderdin.';
  }

  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  if (code.includes('permission-denied')) {
    return 'Bu challenge artık çizim kabul etmiyor ya da zaten katıldın.';
  }

  if (code.includes('unavailable') || code.includes('network')) {
    return 'Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.';
  }

  return 'Çizim gönderilemedi. Birazdan tekrar dene.';
};
