import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/ui/AppText';
import { PixelSprite } from '@/src/components/ui/PixelSprite';
import { StickerBox } from '@/src/components/ui/StickerBox';
import { colors, radius, spacing } from '@/src/theme';

import { getChallengeThemeStyle } from '../constants/challengeThemes';
import type { Challenge } from '../types/challenge';
import { Countdown } from './Countdown';

interface ChallengeHeroProps {
  challenge: Challenge;
}

/**
 * Günün temasını gösteren ana kart. Zemin rengi ve sprite tema adından
 * türetilir, yani her gün farklı bir renkte görünür.
 */
export const ChallengeHero = ({ challenge }: ChallengeHeroProps) => {
  const { accent, sprite } = getChallengeThemeStyle(challenge.theme);

  return (
    <StickerBox
      background={accent}
      radius={radius.xl}
      offset={5}
      contentStyle={styles.card}
    >
      <View style={styles.topRow}>
        <AppText variant="pixel">Günün teması</AppText>
        <Countdown endsAt={challenge.endsAt} />
      </View>

      <View style={styles.main}>
        <AppText variant="display" style={styles.title} numberOfLines={3}>
          {challenge.title}
        </AppText>

        <View style={styles.sprite}>
          <PixelSprite name={sprite} cell={7} />
        </View>
      </View>

      <AppText variant="body" color={colors.inkSoft} numberOfLines={4}>
        {challenge.description}
      </AppText>
    </StickerBox>
  );
};

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.md },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  main: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: { flex: 1 },
  sprite: {
    padding: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: radius.md,
  },
});
