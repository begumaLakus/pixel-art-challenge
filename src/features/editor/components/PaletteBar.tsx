import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/ui/AppText';
import { colors, radius, spacing, stroke } from '@/src/theme';

interface PaletteBarProps {
  palette: readonly string[];
  selectedColor: string;
  onSelect: (color: string) => void;
}

/** Renk seçici: seçili renk lime halkayla vurgulanır. */
export const PaletteBar = memo(
  ({ palette, selectedColor, onSelect }: PaletteBarProps) => (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <AppText variant="pixel">Palet</AppText>
        <AppText variant="caption" color={colors.muted}>
          {palette.length} renk
        </AppText>
      </View>

      <View style={styles.grid}>
        {palette.map((color) => {
          const selected = color === selectedColor;

          return (
            <Pressable
              key={color}
              accessibilityRole="button"
              accessibilityLabel={`Renk ${color}`}
              accessibilityState={{ selected }}
              onPress={() => onSelect(color)}
              hitSlop={4}
              style={[styles.ring, selected && styles.ringSelected]}
            >
              <View style={[styles.swatch, { backgroundColor: color }]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  ),
);

PaletteBar.displayName = 'PaletteBar';

const SWATCH = 30;

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm + 2 },
  ring: {
    padding: 2,
    borderRadius: radius.sm + 2,
    borderWidth: stroke.thin,
    borderColor: 'transparent',
  },
  ringSelected: { borderColor: colors.ink, backgroundColor: colors.lime },
  swatch: {
    width: SWATCH,
    height: SWATCH,
    borderRadius: radius.sm - 2,
    borderWidth: stroke.thin,
    borderColor: colors.ink,
  },
});
