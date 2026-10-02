import type { Timestamp } from 'firebase/firestore';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/ui/AppText';
import { Icon } from '@/src/components/ui/Icon';
import { colors, radius, spacing } from '@/src/theme';

import { useCountdown } from '../hooks/useCountdown';

interface CountdownProps {
  endsAt: Timestamp;
}

/**
 * Saniyede bir güncellenen geri sayım rozeti. Kendi bileşeninde izole
 * olduğu için yalnızca bu rozet yeniden çizilir, ekranın geri kalanı değil.
 */
export const Countdown = memo(({ endsAt }: CountdownProps) => {
  const { formatted, hasEnded } = useCountdown(endsAt);

  return (
    <View
      accessibilityRole="timer"
      accessibilityLabel={hasEnded ? 'Süre doldu' : `Kalan süre ${formatted}`}
      style={styles.badge}
    >
      <Icon name="timer-sand" size={14} color={colors.lime} />
      <AppText variant="pixel" color={colors.lime} style={styles.text}>
        {hasEnded ? 'Süre doldu' : formatted}
      </AppText>
    </View>
  );
});

Countdown.displayName = 'Countdown';

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    backgroundColor: colors.ink,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
  },
  text: { fontSize: 12 },
});
