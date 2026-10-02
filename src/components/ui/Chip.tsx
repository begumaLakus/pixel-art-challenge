import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing, stroke } from '@/src/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

interface ChipProps {
  label: string;
  icon?: IconName;
  background?: string;
  /** Başa küçük bir canlı nokta ekler ("CANLI" rozeti gibi). */
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Chip = ({
  label,
  icon,
  background = colors.white,
  dot = false,
  style,
}: ChipProps) => (
  <View style={[styles.chip, { backgroundColor: background }, style]}>
    {dot && <View style={styles.dot} />}
    {icon && <Icon name={icon} size={13} />}
    <AppText variant="pixel">{label}</AppText>
  </View>
);

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: stroke.thin,
    borderColor: colors.ink,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.pink,
  },
});
