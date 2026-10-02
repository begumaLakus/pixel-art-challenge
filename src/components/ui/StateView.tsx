import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/src/theme';

import { AppText } from './AppText';
import { PixelSprite } from './PixelSprite';
import { Screen } from './Screen';
import { StickerBox } from './StickerBox';
import { StickerButton } from './StickerButton';
import type { SpriteName } from '@/src/theme/sprites';

interface StateViewProps {
  title: string;
  message?: string | null;
  sprite?: SpriteName;
  actionLabel?: string;
  onAction?: () => void;
}

/** Boş / hata durumları için maskotlu, ortalanmış kart. */
export const StateView = ({
  title,
  message,
  sprite = 'pixo',
  actionLabel,
  onAction,
}: StateViewProps) => (
  <Screen scroll={false} contentStyle={styles.center}>
    <StickerBox radius={radius.xl} offset={5} contentStyle={styles.card}>
      <PixelSprite name={sprite} cell={8} />

      <AppText variant="title" style={styles.text}>
        {title}
      </AppText>

      {message ? (
        <AppText variant="body" color={colors.muted} style={styles.text}>
          {message}
        </AppText>
      ) : null}

      {actionLabel && onAction ? (
        <StickerButton label={actionLabel} onPress={onAction} />
      ) : null}
    </StickerBox>
  </Screen>
);

/** Veri yüklenirken gösterilen sade yükleme görünümü. */
export const LoadingView = () => (
  <Screen scroll={false} contentStyle={styles.center}>
    <View accessibilityRole="progressbar" accessibilityLabel="Yükleniyor">
      <ActivityIndicator size="large" color={colors.ink} />
    </View>
  </Screen>
);

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center' },
  card: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  text: { textAlign: 'center' },
});
