import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

import { colors, fonts } from '@/src/theme';

export type TextVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'caption'
  | 'pixel';

const VARIANT_STYLES: Record<TextVariant, TextStyle> = {
  display: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 34,
    letterSpacing: -1,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.5,
  },
  heading: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 20 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21 },
  caption: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16 },
  pixel: {
    fontFamily: fonts.pixel,
    fontSize: 11,
    lineHeight: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
};

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
}

export const AppText = ({
  variant = 'body',
  color = colors.ink,
  style,
  ...rest
}: AppTextProps) => (
  <Text style={[VARIANT_STYLES[variant], { color }, style]} {...rest} />
);
