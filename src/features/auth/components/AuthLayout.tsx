import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/ui/AppText';
import { PixelSprite } from '@/src/components/ui/PixelSprite';
import { Screen } from '@/src/components/ui/Screen';
import { StickerBox } from '@/src/components/ui/StickerBox';
import { colors, radius, spacing } from '@/src/theme';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

/**
 * Giriş ve kayıt ekranlarının ortak yerleşimi: maskot, başlık, form kartı
 * ve alt bağlantı. Klavye açıldığında form klavyenin altında kalmaz.
 */
export const AuthLayout = ({
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) => (
  <KeyboardAvoidingView
    style={styles.flex}
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
  >
    <Screen contentStyle={styles.content}>
      <View style={styles.hero}>
        <StickerBox
          background={colors.lime}
          radius={radius.xl}
          offset={4}
          contentStyle={styles.mascot}
        >
          <PixelSprite name="pixo" cell={8} />
        </StickerBox>

        <AppText variant="pixel" color={colors.inkSoft}>
          Pixel art arena
        </AppText>

        <AppText variant="display" style={styles.center}>
          {title}
        </AppText>

        <AppText variant="body" color={colors.muted} style={styles.center}>
          {subtitle}
        </AppText>
      </View>

      <StickerBox radius={radius.lg} offset={5} contentStyle={styles.card}>
        {children}
      </StickerBox>

      <View style={styles.footer}>{footer}</View>
    </Screen>
  </KeyboardAvoidingView>
);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: spacing.xl, justifyContent: 'center', flexGrow: 1 },
  hero: { alignItems: 'center', gap: spacing.sm },
  mascot: { padding: spacing.lg },
  center: { textAlign: 'center' },
  card: { padding: spacing.lg, gap: spacing.lg },
  footer: { alignItems: 'center' },
});
