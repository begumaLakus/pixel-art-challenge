import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
} from 'react-native';

import { colors, fonts, radius, spacing } from '@/src/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { StickerBox } from './StickerBox';

interface TextFieldProps extends TextInputProps {
  label: string;
  icon: IconName;
  error?: string | null;
  /** Sağ taraftaki yardımcı eleman (örn. şifre göster/gizle butonu). */
  trailing?: React.ReactNode;
}

export const TextField = ({
  label,
  icon,
  error,
  trailing,
  style,
  onFocus,
  onBlur,
  ...inputProps
}: TextFieldProps) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <AppText variant="pixel" color={colors.inkSoft}>
        {label}
      </AppText>

      <StickerBox
        radius={radius.md}
        offset={focused ? 3 : 0}
        background={focused ? colors.white : colors.paperDeep}
        contentStyle={styles.box}
      >
        <Icon name={icon} size={20} color={colors.inkSoft} />

        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.muted}
          selectionColor={colors.pink}
          style={[styles.input, style]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...inputProps}
        />

        {trailing}
      </StickerBox>

      {error ? (
        <AppText variant="caption" color={colors.danger}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
};

// Web'de odaklanınca tarayıcının varsayılan çerçevesini kaldırır.
const webOutlineReset: TextStyle =
  Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : {};

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs + 2 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    ...webOutlineReset,
  },
});
