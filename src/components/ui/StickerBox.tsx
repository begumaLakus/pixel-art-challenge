import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius as radii, shadowOffset, stroke } from '@/src/theme';

interface StickerBoxProps {
  children?: React.ReactNode;
  background?: string;
  radius?: number;
  /** Sert gölgenin kayma miktarı; 0 gölgeyi kapatır. */
  offset?: number;
  borderWidth?: number;
  /** Dış sarmalayıcı (yerleşim: genişlik, margin, flex). */
  style?: StyleProp<ViewStyle>;
  /** Ön yüz (padding, hizalama). */
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Tasarımın temel yüzeyi: kalın siyah kontur + bulanıksız ofset gölge.
 * `shadowOffset`/`elevation` Android'de sert gölge veremediği için gölge,
 * ön yüzün arkasına yerleştirilmiş, ofsetli ikinci bir View olarak çizilir;
 * böylece iki platformda da birebir aynı görünür.
 */
export const StickerBox = ({
  children,
  background = colors.white,
  radius = radii.lg,
  offset = shadowOffset.md,
  borderWidth = stroke.base,
  style,
  contentStyle,
}: StickerBoxProps) => (
  <View style={[{ paddingRight: offset, paddingBottom: offset }, style]}>
    {offset > 0 && (
      <View
        pointerEvents="none"
        style={[
          styles.shadow,
          { left: offset, top: offset, borderRadius: radius },
        ]}
      />
    )}

    <View
      style={[
        {
          backgroundColor: background,
          borderRadius: radius,
          borderWidth,
          borderColor: colors.ink,
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  </View>
);

const styles = StyleSheet.create({
  shadow: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: colors.ink,
  },
});
