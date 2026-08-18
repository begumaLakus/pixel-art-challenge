import { useEffect, useState } from 'react';
import type { Timestamp } from 'firebase/firestore';

/**
 * `useCountdown`dan farklı olarak saniyede bir tick atmaz; sadece
 * challenge'ın bitiş anında TEK SEFERLİK bir `setTimeout` ile false->true
 * geçişini üretir. "PIXEL ART OLUŞTUR" butonunu disable etmek gibi, saniye
 * hassasiyeti gerekmeyen ama görsel geri sayımdan bağımsız kalması gereken
 * tüketiciler için kullanılır — böylece o component saniyede bir değil,
 * challenge bittiğinde sadece bir kez re-render olur.
 */
export const useChallengeHasEnded = (endsAt: Timestamp | undefined): boolean => {
  const endMillis = endsAt?.toMillis() ?? null;

  const [hasEnded, setHasEnded] = useState<boolean>(() =>
    endMillis === null ? true : endMillis - Date.now() <= 0,
  );

  useEffect(() => {
    if (endMillis === null) {
      setHasEnded(true);
      return;
    }

    const remaining = endMillis - Date.now();

    if (remaining <= 0) {
      setHasEnded(true);
      return;
    }

    setHasEnded(false);

    const timeout = setTimeout(() => {
      setHasEnded(true);
    }, remaining);

    return () => clearTimeout(timeout);
  }, [endMillis]);

  return hasEnded;
};
