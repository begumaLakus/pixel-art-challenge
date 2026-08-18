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

import { CyberArcade, Elevation, Radius, Spacing, Typography } from '@/constants/theme';

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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    pixels,
    selectedColor,
    resolution,
    tool,
    canUndo,
    hasContent,
    selectColor,
    setTool,
    setResolution,
    paintPixels,
    beginStroke,
    endStroke,
    undo,
    clearAll,
  } = usePixelEditor();

  const isEraseActive = tool === 'erase';

  const handleResolutionChange = (newResolution: PixelResolution): void => {
    if (isSubmitting || newResolution === resolution) {
      return;
    }

    if (!hasContent) {
      setResolution(newResolution);
      return;
    }

    Alert.alert(
      'Çözünürlüğü Değiştir',
      'Çözünürlüğü değiştirmek mevcut çizimini silecek. Devam edilsin mi?',
      [
        {
          text: 'Vazgeç',
          style: 'cancel',
        },
        {
          text: 'Değiştir',
          style: 'destructive',
          onPress: () => setResolution(newResolution),
        },
      ],
    );
  };

  const handleToggleEraser = (): void => {
    if (isSubmitting) {
      return;
    }

    setTool(isEraseActive ? 'paint' : 'erase');
  };

  const handleUndo = (): void => {
    if (isSubmitting || !canUndo) {
      return;
    }

    undo();
  };

  
  const handleClearAll = (): void => {
    if (isSubmitting || !hasContent) {
      return;
    }

    Alert.alert(
      'Tümünü Temizle',
      'Çizim tahtasındaki her şey silinecek. Emin misin?',
      [
        {
          text: 'Vazgeç',
          style: 'cancel',
        },
        {
          text: 'Temizle',
          style: 'destructive',
          onPress: clearAll,
        },
      ],
    );
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
      console.error('Submission oluşturulamadı:', error);

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
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Arenaya dön"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
          hitSlop={10}
        >
          <Text style={styles.backButtonText}>←</Text>
          <Text style={styles.backButtonLabel}>ARENA</Text>
        </Pressable>

        <Text style={styles.headerTitle}>PIXEL EDITOR</Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* CANVAS */}
      <View style={styles.canvasArea}>
        <View style={styles.canvasLabel}>
          <View style={styles.canvasLabelDot} />

          <Text style={styles.canvasLabelText}>
            {isEraseActive ? 'ERASE MODE' : 'DRAWING BOARD'}
          </Text>
        </View>

        <PixelGrid
          pixels={pixels}
          resolution={resolution}
          onStrokeStart={beginStroke}
          onStrokeEnd={endStroke}
          onPaintPixels={paintPixels}
        />
      </View>

      {/* CONTROL PANEL */}
      <View style={styles.controlPanel}>
        {/* PALETTE HEADER */}
        <View style={styles.paletteHeader}>
          <View>
            <Text style={styles.paletteTitle}>RENK PALETİ</Text>
            <Text style={styles.paletteSubtitle}>Bir renk seç</Text>
          </View>

          <View style={styles.selectedColorWrapper}>
            <View
              style={[
                styles.selectedColorPreview,
                { backgroundColor: selectedColor },
              ]}
            />

            <Text style={styles.selectedColorText}>{selectedColor}</Text>
          </View>
        </View>

        {/* COLOR PALETTE */}
        <ScrollView
          style={styles.paletteScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.paletteGrid}
        >
          {PALETTE.map((color) => (
            <Pressable
              key={color}
              onPress={() => selectColor(color)}
              accessibilityRole="button"
              accessibilityLabel={`Renk seç: ${color}`}
              style={({ pressed }) => [
                styles.color,
                { backgroundColor: color },
                selectedColor === color &&
                  !isEraseActive &&
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
            <Text style={styles.controlLabel}>GRID</Text>

            <View style={styles.resolutionButtons}>
              {[16, 32].map((size) => {
                const isSelected = resolution === size;

                return (
                  <Pressable
                    key={size}
                    onPress={() =>
                      handleResolutionChange(size as PixelResolution)
                    }
                    disabled={isSubmitting}
                    style={({ pressed }) => [
                      styles.resolutionButton,
                      isSelected && styles.selectedResolution,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.resolutionText,
                        isSelected && styles.selectedResolutionText,
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
            {/* GERİ AL */}
            <Pressable
              onPress={handleUndo}
              disabled={isSubmitting || !canUndo}
              accessibilityRole="button"
              accessibilityLabel="Geri al"
              style={({ pressed }) => [
                styles.toolButton,
                pressed && styles.toolButtonPressed,
                (isSubmitting || !canUndo) && styles.toolButtonDisabled,
              ]}
            >
              <Text style={styles.toolButtonIcon}>↺</Text>
            </Pressable>

            {/* SİLGİ (tek pixel) */}
            <Pressable
              onPress={handleToggleEraser}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Silgi aracı"
              accessibilityState={{ selected: isEraseActive }}
              style={({ pressed }) => [
                styles.toolButton,
                isEraseActive && styles.toolButtonActive,
                pressed && styles.toolButtonPressed,
                isSubmitting && styles.toolButtonDisabled,
              ]}
            >
              <Text style={styles.toolButtonIcon}>🧽</Text>
            </Pressable>

            {/* TÜMÜNÜ TEMİZLE */}
            <Pressable
              onPress={handleClearAll}
              disabled={isSubmitting || !hasContent}
              accessibilityRole="button"
              accessibilityLabel="Tümünü temizle"
              style={({ pressed }) => [
                styles.toolButton,
                pressed && styles.toolButtonPressed,
                (isSubmitting || !hasContent) && styles.toolButtonDisabled,
              ]}
            >
              <Text style={styles.toolButtonIcon}>🧹</Text>
            </Pressable>

            {/* SUBMIT */}
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Gönder"
              style={({ pressed }) => [
                styles.submitButton,
                pressed && styles.submitButtonPressed,
                isSubmitting && styles.disabledButton,
              ]}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
              </Text>

              {!isSubmitting && <Text style={styles.submitArrow}>→</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  /* ANA EKRAN */
  container: {
    flex: 1,
    backgroundColor: CyberArcade.background,
  },

  /* HEADER */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm + 4,
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
    marginLeft: Spacing.xs + 2,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: CyberArcade.secondaryText,
  },

  headerTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: CyberArcade.textPrimary,
    fontFamily: Typography.mono,
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
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: CyberArcade.background,
  },

  canvasLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 1,
    borderRadius: Radius.sm - 1,
    backgroundColor: CyberArcade.goldGlow,
    borderWidth: 1,
    borderColor: 'rgba(255, 183, 3, 0.22)',
  },

  canvasLabelDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: Spacing.xs + 2,
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
    borderTopLeftRadius: Radius.xl + 2,
    borderTopRightRadius: Radius.xl + 2,
    paddingTop: Spacing.md - 2,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm + 4,
    ...Elevation.raised,
  },

  /* PALETTE */
  paletteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm + 1,
  },

  paletteTitle: {
    color: CyberArcade.textPrimary,
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
    marginRight: Spacing.xs + 3,
    borderRadius: Radius.sm - 3,
    borderWidth: 1,
    borderColor: CyberArcade.border,
  },

  selectedColorText: {
    color: CyberArcade.secondaryText,
    fontSize: 9,
    fontWeight: '700',
  },

  paletteScroll: {
    maxHeight: 132,
  },

  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs + 3,
    paddingBottom: Spacing.xs,
  },

  color: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm - 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },

  selectedColor: {
    borderWidth: 3,
    borderColor: CyberArcade.gold,
    transform: [{ scale: 1.08 }],
  },

  colorPressed: {
    opacity: 0.7,
  },

  /* CONTROLS */
  controls: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: Spacing.sm + 2,
  },

  controlLabel: {
    marginBottom: Spacing.xs + 1,
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
    gap: Spacing.xs + 2,
  },

  resolutionButton: {
    paddingVertical: Spacing.xs + 4,
    paddingHorizontal: Spacing.sm + 3,
    borderRadius: Radius.sm + 1,
    backgroundColor: CyberArcade.surfaceInset,
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
    gap: Spacing.xs + 2,
    marginLeft: Spacing.sm + 2,
  },

  /* TOOL BUTTONS (Geri Al / Silgi / Temizle) */
  toolButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm + 1,
    backgroundColor: CyberArcade.surfaceInset,
    borderWidth: 1,
    borderColor: CyberArcade.border,
  },

  toolButtonActive: {
    backgroundColor: CyberArcade.purple,
    borderColor: CyberArcade.purple,
  },

  toolButtonPressed: {
    opacity: 0.7,
  },

  toolButtonDisabled: {
    opacity: 0.35,
  },

  toolButtonIcon: {
    fontSize: 15,
  },

  /* GÖNDER */
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 1,
    paddingHorizontal: Spacing.sm + 5,
    borderRadius: Radius.sm + 1,
    backgroundColor: CyberArcade.magenta,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    ...Elevation.glowMagenta,
  },

  submitButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },

  submitButtonText: {
    color: CyberArcade.white,
    fontSize: 11,
    fontWeight: '900',
  },

  submitArrow: {
    marginLeft: Spacing.xs + 1,
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
