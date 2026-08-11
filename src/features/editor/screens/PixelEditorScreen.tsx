import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';

import { AntiqueColors } from '@/constants/theme';

import { PixelGrid } from '../components/PixelGrid';
import {
  usePixelEditor,
  type PixelResolution,
} from '../hooks/usePixelEditor';

const PALETTE = [
  '#FDFBF7',
  '#81C784',
  '#E57373',
  '#64B5F6',
  '#3E2723',
  '#FFD54F',
  '#9575CD',
];

export const PixelEditorScreen = () => {
  const colorScheme = useColorScheme();
  const theme =
    AntiqueColors[colorScheme === 'dark' ? 'dark' : 'light'];

  const {
    pixels,
    selectedColor,
    resolution,
    setSelectedColor,
    setResolution,
    paintPixel,
    resetPixels,
  } = usePixelEditor();

  const handleResolutionChange = (
    newResolution: PixelResolution,
  ): void => {
    setResolution(newResolution);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      <Text style={[styles.title, { color: theme.text }]}>
        Pixel Editor
      </Text>

      <PixelGrid
        pixels={pixels}
        resolution={resolution}
        onPixelPress={paintPixel}
      />

      <View style={styles.palette}>
        {PALETTE.map((color) => (
          <Pressable
            key={color}
            onPress={() => setSelectedColor(color)}
            style={[
              styles.color,
              {
                backgroundColor: color,
                borderColor:
                  selectedColor === color
                    ? theme.brass
                    : theme.placeholder,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.resolutionContainer}>
        <Text
          style={[
            styles.sectionLabel,
            { color: theme.text },
          ]}
        >
          Çözünürlük
        </Text>

        {[16, 32].map((size) => {
          const isSelected = resolution === size;

          return (
            <Pressable
              key={size}
              onPress={() =>
                handleResolutionChange(size as PixelResolution)
              }
              style={[
                styles.resolutionButton,
                {
                  backgroundColor: isSelected
                    ? theme.brass
                    : theme.background,
                  borderColor: theme.placeholder,
                },
              ]}
            >
              <Text
                style={{
                  color: isSelected
                    ? theme.background
                    : theme.text,
                }}
              >
                {size}×{size}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={[
          styles.resetButton,
          { borderColor: theme.placeholder },
        ]}
        onPress={resetPixels}
      >
        <Text style={{ color: theme.text }}>
          Temizle
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },
  palette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
    maxWidth: 300,
  },
  color: {
    width: 38,
    height: 38,
    borderWidth: 3,
    borderRadius: 8,
  },
  resolutionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
  },
  sectionLabel: {
    fontWeight: '600',
    marginRight: 4,
  },
  resolutionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 6,
  },
  resetButton: {
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderRadius: 8,
  },
});