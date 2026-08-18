import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type PixelResolution = 16 | 32;
export type EditorTool = 'paint' | 'erase';

interface UsePixelEditorResult {
  pixels: string[];
  selectedColor: string;
  resolution: PixelResolution;
  tool: EditorTool;
  canUndo: boolean;
  hasContent: boolean;
  selectColor: (color: string) => void;
  setTool: (tool: EditorTool) => void;
  setResolution: (resolution: PixelResolution) => void;
  paintPixels: (indices: number[]) => void;
  beginStroke: () => void;
  endStroke: () => void;
  undo: () => void;
  clearAll: () => void;
}

const BACKGROUND_COLOR = '#FDFBF7';
const DEFAULT_RESOLUTION: PixelResolution = 16;
const DEFAULT_BRUSH_COLOR = '#3E2723';
const MAX_HISTORY_DEPTH = 20;

const createEmptyGrid = (resolution: PixelResolution): string[] =>
  Array.from({ length: resolution * resolution }, () => BACKGROUND_COLOR);

export const usePixelEditor = (): UsePixelEditorResult => {
  const [resolution, setResolutionState] =
    useState<PixelResolution>(DEFAULT_RESOLUTION);

  const [pixels, setPixels] = useState<string[]>(() =>
    createEmptyGrid(DEFAULT_RESOLUTION),
  );

  const [selectedColor, setSelectedColorState] =
    useState<string>(DEFAULT_BRUSH_COLOR);

  const [tool, setTool] = useState<EditorTool>('paint');
  const [canUndo, setCanUndo] = useState<boolean>(false);

  // Her render'da güncel `pixels` değerine event handler'lardan
  // (stale closure riski olmadan) erişebilmek için.
  const pixelsRef = useRef<string[]>(pixels);

  // Undo geçmişi: her stroke (dokunma-sürükleme-bırakma) veya
  // "Tümünü Temizle" aksiyonundan ÖNCEKİ grid snapshot'ı tutulur.
  const historyRef = useRef<string[][]>([]);
  const strokeSnapshotRef = useRef<string[] | null>(null);
  const strokeDirtyRef = useRef<boolean>(false);

  useEffect(() => {
    pixelsRef.current = pixels;
  }, [pixels]);

  const pushHistory = useCallback((snapshot: string[]): void => {
    historyRef.current.push(snapshot);

    if (historyRef.current.length > MAX_HISTORY_DEPTH) {
      historyRef.current.shift();
    }

    setCanUndo(true);
  }, []);

  const selectColor = useCallback((color: string): void => {
    setSelectedColorState(color);
   

    setTool('paint');
  }, []);

  const changeResolution = useCallback(
    (newResolution: PixelResolution): void => {
      historyRef.current = [];
      strokeSnapshotRef.current = null;
      strokeDirtyRef.current = false;

      setCanUndo(false);
      setResolutionState(newResolution);
      setPixels(createEmptyGrid(newResolution));
    },
    [],
  );

  const beginStroke = useCallback((): void => {
    strokeSnapshotRef.current = pixelsRef.current;
    strokeDirtyRef.current = false;
  }, []);

  const paintPixels = useCallback(
    (indices: number[]): void => {
      if (indices.length === 0) {
        return;
      }

      const color = tool === 'erase' ? BACKGROUND_COLOR : selectedColor;

      setPixels((current) => {
        let next = current;

        for (const index of indices) {
          if (index < 0 || index >= current.length) {
            continue;
          }

          if (current[index] !== color) {
            if (next === current) {
              next = current.slice();
            }
            next[index] = color;
          }
        }

        if (next !== current) {
          strokeDirtyRef.current = true;
        }

        return next;
      });
    },
    [tool, selectedColor],
  );

  const endStroke = useCallback((): void => {
    const snapshot = strokeSnapshotRef.current;
    strokeSnapshotRef.current = null;

    // Sadece gerçekten bir değişiklik olduysa geçmişe yazılır
    // boş bir dokunuş (ör. boş alana silgiyle basmak) undo yığınını
    // gereksiz kaydetmez.
    if (snapshot !== null && strokeDirtyRef.current) {
      pushHistory(snapshot);
    }

    strokeDirtyRef.current = false;
  }, [pushHistory]);

  const undo = useCallback((): void => {
    const previous = historyRef.current.pop();

    if (previous === undefined) {
      return;
    }

    setPixels(previous);
    setCanUndo(historyRef.current.length > 0);
  }, []);

  const clearAll = useCallback((): void => {
    pushHistory(pixelsRef.current);
    setPixels(createEmptyGrid(resolution));
  }, [pushHistory, resolution]);

  const hasContent = useMemo(
    () => pixels.some((color) => color !== BACKGROUND_COLOR),
    [pixels],
  );

  return {
    pixels,
    selectedColor,
    resolution,
    tool,
    canUndo,
    hasContent,
    selectColor,
    setTool,
    setResolution: changeResolution,
    paintPixels,
    beginStroke,
    endStroke,
    undo,
    clearAll,
  };
};
