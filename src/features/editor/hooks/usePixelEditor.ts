import { useCallback, useMemo, useRef, useState } from 'react';

import { floodFill, withMirror } from '../utils/pixelOps';
import {
  MAX_ENCODED_LENGTH,
  diffToStep,
  encodeSteps,
  type Step,
} from '../utils/timelapse';

export type PixelResolution = 16 | 32;
export type EditorTool = 'paint' | 'erase' | 'fill' | 'pick';

interface UsePixelEditorResult {
  pixels: string[];
  selectedColor: string;
  resolution: PixelResolution;
  tool: EditorTool;
  mirror: boolean;
  canUndo: boolean;
  canRedo: boolean;
  hasContent: boolean;
  selectColor: (color: string) => void;
  setTool: (tool: EditorTool) => void;
  toggleMirror: () => void;
  setResolution: (resolution: PixelResolution) => void;
  paintPixels: (indices: number[]) => void;
  beginStroke: () => void;
  endStroke: () => void;
  undo: () => void;
  redo: () => void;
  clearAll: () => void;
  /** Çizimin adım adım kaydı (time-lapse); çok uzunsa boş string. */
  getMoves: () => string;
}

export const BACKGROUND_COLOR = '#FDFBF7';
const DEFAULT_RESOLUTION: PixelResolution = 16;
const DEFAULT_BRUSH_COLOR = '#151515';
const MAX_HISTORY_DEPTH = 30;

export const createEmptyGrid = (resolution: PixelResolution): string[] =>
  Array.from({ length: resolution * resolution }, () => BACKGROUND_COLOR);

/**
 * Verilen indekslere rengi uygulayan saf (pure) fonksiyon. Değişiklik
 * yoksa orijinal diziyle aynı referansı döndürür (immutability +
 * gereksiz re-render'ları önlemek için); değişiklik varsa yeni bir
 * dizi döner, kaynak dizi mutate edilmez. Aralık dışı indeksler
 * sessizce yok sayılır.
 */
export const applyPaint = (
  pixels: string[],
  indices: number[],
  color: string,
): { next: string[]; changed: boolean } => {
  let next = pixels;

  for (const index of indices) {
    if (index < 0 || index >= pixels.length) {
      continue;
    }

    if (pixels[index] !== color) {
      if (next === pixels) {
        next = pixels.slice();
      }
      next[index] = color;
    }
  }

  return { next, changed: next !== pixels };
};

/**
 * Undo geçmişine yeni bir snapshot ekleyen saf (pure) fonksiyon.
 * `maxDepth`'i aşan en eski snapshot(lar) FIFO sırayla düşürülür.
 * Kaynak `history` dizisi mutate edilmez.
 */
export const appendHistorySnapshot = (
  history: string[][],
  snapshot: string[],
  maxDepth: number,
): string[][] => {
  const next = [...history, snapshot];

  if (next.length > maxDepth) {
    return next.slice(next.length - maxDepth);
  }

  return next;
};

export const usePixelEditor = (): UsePixelEditorResult => {
  const [resolution, setResolutionState] =
    useState<PixelResolution>(DEFAULT_RESOLUTION);

  const [pixels, setPixelsState] = useState<string[]>(() =>
    createEmptyGrid(DEFAULT_RESOLUTION),
  );

  const [selectedColor, setSelectedColor] =
    useState<string>(DEFAULT_BRUSH_COLOR);

  const [tool, setTool] = useState<EditorTool>('paint');
  const [mirror, setMirror] = useState<boolean>(false);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  // Dokunma olayları render'dan hızlı geldiği için güncel değerler
  // senkron ref'lerde de tutulur; stale closure ve kayıp çizim olmaz.
  const pixelsRef = useRef<string[]>(pixels);
  const resolutionRef = useRef<PixelResolution>(DEFAULT_RESOLUTION);
  const toolRef = useRef<EditorTool>('paint');
  const colorRef = useRef<string>(DEFAULT_BRUSH_COLOR);
  const mirrorRef = useRef<boolean>(false);

  // Undo/redo: her stroke (dokunma-sürükleme-bırakma) veya "temizle"
  // aksiyonundan ÖNCEKİ grid snapshot'ı tutulur.
  const undoRef = useRef<string[][]>([]);
  const redoRef = useRef<string[][]>([]);
  // Time-lapse kaydı: undo yığını gibi sınırlanmaz, çizimin tamamını tutar.
  const appliedStepsRef = useRef<Step[]>([]);
  const redoStepsRef = useRef<Step[]>([]);
  const strokeSnapshotRef = useRef<string[] | null>(null);
  const strokeDirtyRef = useRef<boolean>(false);
  // Kova ve pipet bir stroke boyunca yalnızca ilk dokunuşta çalışır.
  const strokeActedRef = useRef<boolean>(false);

  const commitPixels = useCallback((next: string[]): void => {
    pixelsRef.current = next;
    setPixelsState(next);
  }, []);

  const syncHistoryFlags = useCallback((): void => {
    setCanUndo(undoRef.current.length > 0);
    setCanRedo(redoRef.current.length > 0);
  }, []);

  /** `snapshot` (önceki hâl) -> `next` geçişini geçmişe ve time-lapse'a yazar. */
  const commitHistory = useCallback(
    (snapshot: string[], next: string[]): void => {
      undoRef.current = appendHistorySnapshot(
        undoRef.current,
        snapshot,
        MAX_HISTORY_DEPTH,
      );
      appliedStepsRef.current.push(diffToStep(snapshot, next));
      // Yeni bir değişiklik "ileri al" geçmişini geçersiz kılar.
      redoRef.current = [];
      redoStepsRef.current = [];
      syncHistoryFlags();
    },
    [syncHistoryFlags],
  );

  const selectColor = useCallback((color: string): void => {
    colorRef.current = color;
    setSelectedColor(color);

    // Renk seçmek, silgi/pipet gibi araçtan kalem'e döndürür; kova
    // seçiliyken renk değiştirmek ise kova olarak kalır.
    if (toolRef.current === 'erase' || toolRef.current === 'pick') {
      toolRef.current = 'paint';
      setTool('paint');
    }
  }, []);

  const changeTool = useCallback((nextTool: EditorTool): void => {
    toolRef.current = nextTool;
    setTool(nextTool);
  }, []);

  const toggleMirror = useCallback((): void => {
    mirrorRef.current = !mirrorRef.current;
    setMirror(mirrorRef.current);
  }, []);

  const changeResolution = useCallback(
    (newResolution: PixelResolution): void => {
      undoRef.current = [];
      redoRef.current = [];
      appliedStepsRef.current = [];
      redoStepsRef.current = [];
      strokeSnapshotRef.current = null;
      strokeDirtyRef.current = false;
      resolutionRef.current = newResolution;

      syncHistoryFlags();
      setResolutionState(newResolution);
      commitPixels(createEmptyGrid(newResolution));
    },
    [commitPixels, syncHistoryFlags],
  );

  const beginStroke = useCallback((): void => {
    strokeSnapshotRef.current = pixelsRef.current;
    strokeDirtyRef.current = false;
    strokeActedRef.current = false;
  }, []);

  const paintPixels = useCallback(
    (indices: number[]): void => {
      if (indices.length === 0) {
        return;
      }

      const activeTool = toolRef.current;
      const size = resolutionRef.current;

      if (activeTool === 'pick') {
        if (strokeActedRef.current) {
          return;
        }
        strokeActedRef.current = true;

        const picked = pixelsRef.current[indices[0]];

        if (picked !== undefined && picked !== BACKGROUND_COLOR) {
          colorRef.current = picked;
          setSelectedColor(picked);
          toolRef.current = 'paint';
          setTool('paint');
        }

        return;
      }

      if (activeTool === 'fill') {
        if (strokeActedRef.current) {
          return;
        }
        strokeActedRef.current = true;

        let working = pixelsRef.current;
        let changed = false;

        for (const start of withMirror([indices[0]], size, mirrorRef.current)) {
          const result = floodFill(working, size, start, colorRef.current);

          if (result.changed) {
            working = result.next;
            changed = true;
          }
        }

        if (changed) {
          strokeDirtyRef.current = true;
          commitPixels(working);
        }

        return;
      }

      const color = activeTool === 'erase' ? BACKGROUND_COLOR : colorRef.current;
      const targets = withMirror(indices, size, mirrorRef.current);
      const { next, changed } = applyPaint(pixelsRef.current, targets, color);

      if (changed) {
        strokeDirtyRef.current = true;
        commitPixels(next);
      }
    },
    [commitPixels],
  );

  const endStroke = useCallback((): void => {
    const snapshot = strokeSnapshotRef.current;
    strokeSnapshotRef.current = null;

    // Sadece gerçekten bir değişiklik olduysa geçmişe yazılır; boş bir
    // dokunuş (ör. boş alana silgiyle basmak) undo yığınını kirletmez.
    if (snapshot !== null && strokeDirtyRef.current) {
      commitHistory(snapshot, pixelsRef.current);
    }

    strokeDirtyRef.current = false;
  }, [commitHistory]);

  const undo = useCallback((): void => {
    const previous = undoRef.current.pop();

    if (previous === undefined) {
      return;
    }

    redoRef.current.push(pixelsRef.current);
    const undoneStep = appliedStepsRef.current.pop();

    if (undoneStep) {
      redoStepsRef.current.push(undoneStep);
    }

    commitPixels(previous);
    syncHistoryFlags();
  }, [commitPixels, syncHistoryFlags]);

  const redo = useCallback((): void => {
    const next = redoRef.current.pop();

    if (next === undefined) {
      return;
    }

    undoRef.current.push(pixelsRef.current);
    const redoneStep = redoStepsRef.current.pop();

    if (redoneStep) {
      appliedStepsRef.current.push(redoneStep);
    }

    commitPixels(next);
    syncHistoryFlags();
  }, [commitPixels, syncHistoryFlags]);

  const clearAll = useCallback((): void => {
    const empty = createEmptyGrid(resolutionRef.current);

    commitHistory(pixelsRef.current, empty);
    commitPixels(empty);
  }, [commitPixels, commitHistory]);

  const getMoves = useCallback((): string => {
    const encoded = encodeSteps(appliedStepsRef.current);

    return encoded.length > MAX_ENCODED_LENGTH ? '' : encoded;
  }, []);

  const hasContent = useMemo(
    () => pixels.some((color) => color !== BACKGROUND_COLOR),
    [pixels],
  );

  return {
    pixels,
    selectedColor,
    resolution,
    tool,
    mirror,
    canUndo,
    canRedo,
    hasContent,
    selectColor,
    setTool: changeTool,
    toggleMirror,
    setResolution: changeResolution,
    paintPixels,
    beginStroke,
    endStroke,
    undo,
    redo,
    clearAll,
    getMoves,
  };
};
