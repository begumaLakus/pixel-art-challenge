import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, shadowOffset, spacing, stroke } from '@/src/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

type ButtonVariant = 'ink' | 'lime' | 'pink' | 'white';
type ButtonSize = 'md' | 'sm';

interface StickerButtonProps {
  label?: string;
  icon?: IconName;
  /** İkonu etiketin sağına koyar (örn. "Gönder" + ok). */
  iconRight?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const VARIANTS: Record<ButtonVariant, { background: string; text: string }> = {
  ink: { background: colors.ink, text: colors.lime },
  lime: { background: colors.lime, text: colors.ink },
  pink: { background: colors.pink, text: colors.ink },
  white: { background: colors.white, text: colors.ink },
};

/**
 * Basılabilir sticker buton: normalde sert gölgesi görünür, basılınca
 * gölge yönünde "içeri çöker" (kayar ve gölge kapanır).
 */
export const StickerButton = ({
  label,
  icon,
  iconRight = false,
  variant = 'ink',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  onPress,
  accessibilityLabel,
  style,
}: StickerButtonProps) => {
  const { background, text } = VARIANTS[variant];
  const offset = size === 'sm' ? shadowOffset.sm : shadowOffset.md;
  const inactive = disabled || loading;
  const iconSize = size === 'sm' ? 16 : 20;

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onPress?.();
  }, [onPress]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={handlePress}
      style={[fullWidth && styles.fullWidth, style]}
    >
      {({ pressed }) => (
        <View style={{ paddingRight: offset, paddingBottom: offset }}>
          {!pressed && (
            <View
              pointerEvents="none"
              style={[
                styles.shadow,
                { left: offset, top: offset, borderRadius: radius.md },
              ]}
            />
          )}

          <View
            style={[
              styles.face,
              size === 'sm' ? styles.faceSmall : styles.faceMedium,
              {
                backgroundColor: background,
                opacity: disabled && !loading ? 0.45 : 1,
                transform: pressed
                  ? [{ translateX: offset }, { translateY: offset }]
                  : [],
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={text} />
            ) : (
              <>
                {icon && !iconRight && (
                  <Icon name={icon} size={iconSize} color={text} />
                )}
                {label && (
                  <AppText
                    variant="heading"
                    color={text}
                    style={size === 'sm' ? styles.labelSmall : undefined}
                  >
                    {label}
                  </AppText>
                )}
                {icon && iconRight && (
                  <Icon name={icon} size={iconSize} color={text} />
                )}
              </>
            )}
          </View>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  fullWidth: { alignSelf: 'stretch' },
  shadow: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: colors.ink,
  },
  face: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: stroke.base,
    borderColor: colors.ink,
    borderRadius: radius.md,
  },
  faceMedium: { minHeight: 48, paddingHorizontal: spacing.lg },
  faceSmall: { minHeight: 36, paddingHorizontal: spacing.md },
  labelSmall: { fontSize: 13 },
});
