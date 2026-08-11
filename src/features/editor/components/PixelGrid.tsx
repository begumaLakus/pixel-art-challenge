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

export const PixelGrid = ({
  pixels,
  resolution,
  onPixelPress,
}: PixelGridProps) => {
  const { width } = useWindowDimensions();

  const gridSize = Math.min(width - 32, 380);
  const pixelSize = gridSize / resolution;

  const paintFromTouch = (
    locationX: number,
    locationY: number,
  ): void => {
    const column = Math.floor(locationX / pixelSize);
    const row = Math.floor(locationY / pixelSize);

    if (
      column < 0 ||
      column >= resolution ||
      row < 0 ||
      row >= resolution
    ) {
      return;
    }

    const index = row * resolution + column;

    onPixelPress(index);
  };

  return (
    <View
      style={[
        styles.grid,
        {
          width: gridSize,
          height: gridSize,
        },
      ]}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(event) => {
        paintFromTouch(
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
    >
      {pixels.map((color, index) => (
        <View
          key={index}
          style={[
            styles.pixel,
            {
              width: pixelSize,
              height: pixelSize,
              backgroundColor: color,
            },
          ]}
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
  },
  pixel: {
    borderWidth: 0.2,
    borderColor: '#9E9E9E',
  },
});