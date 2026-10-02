import { useCallback, useEffect, useMemo, useState } from 'react';

import { BACKGROUND_COLOR } from '@/src/features/editor/hooks/usePixelEditor';
import {
  decodeSteps,
  getStepIntervalMs,
  replaySteps,
} from '@/src/features/editor/utils/timelapse';

interface UseTimelapseResult {
  pixels: string[];
  stepIndex: number;
  totalSteps: number;
  playing: boolean;
  finished: boolean;
  togglePlaying: () => void;
  replay: () => void;
}

/**
 * Kayıtlı çizim adımlarını zamanla ilerleterek oynatır. `active` false iken
 * (modal kapalıyken) zamanlayıcı çalışmaz; açıldığında baştan başlar.
 */
export const useTimelapse = (
  moves: string | undefined,
  resolution: number,
  active: boolean,
): UseTimelapseResult => {
  const steps = useMemo(
    () => decodeSteps(moves, resolution),
    [moves, resolution],
  );

  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (active) {
      setStepIndex(0);
      setPlaying(true);
    }
  }, [active]);

  useEffect(() => {
    if (!active || !playing) {
      return;
    }

    if (stepIndex >= steps.length) {
      setPlaying(false);
      return;
    }

    const timeout = setTimeout(
      () => setStepIndex((current) => current + 1),
      getStepIntervalMs(steps.length),
    );

    return () => clearTimeout(timeout);
  }, [active, playing, stepIndex, steps.length]);

  const pixels = useMemo(
    () => replaySteps(steps, resolution, stepIndex, BACKGROUND_COLOR),
    [steps, resolution, stepIndex],
  );

  const finished = stepIndex >= steps.length;

  const togglePlaying = useCallback(() => {
    // Bittiyse "oynat" baştan başlatır.
    if (!playing && stepIndex >= steps.length) {
      setStepIndex(0);
      setPlaying(true);
      return;
    }

    setPlaying((current) => !current);
  }, [playing, stepIndex, steps.length]);

  const replay = useCallback(() => {
    setStepIndex(0);
    setPlaying(true);
  }, []);

  return {
    pixels,
    stepIndex,
    totalSteps: steps.length,
    playing,
    finished,
    togglePlaying,
    replay,
  };
};
