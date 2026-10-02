import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, MAX_CONTENT_WIDTH, spacing } from '@/src/theme';

interface ScreenProps {
  children: React.ReactNode;
  /** false ise içerik kaydırılmaz (sabit yerleşimli ekranlar). */
  scroll?: boolean;
  /** Alt boşluk; yüzen tab bar'ın altında içerik kalmaması için. */
  bottomSpace?: number;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Tüm ekranların ortak iskeleti: krem zemin, güvenli alan boşlukları ve
 * geniş ekranlarda (tablet/web) ortalanmış, sınırlı genişlikte içerik.
 */
export const Screen = ({
  children,
  scroll = true,
  bottomSpace = spacing.xl,
  contentStyle,
}: ScreenProps) => {
  const insets = useSafeAreaInsets();

  const padding = {
    paddingTop: insets.top + spacing.md,
    paddingBottom: insets.bottom + bottomSpace,
  };

  if (!scroll) {
    return (
      <View style={styles.root}>
        <View style={[styles.column, padding, styles.fill, contentStyle]}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.column, padding, contentStyle]}>{children}</View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  scrollContent: { flexGrow: 1 },
  fill: { flex: 1 },
  column: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
  },
});
