import { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';

import { colors } from '@/src/theme';

interface PixelGridProps {
  pixels: string[];
  resolution: number;
  /** Çizim alanının en fazla kenar uzunluğu (px); hücreler tam piksele yuvarlanır. */
  size: number;
  onStrokeStart: () => void;
  onStrokeEnd: () => void;
  onPaintPixels: (indices: number[]) => void;
}

interface PixelCellProps {
  color: string;
  size: number;
  borderWidth: number;
}

interface PixelRowProps {
  colors: string[];
  size: number;
  borderWidth: number;
}

const NO_INDEX = -1;

const PixelCell = memo(({ color, size, borderWidth }: PixelCellProps) => (
  <View
    pointerEvents="none"
    style={{
      width: size,
      height: size,
      backgroundColor: color,
      borderWidth,
      borderColor: colors.gridLine,
    }}
  />
));

PixelCell.displayName = 'PixelCell';

const areRowPropsEqual = (prev: PixelRowProps, next: PixelRowProps): boolean => {
  if (
    prev.size !== next.size ||
    prev.borderWidth !== next.borderWidth ||
    prev.colors.length !== next.colors.length
  ) {
    return false;
  }

  for (let index = 0; index < prev.colors.length; index += 1) {
    if (prev.colors[index] !== next.colors[index]) {
      return false;
    }
  }

  return true;
};

const PixelRow = memo(
  ({ colors: rowColors, size, borderWidth }: PixelRowProps) => (
    <View style={styles.row}>
      {rowColors.map((color, index) => (
        <PixelCell key={index} color={color} size={size} borderWidth={borderWidth} />
      ))}
    </View>
  ),
  areRowPropsEqual,
);

PixelRow.displayName = 'PixelRow';

/**
 * Dokunmatik çizim ızgarası. Sürükleme sırasında atlanan hücreler çizgi
 * interpolasyonuyla doldurulur; yalnızca değişen satırlar yeniden çizilir.
 */
export const PixelGrid = memo(
  ({
    pixels,
    resolution,
    size,
    onStrokeStart,
    onStrokeEnd,
    onPaintPixels,
  }: PixelGridProps) => {
    const pixelSize = Math.floor(size / resolution);
    const gridSize = pixelSize * resolution;
    const borderWidth = resolution === 16 ? 0.5 : 0.35;

    const rows = useMemo(() => {
      const result: string[][] = [];

      for (let row = 0; row < resolution; row += 1) {
        result.push(pixels.slice(row * resolution, (row + 1) * resolution));
      }

      return result;
    }, [pixels, resolution]);

    const lastIndex = useSharedValue<number>(NO_INDEX);

    const getPixelIndex = useCallback(
      (x: number, y: number): number => {
        'worklet';

        const column = Math.floor(x / pixelSize);
        const row = Math.floor(y / pixelSize);

        if (column < 0 || column >= resolution || row < 0 || row >= resolution) {
          return NO_INDEX;
        }

        return row * resolution + column;
      },
      [pixelSize, resolution],
    );

    const getLineIndices = useCallback(
      (startIndex: number, endIndex: number): number[] => {
        'worklet';

        const startRow = Math.floor(startIndex / resolution);
        const startColumn = startIndex % resolution;
        const endRow = Math.floor(endIndex / resolution);
        const endColumn = endIndex % resolution;

        const deltaColumn = endColumn - startColumn;
        const deltaRow = endRow - startRow;
        const steps = Math.max(Math.abs(deltaColumn), Math.abs(deltaRow));

        const indices: number[] = [];

        for (let step = 0; step <= steps; step += 1) {
          const progress = steps === 0 ? 0 : step / steps;
          const column = Math.round(startColumn + deltaColumn * progress);
          const row = Math.round(startRow + deltaRow * progress);

          indices.push(row * resolution + column);
        }

        return indices;
      },
      [resolution],
    );

    const paintAt = useCallback(
      (x: number, y: number, isNewStroke: boolean): void => {
        'worklet';

        const currentIndex = getPixelIndex(x, y);

        if (currentIndex === NO_INDEX) {
          return;
        }

        const previousIndex = lastIndex.value;

        if (!isNewStroke && previousIndex === currentIndex) {
          return;
        }

        const indices =
          !isNewStroke && previousIndex !== NO_INDEX
            ? getLineIndices(previousIndex, currentIndex)
            : [currentIndex];

        lastIndex.value = currentIndex;

        runOnJS(onPaintPixels)(indices);
      },
      [getPixelIndex, getLineIndices, onPaintPixels, lastIndex],
    );

    const gesture = Gesture.Pan()
      .maxPointers(1)
      .minDistance(0)
      .shouldCancelWhenOutside(false)
      .onTouchesDown((event) => {
        'worklet';

        const touch = event.changedTouches[0];

        if (!touch) {
          return;
        }

        lastIndex.value = NO_INDEX;
        runOnJS(onStrokeStart)();
        paintAt(touch.x, touch.y, true);
      })
      .onTouchesMove((event) => {
        'worklet';

        const touch = event.changedTouches[0];

        if (!touch) {
          return;
        }

        paintAt(touch.x, touch.y, false);
      })
      .onTouchesUp(() => {
        'worklet';

        lastIndex.value = NO_INDEX;
        runOnJS(onStrokeEnd)();
      })
      .onTouchesCancelled(() => {
        'worklet';

        lastIndex.value = NO_INDEX;
        runOnJS(onStrokeEnd)();
      });

    return (
      <GestureDetector gesture={gesture}>
        <View
          accessibilityLabel="Çizim tuvali"
          style={[styles.grid, { width: gridSize, height: gridSize }]}
        >
          {rows.map((rowColors, rowIndex) => (
            <PixelRow
              key={rowIndex}
              colors={rowColors}
              size={pixelSize}
              borderWidth={borderWidth}
            />
          ))}
        </View>
      </GestureDetector>
    );
  },
);

PixelGrid.displayName = 'PixelGrid';

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: colors.canvasBackground,
  },
  row: { flexDirection: 'row' },
});
