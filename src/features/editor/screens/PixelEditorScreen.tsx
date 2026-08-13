import { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';

import { AntiqueColors } from '@/constants/theme';

import { createSubmission } from '../../submission/services/submissionService';
import { PixelGrid } from '../components/PixelGrid';

import {
  usePixelEditor,
  type PixelResolution,
} from '../hooks/usePixelEditor';

interface PixelEditorScreenProps {
  challengeId: string;
}

const PALETTE = [
  '#FFFDFC', // parlak kırık beyaz
  '#F2C1CF', // pastel pembe
  '#D99AAE', // toz pembe
  '#C7E6D8', // açık su yeşili
  '#8FC8B5', // su yeşili
  '#A9D8C5', // yumuşak yeşil
  '#B8CFC6', // gri-yeşil
  '#6F8179', // koyu yeşil-gri
];

export const PixelEditorScreen = ({
  challengeId,
}: PixelEditorScreenProps) => {
  const colorScheme = useColorScheme();

  const theme =
    AntiqueColors[colorScheme === 'dark' ? 'dark' : 'light'];

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (): Promise<void> => {
    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);

      await createSubmission({
        challengeId,
        pixels,
        resolution,
      });

      Alert.alert(
        'Başarılı',
        'Pixel art çalışman başarıyla gönderildi.',
      );
    } catch (error) {
      console.error('Submission oluşturulamadı:', error);

      Alert.alert(
        'Hata',
        'Pixel art gönderilirken bir hata oluştu. Lütfen tekrar deneyin.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <Text
        style={[
          styles.title,
          {
            color: theme.text,
          },
        ]}
      >
        Pixel Editor
      </Text>

      <PixelGrid
        pixels={pixels}
        resolution={resolution}
        onPixelPress={paintPixel}
      />

      {/* Color Palette */}
      <View style={styles.palette}>
        {PALETTE.map((color) => {
          const isSelected = selectedColor === color;

          return (
            <Pressable
              key={color}
              onPress={() => setSelectedColor(color)}
              style={[
                styles.color,
                {
                  backgroundColor: color,
                  borderColor: isSelected
                    ? theme.accent
                    : theme.border,
                  borderWidth: isSelected ? 3 : 1,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Resolution */}
      <View style={styles.resolutionContainer}>
        <Text
          style={[
            styles.sectionLabel,
            {
              color: theme.text,
            },
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
                handleResolutionChange(
                  size as PixelResolution,
                )
              }
              style={[
                styles.resolutionButton,
                {
                  backgroundColor: isSelected
                    ? theme.brass
                    : theme.surface,
                  borderColor: isSelected
                    ? theme.brass
                    : theme.border,
                },
              ]}
            >
              <Text
                style={{
                  color: isSelected
                    ? theme.background
                    : theme.text,
                  fontWeight: isSelected ? '600' : '400',
                }}
              >
                {size}×{size}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={[
            styles.resetButton,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
          onPress={resetPixels}
          disabled={isSubmitting}
        >
          <Text
            style={{
              color: theme.text,
            }}
          >
            Temizle
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.submitButton,
            {
              backgroundColor: theme.accent,
              opacity: isSubmitting ? 0.6 : 1,
            },
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text
            style={[
              styles.submitButtonText,
              {
                color: '#FFFDFC',
              },
            ]}
          >
            {isSubmitting
              ? 'Gönderiliyor...'
              : 'Gönder'}
          </Text>
        </Pressable>
      </View>
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

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
  },

  resetButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderRadius: 8,
  },

  submitButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },

  submitButtonText: {
    fontWeight: '600',
  },
});