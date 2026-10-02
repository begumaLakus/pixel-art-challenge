import { router, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AppAlert } from '@/src/components/ui/AppAlert';
import { AppText } from '@/src/components/ui/AppText';
import { Screen } from '@/src/components/ui/Screen';
import { LoadingView } from '@/src/components/ui/StateView';
import { StickerBox } from '@/src/components/ui/StickerBox';
import { StickerButton } from '@/src/components/ui/StickerButton';
import { Countdown } from '@/src/features/challenges/components/Countdown';
import { useActiveChallenge } from '@/src/features/challenges/hooks/useActiveChallenge';
import { useChallengeHasEnded } from '@/src/features/challenges/hooks/useChallengeHasEnded';
import {
  colors,
  MAX_CONTENT_WIDTH,
  radius,
  shadowOffset,
  spacing,
  stroke,
} from '@/src/theme';

import {
  createSubmission,
  getMySubmissionForChallenge,
} from '../../submission/services/submissionService';
import { getSubmissionErrorMessage } from '../../submission/utils/submissionErrors';
import { PaletteBar } from '../components/PaletteBar';
import { PixelGrid } from '../components/PixelGrid';
import { ToolBar } from '../components/ToolBar';
import { resolvePalette } from '../constants/palette';
import { type PixelResolution, usePixelEditor } from '../hooks/usePixelEditor';

interface PixelEditorScreenProps {
  challengeId: string;
}

const RESOLUTIONS: PixelResolution[] = [16, 32];

export const PixelEditorScreen = ({ challengeId }: PixelEditorScreenProps) => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const { challenge } = useActiveChallenge();
  const hasEnded = useChallengeHasEnded(challenge?.endsAt);

  const editor = usePixelEditor();
  const {
    pixels,
    selectedColor,
    resolution,
    tool,
    mirror,
    canUndo,
    canRedo,
    hasContent,
    selectColor,
    setTool,
    toggleMirror,
    setResolution,
    paintPixels,
    beginStroke,
    endStroke,
    undo,
    redo,
    clearAll,
    getMoves,
  } = editor;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);

  const palette = useMemo(
    () => resolvePalette(challenge?.palette),
    [challenge?.palette],
  );

  // Challenge paleti varsayılan fırça renginden farklıysa ilk renge geç.
  useEffect(() => {
    if (!palette.includes(selectedColor)) {
      selectColor(palette[0]);
    }
  }, [palette, selectedColor, selectColor]);

  // Çıkış onayı için güncel değerler ref'te tutulur.
  const hasContentRef = useRef(hasContent);
  const submittedRef = useRef(false);

  useEffect(() => {
    hasContentRef.current = hasContent;
  }, [hasContent]);

  useEffect(
    () =>
      navigation.addListener('beforeRemove', (event) => {
        if (!hasContentRef.current || submittedRef.current) {
          return;
        }

        event.preventDefault();

        AppAlert.alert(
          'Çıkmak istiyor musun?',
          'Çizimin kaydedilmedi, çıkarsan silinecek.',
          [
            { text: 'Devam et', style: 'cancel' },
            {
              text: 'Çık',
              style: 'destructive',
              onPress: () => navigation.dispatch(event.data.action),
            },
          ],
        );
      }),
    [navigation],
  );

  // Kullanıcı bu challenge'a zaten katıldıysa editörü açmaya gerek yok;
  // sunucu da mükerrer gönderimi reddeder, bu kontrol boş çizimi önler.
  useEffect(() => {
    let isCancelled = false;

    (async () => {
      try {
        const existing = await getMySubmissionForChallenge(challengeId);

        if (isCancelled) {
          return;
        }

        if (existing) {
          AppAlert.alert(
            'Zaten katıldın',
            'Bu challenge için bir çizim gönderdin. Yeniden katılmak istersen önce çizimini silebilirsin.',
            [{ text: 'Tamam', onPress: () => router.back() }],
            { cancelable: false },
          );
          return;
        }

        setAccessChecked(true);
      } catch (error) {
        console.error('Katılım durumu kontrol edilemedi:', error);

        // Kontrol başarısız olsa da kullanıcıyı kilitlemeyiz; sunucu kuralı
        // mükerrer gönderimi zaten engeller.
        if (!isCancelled) {
          setAccessChecked(true);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [challengeId]);

  const handleResolutionChange = useCallback(
    (next: PixelResolution): void => {
      if (isSubmitting || next === resolution) {
        return;
      }

      if (!hasContent) {
        setResolution(next);
        return;
      }

      AppAlert.alert(
        'Boyutu değiştir',
        'Boyutu değiştirmek mevcut çizimini silecek. Devam edilsin mi?',
        [
          { text: 'Vazgeç', style: 'cancel' },
          {
            text: 'Değiştir',
            style: 'destructive',
            onPress: () => setResolution(next),
          },
        ],
      );
    },
    [hasContent, isSubmitting, resolution, setResolution],
  );

  const handleClear = useCallback((): void => {
    if (!hasContent) {
      return;
    }

    AppAlert.alert('Tümünü temizle', 'Tuvaldeki her şey silinecek. Emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Temizle', style: 'destructive', onPress: clearAll },
    ]);
  }, [hasContent, clearAll]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);

      await createSubmission({
        challengeId,
        pixels,
        resolution,
        moves: getMoves(),
      });

      submittedRef.current = true;

      AppAlert.alert(
        'Gönderildi',
        'Çizimin yarışmaya katıldı. Topluluk oy vermeye başlayabilir.',
        [{ text: 'Harika', onPress: () => router.back() }],
        { cancelable: false },
      );
    } catch (error) {
      console.error('Çizim gönderilemedi:', error);
      AppAlert.alert('Gönderilemedi', getSubmissionErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }, [challengeId, getMoves, isSubmitting, pixels, resolution]);

  if (!accessChecked) {
    return <LoadingView />;
  }

  const canvasSize =
    Math.min(width, MAX_CONTENT_WIDTH) -
    spacing.lg * 2 -
    shadowOffset.lg -
    stroke.base * 2;

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <StickerButton
          icon="arrow-left"
          variant="white"
          size="sm"
          accessibilityLabel="Geri dön"
          onPress={() => router.back()}
        />

        <View style={styles.headerTitle}>
          <AppText variant="heading" numberOfLines={1}>
            {challenge?.title ?? 'Pixel editör'}
          </AppText>
        </View>

        {challenge ? <Countdown endsAt={challenge.endsAt} /> : null}
      </View>

      <StickerBox
        radius={radius.md}
        offset={shadowOffset.lg}
        style={styles.canvasBox}
        contentStyle={styles.canvas}
      >
        <PixelGrid
          pixels={pixels}
          resolution={resolution}
          size={canvasSize}
          onStrokeStart={beginStroke}
          onStrokeEnd={endStroke}
          onPaintPixels={paintPixels}
        />
      </StickerBox>

      <View style={styles.optionsRow}>
        <View style={styles.segment}>
          {RESOLUTIONS.map((option) => {
            const selected = option === resolution;

            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${option} çarpı ${option} tuval`}
                onPress={() => handleResolutionChange(option)}
                style={[styles.segmentItem, selected && styles.segmentSelected]}
              >
                <AppText variant="pixel">
                  {option}×{option}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ToolBar
        tool={tool}
        mirror={mirror}
        canUndo={canUndo}
        canRedo={canRedo}
        disabled={isSubmitting}
        onSelectTool={setTool}
        onToggleMirror={toggleMirror}
        onUndo={undo}
        onRedo={redo}
        onClear={handleClear}
      />

      <PaletteBar
        palette={palette}
        selectedColor={selectedColor}
        onSelect={selectColor}
      />

      <StickerButton
        label={hasEnded ? 'Süre doldu' : 'Gönder'}
        icon="send"
        iconRight
        fullWidth
        loading={isSubmitting}
        disabled={!hasContent || hasEnded}
        onPress={handleSubmit}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerTitle: { flex: 1 },
  canvasBox: { alignSelf: 'center' },
  canvas: { overflow: 'hidden' },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  segment: {
    flexDirection: 'row',
    borderWidth: stroke.base,
    borderColor: colors.ink,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  segmentItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  segmentSelected: { backgroundColor: colors.lime },
});
