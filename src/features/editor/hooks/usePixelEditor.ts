import { useCallback, useMemo, useState } from 'react';

export type PixelResolution = 16 | 32;

const DEFAULT_COLOR = '#FDFBF7';
const DEFAULT_RESOLUTION: PixelResolution = 16;

interface UsePixelEditorResult {
  pixels: string[];
  selectedColor: string;
  resolution: PixelResolution;
  setSelectedColor: (color: string) => void;
  setResolution: (resolution: PixelResolution) => void;
  paintPixel: (index: number) => void;
  resetPixels: () => void;
}

const createEmptyGrid = (resolution: PixelResolution): string[] =>
  Array.from(
    { length: resolution * resolution },
    () => DEFAULT_COLOR,
  );

export const usePixelEditor = (): UsePixelEditorResult => {
  const [resolution, setResolution] =
    useState<PixelResolution>(DEFAULT_RESOLUTION);

  const [pixels, setPixels] = useState<string[]>(
    createEmptyGrid(DEFAULT_RESOLUTION),
  );

  const [selectedColor, setSelectedColor] =
    useState<string>('#3E2723');

  const changeResolution = useCallback(
    (newResolution: PixelResolution): void => {
      setResolution(newResolution);
      setPixels(createEmptyGrid(newResolution));
    },
    [],
  );

  const paintPixel = useCallback(
    (index: number): void => {
      setPixels((currentPixels) => {
        const updatedPixels = [...currentPixels];

        updatedPixels[index] = selectedColor;

        return updatedPixels;
      });
    },
    [selectedColor],
  );

  const resetPixels = useCallback((): void => {
    setPixels(createEmptyGrid(resolution));
  }, [resolution]);

  return useMemo(
    () => ({
      pixels,
      selectedColor,
      resolution,
      setSelectedColor,
      setResolution: changeResolution,
      paintPixel,
      resetPixels,
    }),
    [
      pixels,
      selectedColor,
      resolution,
      changeResolution,
      paintPixel,
      resetPixels,
    ],
  );
};