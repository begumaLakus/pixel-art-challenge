import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
  '#1A1A1A',
  '#3E2723',
  '#5D4037',
  '#795548',
  '#8D6E63',
  '#A1887F',
  '#BCAAA4',

  '#5D1F1F',
  '#8B2635',
  '#B23A48',
  '#D1495B',
  '#E57373',
  '#EF9A9A',
  '#FFCDD2',

  '#7A3E00',
  '#A85400',
  '#D2691E',
  '#E88A3D',
  '#FFB74D',
  '#FFCC80',
  '#FFE0B2',

  '#6B5B00',
  '#8A7500',
  '#B59B00',
  '#D4B000',
  '#FFD54F',
  '#FFE082',
  '#FFF3B0',

  '#1B4332',
  '#2D6A4F',
  '#40916C',
  '#52B788',
  '#81C784',
  '#A5D6A7',
  '#C8E6C9',

  '#0D3B66',
  '#1565C0',
  '#1976D2',
  '#42A5F5',
  '#64B5F6',
  '#90CAF9',
  '#BBDEFB',

  '#311B92',
  '#512DA8',
  '#673AB7',
  '#7E57C2',
  '#9575CD',
  '#B39DDB',
  '#D1C4E9',

  '#880E4F',
  '#AD1457',
  '#C2185B',
  '#D81B60',
  '#EC407A',
  '#F48FB1',
  '#F8BBD0',

  '#FDFBF7',
];

export const PixelEditorScreen = ({
  challengeId,
}: PixelEditorScreenProps) => {
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
        'Pixel art gönderilirken bir hata oluştu.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* CANVAS AREA */}
      <View style={styles.canvasArea}>
        <PixelGrid
          pixels={pixels}
          resolution={resolution}
          onPixelPress={paintPixel}
        />
      </View>

      {/* BOTTOM CONTROL PANEL */}
      <View style={styles.controlPanel}>
        {/* COLOR PALETTE */}
        <View style={styles.paletteSection}>
          <View style={styles.paletteHeader}>
            <Text style={styles.paletteTitle}>
              Renkler
            </Text>

            <Text style={styles.selectedColorText}>
              {selectedColor}
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.palette}
          >
            {PALETTE.map((color) => (
              <Pressable
                key={color}
                onPress={() => setSelectedColor(color)}
                style={[
                  styles.color,
                  {
                    backgroundColor: color,
                  },
                  selectedColor === color &&
                    styles.selectedColor,
                ]}
              />
            ))}
          </ScrollView>
        </View>

        {/* ACTIONS */}
        <View style={styles.actions}>
          <View style={styles.resolutionContainer}>
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
                    isSelected &&
                      styles.selectedResolution,
                  ]}
                >
                  <Text
                    style={[
                      styles.resolutionText,
                      isSelected &&
                        styles.selectedResolutionText,
                    ]}
                  >
                    {size}×{size}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actionButtons}>
            <Pressable
              onPress={resetPixels}
              disabled={isSubmitting}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>
                Temizle
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[
                styles.submitButton,
                isSubmitting &&
                  styles.disabledButton,
              ]}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting
                  ? 'Gönderiliyor...'
                  : 'Gönder'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3EFE8',
  },

  canvasArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },

  controlPanel: {
    backgroundColor: 'rgba(255, 252, 246, 0.94)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,

    paddingTop: 14,
    paddingBottom: 24,
    paddingHorizontal: 16,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,

    elevation: 8,
  },

  paletteSection: {
    marginBottom: 14,
  },

  paletteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  paletteTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5D4037',
  },

  selectedColorText: {
    fontSize: 11,
    color: '#9E8F84',
  },

  palette: {
    alignItems: 'center',
    paddingRight: 8,
  },

  color: {
    width: 32,
    height: 32,
    marginRight: 8,
    borderRadius: 7,

    borderWidth: 1,
    borderColor: 'rgba(70, 55, 45, 0.12)',
  },

  selectedColor: {
    borderWidth: 3,
    borderColor: '#5D4037',

    transform: [
      {
        scale: 1.08,
      },
    ],
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  resolutionContainer: {
    flexDirection: 'row',
    gap: 6,
  },

  resolutionButton: {
    paddingVertical: 8,
    paddingHorizontal: 11,

    borderRadius: 10,

    backgroundColor: 'rgba(93, 64, 55, 0.06)',
  },

  selectedResolution: {
    backgroundColor: '#5D4037',
  },

  resolutionText: {
    fontSize: 12,
    color: '#6D5B52',
    fontWeight: '500',
  },

  selectedResolutionText: {
    color: '#FDFBF7',
  },

  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },

  secondaryButton: {
    paddingVertical: 9,
    paddingHorizontal: 14,

    borderRadius: 10,

    backgroundColor: 'rgba(93, 64, 55, 0.06)',
  },

  secondaryButtonText: {
    fontSize: 12,
    color: '#6D5B52',
    fontWeight: '600',
  },

  submitButton: {
    paddingVertical: 9,
    paddingHorizontal: 17,

    borderRadius: 10,

    backgroundColor: '#8A6A4A',
  },

  submitButtonText: {
    fontSize: 12,
    color: '#FDFBF7',
    fontWeight: '700',
  },

  disabledButton: {
    opacity: 0.5,
  },
});