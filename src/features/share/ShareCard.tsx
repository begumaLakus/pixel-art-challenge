import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/ui/AppText';
import { Chip } from '@/src/components/ui/Chip';
import { PixelArt } from '@/src/components/ui/PixelArt';
import { PixelSprite } from '@/src/components/ui/PixelSprite';
import { StickerBox } from '@/src/components/ui/StickerBox';
import { colors, radius, spacing } from '@/src/theme';
import type { SpriteName } from '@/src/theme/sprites';

import { SHARE_CARD_HEIGHT, SHARE_CARD_WIDTH } from './shareSizes';

const ART_SIZE = 280;

interface ShareCardProps {
  pixels: readonly string[];
  resolution: number;
  themeTitle: string;
  accent: string;
  sprite: SpriteName;
  /** Üstteki vurgu etiketi, ör. "Günün şampiyonu" ya da "Bugünün çizimi". */
  headline: string;
  /** Oy sayısı vb. alt etiket. */
  detail: string;
}

/**
 * Hikaye boyutunda paylaşım kartı: çizim, tema, vurgu rengi ve marka.
 * Ekrana çizilmeden önce `react-native-view-shot` ile görsele çevrilir.
 */
export const ShareCard = ({
  pixels,
  resolution,
  themeTitle,
  accent,
  sprite,
  headline,
  detail,
}: ShareCardProps) => (
  <View style={styles.card}>
    <View style={[styles.band, { backgroundColor: accent }]}>
      <AppText variant="pixel" color={colors.ink}>
        Pixel.art
      </AppText>
      <PixelSprite name={sprite} cell={4} />
    </View>

    <View style={styles.body}>
      <Chip label={headline} icon="trophy" background={colors.lime} />

      <StickerBox radius={radius.lg} offset={6} contentStyle={styles.frame}>
        <PixelArt
          pixels={pixels}
          resolution={resolution}
          size={ART_SIZE}
        />
      </StickerBox>

      <View style={styles.texts}>
        <AppText variant="display" style={styles.center} numberOfLines={2}>
          {themeTitle}
        </AppText>
        <AppText variant="heading" color={colors.muted} style={styles.center}>
          {detail}
        </AppText>
      </View>
    </View>

    <View style={styles.footer}>
      <AppText variant="pixel" color={colors.paper}>
        Her gün yeni tema, sen de çiz
      </AppText>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    backgroundColor: colors.paper,
  },
  band: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 3,
    borderBottomColor: colors.ink,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  frame: { padding: spacing.sm },
  texts: { alignItems: 'center', gap: spacing.xs },
  center: { textAlign: 'center' },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: colors.ink,
  },
});
