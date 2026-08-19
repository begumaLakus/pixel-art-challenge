import type { Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';

interface UseCountdownResult {
  timeLeft: number;
  hasEnded: boolean;
  formatted: string;
}

export const formatTimeLeft = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((unit) => String(unit).padStart(2, '0'))
    .join(':');
};

/**
 * Saniye başına güncellenen geri sayım. `endsAt` yerine türetilmiş
 * `endMillis` (primitive) değerine bağımlıdır — orijinal kodda `[challenge]`
 * (tüm nesne referansı) bağımlılık olarak kullanılıyordu ve
 * useActiveChallenge her poll'da yeni bir referans döndürdüğü için interval
 * her seferinde gereksiz yere durdurulup yeniden başlatılıyordu. Bu hook
 * ayrıca kendi component'ine izole edildiği için üst ekranın her saniye
 * yeniden render olmasını da engeller.
 */
export const useCountdown = (endsAt: Timestamp | undefined): UseCountdownResult => {
  const endMillis = endsAt?.toMillis() ?? null;

  const [timeLeft, setTimeLeft] = useState<number>(() =>
    endMillis === null ? 0 : Math.max(0, endMillis - Date.now()),
  );

  useEffect(() => {
    if (endMillis === null) {
      setTimeLeft(0);
      return;
    }

    const tick = () => {
      setTimeLeft(Math.max(0, endMillis - Date.now()));
    };

    tick();
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [endMillis]);

  const hasEnded = timeLeft <= 0;

  return {
    timeLeft,
    hasEnded,
    formatted: hasEnded ? '00:00:00' : formatTimeLeft(timeLeft),
  };
};
