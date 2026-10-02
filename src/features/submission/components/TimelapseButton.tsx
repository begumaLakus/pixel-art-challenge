import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AppText } from '@/src/components/ui/AppText';
import { PixelArt } from '@/src/components/ui/PixelArt';
import { StickerBox } from '@/src/components/ui/StickerBox';
import { StickerButton } from '@/src/components/ui/StickerButton';
import { colors, radius, spacing, stroke } from '@/src/theme';

import { useTimelapse } from '../hooks/useTimelapse';
import type { Submission } from '../types/types';

interface TimelapseButtonProps {
  submission: Pick<Submission, 'moves' | 'resolution'>;
  /** Yalnızca ikon gösterir (dar alanlar için). */
  compact?: boolean;
}

const MAX_PLAYER_SIZE = 320;

/**
 * "Süreci izle": çizimin adım adım nasıl yapıldığını gösteren oynatıcıyı
 * açar. Time-lapse kaydı olmayan eski çizimlerde hiçbir şey çizmez.
 */
export const TimelapseButton = ({ submission, compact = false }: TimelapseButtonProps) => {
  const [open, setOpen] = useState(false);
  const { width } = useWindowDimensions();
  const { pixels, stepIndex, totalSteps, playing, finished, togglePlaying, replay } =
    useTimelapse(submission.moves, submission.resolution, open);

  if (!submission.moves) {
    return null;
  }

  const size = Math.min(width - spacing.xl * 2 - 24, MAX_PLAYER_SIZE);
  const progress = totalSteps === 0 ? 1 : Math.min(1, stepIndex / totalSteps);

  return (
    <>
      <StickerButton
        size="sm"
        variant="white"
        icon="play-circle-outline"
        label={compact ? undefined : 'Süreci izle'}
        accessibilityLabel="Çizim sürecini izle"
        onPress={() => setOpen(true)}
      />

      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <StickerBox offset={5} contentStyle={styles.card}>
              <AppText variant="title">Çizim süreci</AppText>

              <PixelArt
                pixels={pixels}
                resolution={submission.resolution}
                size={size}
                style={styles.art}
              />

              <View
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 0, max: totalSteps, now: stepIndex }}
                style={styles.track}
              >
                <View style={[styles.fill, { width: `${progress * 100}%` }]} />
              </View>

              <View style={styles.row}>
                <StickerButton
                  size="sm"
                  variant="ink"
                  icon={playing ? 'pause' : 'play'}
                  label={playing ? 'Duraklat' : finished ? 'Baştan' : 'Oynat'}
                  onPress={togglePlaying}
                />
                <StickerButton
                  size="sm"
                  variant="white"
                  icon="replay"
                  accessibilityLabel="Baştan oynat"
                  onPress={replay}
                />
                <View style={styles.spacer} />
                <StickerButton
                  size="sm"
                  variant="white"
                  label="Kapat"
                  onPress={() => setOpen(false)}
                />
              </View>
            </StickerBox>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(21, 21, 21, 0.55)',
  },
  sheet: { width: '100%', maxWidth: 400 },
  card: { padding: spacing.lg, gap: spacing.md, alignItems: 'center' },
  art: {
    borderWidth: stroke.base,
    borderColor: colors.ink,
    borderRadius: radius.md,
  },
  track: {
    alignSelf: 'stretch',
    height: 8,
    borderRadius: radius.pill,
    borderWidth: stroke.thin,
    borderColor: colors.ink,
    backgroundColor: colors.paperDeep,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.pink },
  row: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  spacer: { flex: 1 },
});
