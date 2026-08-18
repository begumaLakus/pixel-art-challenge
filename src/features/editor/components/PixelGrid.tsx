import { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';

import { CyberArcade } from '@/constants/theme';

interface PixelGridProps {
  pixels: string[];
  resolution: number;
  onStrokeStart: () => void;
  onStrokeEnd: () => void;
  onPaintPixels: (indices: number[]) => void;
}

interface PixelCellProps {
  color: string;
  size: number;
  borderRadius: number;
  cellBorderWidth: number;
}

interface PixelRowProps {
  colors: string[];
  size: number;
  borderRadius: number;
  cellBorderWidth: number;
}

const MAX_GRID_SIZE = 430;
const HORIZONTAL_PADDING = 20;
const CELL_BORDER_COLOR = 'rgba(90, 75, 65, 0.18)';
const NO_INDEX = -1;

// styles.grid.borderWidth ile birebir aynı olmalı - hem çizim
// alanının gerçek boyutunu hem de dokunuş koordinatı dönüşümünü
// bu sabite göre hesaplıyoruz.
const GRID_BORDER_WIDTH = 2;

const PixelCell = memo(
  ({ color, size, borderRadius, cellBorderWidth }: PixelCellProps) => (
    <View
      pointerEvents="none"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderWidth: cellBorderWidth,
        borderColor: CELL_BORDER_COLOR,
        borderRadius,
      }}
    />
  ),
);

PixelCell.displayName = 'PixelCell';

const areRowPropsEqual = (
  prev: PixelRowProps,
  next: PixelRowProps,
): boolean => {
  if (
    prev.size !== next.size ||
    prev.borderRadius !== next.borderRadius ||
    prev.cellBorderWidth !== next.cellBorderWidth ||
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
  ({ colors, size, borderRadius, cellBorderWidth }: PixelRowProps) => (
    <View style={styles.row}>
      {colors.map((color, index) => (
        <PixelCell
          key={index}
          color={color}
          size={size}
          borderRadius={borderRadius}
          cellBorderWidth={cellBorderWidth}
        />
      ))}
    </View>
  ),
  areRowPropsEqual,
);

PixelRow.displayName = 'PixelRow';

export const PixelGrid = memo(
  ({
    pixels,
    resolution,
    onStrokeStart,
    onStrokeEnd,
    onPaintPixels,
  }: PixelGridProps) => {
    const { width } = useWindowDimensions();

    const gridSize = Math.min(width - HORIZONTAL_PADDING, MAX_GRID_SIZE);

   
    const contentSize = gridSize - GRID_BORDER_WIDTH * 2;
    const pixelSize = contentSize / resolution;

    const cellBorderWidth = resolution === 16 ? 0.45 : 0.3;
    const cellBorderRadius = resolution === 16 ? 1.5 : 1;

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

        
        const localX = x - GRID_BORDER_WIDTH;
        const localY = y - GRID_BORDER_WIDTH;

        const column = Math.floor(localX / pixelSize);
        const row = Math.floor(localY / pixelSize);

        if (
          column < 0 ||
          column >= resolution ||
          row < 0 ||
          row >= resolution
        ) {
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
          style={[
            styles.grid,
            {
              width: gridSize,
              height: gridSize,
              borderRadius: resolution === 16 ? 12 : 8,
            },
          ]}
        >
          {rows.map((rowColors, rowIndex) => (
            <PixelRow
              key={rowIndex}
              colors={rowColors}
              size={pixelSize}
              borderRadius={cellBorderRadius}
              cellBorderWidth={cellBorderWidth}
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

    // Çizim alanının kendisi BEYAZ kalacak.
    backgroundColor: '#FFFFFF',

    // Turuncu/amber çerçeve (marka rengi ile aynı: CyberArcade.gold)
    borderWidth: GRID_BORDER_WIDTH,
    borderColor: CyberArcade.gold,

    // Tema uyumlu, yumuşak glow gölge
    shadowColor: CyberArcade.gold,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6,
  },

  row: {
    flexDirection: 'row',
  },
});
