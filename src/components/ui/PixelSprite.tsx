import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { SPRITE_PALETTE, SPRITES, type SpriteName } from '@/src/theme/sprites';

interface PixelSpriteProps {
  name: SpriteName;
  /** Bir sprite hücresinin ekrandaki kenar uzunluğu (px). */
  cell?: number;
}

/**
 * Karakter haritası olarak tanımlı bir pixel art'ı View'larla çizer
 * (SVG bağımlılığı yok, iOS/Android/web'de aynı görünür).
 */
export const PixelSprite = memo(({ name, cell = 6 }: PixelSpriteProps) => {
  const rows = SPRITES[name];

  return (
    <View accessibilityElementsHidden importantForAccessibility="no">
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {[...row].map((char, columnIndex) => (
            <View
              key={columnIndex}
              style={{
                width: cell,
                height: cell,
                backgroundColor: SPRITE_PALETTE[char] ?? 'transparent',
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
});

PixelSprite.displayName = 'PixelSprite';

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
});
