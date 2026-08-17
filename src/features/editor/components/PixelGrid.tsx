import { useRef } from 'react';
import {
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

interface PixelGridProps {
  pixels: string[];
  resolution: number;
  onPixelPress: (index: number) => void;
}

const MAX_GRID_SIZE = 430;
const HORIZONTAL_PADDING = 20;

export const PixelGrid = ({
  pixels,
  resolution,
  onPixelPress,
}: PixelGridProps) => {
  const { width } = useWindowDimensions();

  const gridSize = Math.min(
    width - HORIZONTAL_PADDING,
    MAX_GRID_SIZE,
  );

  const pixelSize = gridSize / resolution;

  const lastPixelRef = useRef<number | null>(null);

  const getPixelIndex = (
    locationX: number,
    locationY: number,
  ): number | null => {
    const column = Math.floor(locationX / pixelSize);
    const row = Math.floor(locationY / pixelSize);

    if (
      column < 0 ||
      column >= resolution ||
      row < 0 ||
      row >= resolution
    ) {
      return null;
    }

    return row * resolution + column;
  };

  const paintLine = (
    startIndex: number,
    endIndex: number,
  ): void => {
    const startRow = Math.floor(startIndex / resolution);
    const startColumn = startIndex % resolution;

    const endRow = Math.floor(endIndex / resolution);
    const endColumn = endIndex % resolution;

    const deltaColumn = endColumn - startColumn;
    const deltaRow = endRow - startRow;

    const steps = Math.max(
      Math.abs(deltaColumn),
      Math.abs(deltaRow),
    );

    for (let step = 0; step <= steps; step += 1) {
      const progress =
        steps === 0 ? 0 : step / steps;

      const column = Math.round(
        startColumn + deltaColumn * progress,
      );

      const row = Math.round(
        startRow + deltaRow * progress,
      );

      const index = row * resolution + column;

      onPixelPress(index);
    }
  };

  const paintFromTouch = (
    locationX: number,
    locationY: number,
  ): void => {
    const currentIndex = getPixelIndex(
      locationX,
      locationY,
    );

    if (currentIndex === null) {
      return;
    }

    const previousIndex = lastPixelRef.current;

    if (
      previousIndex !== null &&
      previousIndex !== currentIndex
    ) {
      paintLine(previousIndex, currentIndex);
    } else {
      onPixelPress(currentIndex);
    }

    lastPixelRef.current = currentIndex;
  };

  const handleTouchStart = (
    locationX: number,
    locationY: number,
  ): void => {
    lastPixelRef.current = null;

    paintFromTouch(locationX, locationY);
  };

  const handleTouchEnd = (): void => {
    lastPixelRef.current = null;
  };

  return (
    <View
      style={[
        styles.grid,
        {
          width: gridSize,
          height: gridSize,
          borderRadius:
            resolution === 16 ? 12 : 8,
        },
      ]}
      onStartShouldSetResponderCapture={() => true}
      onMoveShouldSetResponderCapture={() => true}
      onResponderGrant={(event) => {
        handleTouchStart(
          event.nativeEvent.locationX,
          event.nativeEvent.locationY,
        );
      }}
      onResponderMove={(event) => {
        paintFromTouch(
          event.nativeEvent.locationX,
          event.nativeEvent.locationY,
        );
      }}
      onResponderRelease={handleTouchEnd}
      onResponderTerminate={handleTouchEnd}
    >
      {pixels.map((color, index) => (
        <View
          key={index}
          pointerEvents="none"
          style={{
            width: pixelSize,
            height: pixelSize,
            backgroundColor: color,

            // Pixel grid çizgileri
            borderWidth:
              resolution === 16 ? 0.45 : 0.3,
            borderColor:
              'rgba(90, 75, 65, 0.18)',

            borderRadius:
              resolution === 16 ? 1.5 : 1,
          }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',

    // Çizim alanının kendisi BEYAZ kalacak.
    backgroundColor: '#FFFFFF',

    // Turuncu/amber çerçeve
    borderWidth: 2,
    borderColor: '#FFB703',

    // Hafif tema uyumlu gölge
    shadowColor: '#FFB703',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
});