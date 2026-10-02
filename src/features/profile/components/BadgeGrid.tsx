import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/ui/AppText';
import { Icon } from '@/src/components/ui/Icon';
import { PixelSprite } from '@/src/components/ui/PixelSprite';
import { StickerBox } from '@/src/components/ui/StickerBox';
import { colors, radius, spacing } from '@/src/theme';

import { BADGES } from '../utils/stats';

interface BadgeGridProps {
  earned: readonly string[];
}

/** Rozet koleksiyonu: kazanılanlar renkli, kazanılmayanlar soluk ve kilitli. */
export const BadgeGrid = ({ earned }: BadgeGridProps) => (
  <View style={styles.grid}>
    {BADGES.map((badge) => {
      const unlocked = earned.includes(badge.id);

      return (
        <View
          key={badge.id}
          style={styles.cell}
          accessibilityLabel={`${badge.title}: ${
            unlocked ? 'kazanıldı' : badge.description
          }`}
        >
          <StickerBox
            radius={radius.lg}
            offset={unlocked ? 3 : 0}
            background={unlocked ? colors.yellow : colors.paperDeep}
            contentStyle={styles.badge}
          >
            <View style={[styles.sprite, !unlocked && styles.locked]}>
              <PixelSprite name={badge.sprite} cell={5} />
            </View>

            {!unlocked && (
              <View style={styles.lock}>
                <Icon name="lock" size={14} />
              </View>
            )}

            <AppText variant="heading" style={styles.center}>
              {badge.title}
            </AppText>
            <AppText
              variant="caption"
              color={colors.inkSoft}
              style={styles.center}
              numberOfLines={2}
            >
              {badge.description}
            </AppText>
          </StickerBox>
        </View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cell: { width: '48%' },
  badge: { alignItems: 'center', gap: spacing.xs, padding: spacing.md },
  sprite: {
    padding: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.ink,
  },
  locked: { opacity: 0.3 },
  lock: { position: 'absolute', top: spacing.sm, right: spacing.sm },
  center: { textAlign: 'center' },
});
