import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CyberArcade } from '@/constants/theme';

import { createSubmission } from '../../submission/services/submissionService';
import { PixelGrid } from '../components/PixelGrid';
import {
  type PixelResolution,
  usePixelEditor,
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

  '#FFFFFF',
];

export const PixelEditorScreen = ({
  challengeId,
}: PixelEditorScreenProps) => {
  const insets = useSafeAreaInsets();

  const [isSubmitting, setIsSubmitting] =
    useState(false);

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

  /*
   * SİLGİ:
   *
   * Burada klasik tek pixel silgisi kullanmıyoruz.
   * Kullanıcı silgiye bastığında bütün çalışma temizleniyor.
   */
  const handleErase = (): void => {
    if (isSubmitting) {
      return;
    }

    resetPixels();
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
        [
          {
            text: 'Tamam',
            onPress: () => {
              router.back();
            },
          },
        ],
        {
          cancelable: false,
        },
      );
    } catch (error) {
      console.error(
        'Submission oluşturulamadı:',
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : 'Pixel art gönderilirken bir hata oluştu.';

      Alert.alert('Hata', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
          hitSlop={10}
        >
          <Text style={styles.backButtonText}>
            ←
          </Text>

          <Text style={styles.backButtonLabel}>
            ARENA
          </Text>
        </Pressable>

        <Text style={styles.headerTitle}>
          PIXEL EDITOR
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* CANVAS */}
      <View style={styles.canvasArea}>
        <View style={styles.canvasLabel}>
          <View style={styles.canvasLabelDot} />

          <Text style={styles.canvasLabelText}>
            DRAWING BOARD
          </Text>
        </View>

        <PixelGrid
          pixels={pixels}
          resolution={resolution}
          onPixelPress={paintPixel}
        />
      </View>

      {/* CONTROL PANEL */}
      <View style={styles.controlPanel}>
        {/* PALETTE HEADER */}
        <View style={styles.paletteHeader}>
          <View>
            <Text style={styles.paletteTitle}>
              RENK PALETİ
            </Text>

            <Text style={styles.paletteSubtitle}>
              Bir renk seç
            </Text>
          </View>

          <View style={styles.selectedColorWrapper}>
            <View
              style={[
                styles.selectedColorPreview,
                {
                  backgroundColor: selectedColor,
                },
              ]}
            />

            <Text style={styles.selectedColorText}>
              {selectedColor}
            </Text>
          </View>
        </View>

        {/* COLOR PALETTE */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.palette}
        >
          {PALETTE.map((color) => (
            <Pressable
              key={color}
              onPress={() => setSelectedColor(color)}
              style={({ pressed }) => [
                styles.color,
                {
                  backgroundColor: color,
                },
                selectedColor === color &&
                  styles.selectedColor,
                pressed && styles.colorPressed,
              ]}
            />
          ))}
        </ScrollView>

        {/* CONTROLS */}
        <View style={styles.controls}>
          {/* RESOLUTION */}
          <View style={styles.resolutionContainer}>
            <Text style={styles.controlLabel}>
              GRID
            </Text>

            <View style={styles.resolutionButtons}>
              {[16, 32].map((size) => {
                const isSelected =
                  resolution === size;

                return (
                  <Pressable
                    key={size}
                    onPress={() =>
                      handleResolutionChange(
                        size as PixelResolution,
                      )
                    }
                    style={({ pressed }) => [
                      styles.resolutionButton,
                      isSelected &&
                        styles.selectedResolution,
                      pressed && styles.pressed,
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
          </View>

          {/* ACTION BUTTONS */}
          <View style={styles.actionButtons}>
            {/* SİLGİ / TÜMÜNÜ TEMİZLE */}
            <Pressable
              onPress={handleErase}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.eraseButton,
                pressed &&
                  styles.eraseButtonPressed,
                isSubmitting &&
                  styles.disabledButton,
              ]}
            >
              <Text style={styles.eraseIcon}>
                🧹
              </Text>

              <Text style={styles.eraseButtonText}>
                Silgi
              </Text>
            </Pressable>

            {/* SUBMIT */}
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.submitButton,
                pressed &&
                  styles.submitButtonPressed,
                isSubmitting &&
                  styles.disabledButton,
              ]}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting
                  ? 'Gönderiliyor...'
                  : 'Gönder'}
              </Text>

              {!isSubmitting && (
                <Text style={styles.submitArrow}>
                  →
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  /*
   * ANA EKRAN
   *
   * Artık eski #F3EFE8 yok.
   * HomeScreen'deki CyberArcade.background
   * ile aynı tema kullanılıyor.
   */
  container: {
    flex: 1,
    backgroundColor: CyberArcade.background,
  },

  /* HEADER */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    paddingHorizontal: 16,
    paddingBottom: 12,

    backgroundColor: CyberArcade.background,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 90,
  },

  backButtonText: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
    color: CyberArcade.secondaryText,
  },

  backButtonLabel: {
    marginLeft: 6,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: CyberArcade.secondaryText,
  },

  headerTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: CyberArcade.white,
  },

  headerSpacer: {
    width: 90,
  },

  /* CANVAS AREA */
  canvasArea: {
    flex: 1,
    minHeight: 0,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 10,
    paddingVertical: 10,

    backgroundColor: CyberArcade.background,
  },

  canvasLabel: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 10,

    paddingHorizontal: 10,
    paddingVertical: 5,

    borderRadius: 7,

    backgroundColor:
      'rgba(255, 183, 3, 0.10)',

    borderWidth: 1,
    borderColor:
      'rgba(255, 183, 3, 0.22)',
  },

  canvasLabelDot: {
    width: 5,
    height: 5,
    borderRadius: 3,

    marginRight: 6,

    backgroundColor: CyberArcade.gold,
  },

  canvasLabelText: {
    color: CyberArcade.gold,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  /* CONTROL PANEL */
  controlPanel: {
    backgroundColor: CyberArcade.surface,

    borderTopWidth: 1,
    borderTopColor: CyberArcade.border,

    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,

    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 12,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 14,

    elevation: 10,
  },

  /* PALETTE */
  paletteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    marginBottom: 9,
  },

  paletteTitle: {
    color: CyberArcade.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  paletteSubtitle: {
    marginTop: 2,
    color: CyberArcade.mutedText,
    fontSize: 9,
  },

  selectedColorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  selectedColorPreview: {
    width: 18,
    height: 18,

    marginRight: 7,

    borderRadius: 5,

    borderWidth: 1,
    borderColor: CyberArcade.border,
  },

  selectedColorText: {
    color: CyberArcade.secondaryText,
    fontSize: 9,
    fontWeight: '700',
  },

  palette: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingRight: 8,
  },

  color: {
    width: 30,
    height: 30,

    marginRight: 7,

    borderRadius: 7,

    borderWidth: 1,
    borderColor:
      'rgba(255, 255, 255, 0.12)',
  },

  selectedColor: {
    borderWidth: 3,
    borderColor: CyberArcade.gold,

    transform: [
      {
        scale: 1.08,
      },
    ],
  },

  colorPressed: {
    opacity: 0.7,
  },

  /* CONTROLS */
  controls: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',

    marginTop: 10,
  },

  controlLabel: {
    marginBottom: 5,

    color: CyberArcade.mutedText,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  resolutionContainer: {
    flexShrink: 1,
  },

  resolutionButtons: {
    flexDirection: 'row',
    gap: 6,
  },

  resolutionButton: {
    paddingVertical: 8,
    paddingHorizontal: 11,

    borderRadius: 9,

    backgroundColor:
      CyberArcade.surfacePressed,

    borderWidth: 1,
    borderColor: CyberArcade.border,
  },

  selectedResolution: {
    backgroundColor: CyberArcade.purple,

    borderColor: CyberArcade.purple,
  },

  resolutionText: {
    color: CyberArcade.secondaryText,
    fontSize: 11,
    fontWeight: '700',
  },

  selectedResolutionText: {
    color: CyberArcade.white,
  },

  /* ACTION BUTTONS */
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 7,

    marginLeft: 10,
  },

  /* SİLGİ */
  eraseButton: {
    flexDirection: 'row',
    alignItems: 'center',

    paddingVertical: 9,
    paddingHorizontal: 11,

    borderRadius: 9,

    backgroundColor:
      'rgba(255, 183, 3, 0.10)',

    borderWidth: 1,
    borderColor:
      'rgba(255, 183, 3, 0.30)',
  },

  eraseButtonPressed: {
    backgroundColor:
      'rgba(255, 183, 3, 0.18)',
  },

  eraseIcon: {
    fontSize: 13,
    marginRight: 5,
  },

  eraseButtonText: {
    color: CyberArcade.gold,
    fontSize: 11,
    fontWeight: '800',
  },

  /* GÖNDER */
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',

    paddingVertical: 9,
    paddingHorizontal: 13,

    borderRadius: 9,

    backgroundColor: CyberArcade.magenta,

    shadowColor: CyberArcade.magenta,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,

    elevation: 4,
  },

  submitButtonPressed: {
    opacity: 0.8,
    transform: [
      {
        translateY: 1,
      },
    ],
  },

  submitButtonText: {
    color: CyberArcade.white,
    fontSize: 11,
    fontWeight: '900',
  },

  submitArrow: {
    marginLeft: 5,

    color: CyberArcade.white,
    fontSize: 15,
    fontWeight: '900',
  },

  /* GENERAL */
  pressed: {
    opacity: 0.7,
  },

  disabledButton: {
    opacity: 0.45,
  },
});