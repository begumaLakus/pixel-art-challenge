import { Stack, router } from 'expo-router';
import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CyberArcade,
  Elevation,
  Radius,
  Spacing,
  Typography,
} from '@/constants/theme';
import { logoutUser } from '@/src/features/auth/services/authServices';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // İçeriğin kullanılabilir genişliği
  const horizontalPadding = width < 360 ? 14 : width < 430 ? 18 : 24;

  // Küçük ekranlarda hero içeriğini dikey yap
  const compact = width < 380;

  const handleLogout = async (): Promise<void> => {
    try {
      await logoutUser();
      router.replace('/auth/login');
    } catch {
      Alert.alert('Hata', 'Oturum kapatılırken bir hata oluştu.');
    }
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />

      <View pointerEvents="none" style={styles.glowTopRight} />
      <View pointerEvents="none" style={styles.glowBottomLeft} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.sm + 4,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <View
          style={[styles.wrapper, { paddingHorizontal: horizontalPadding }]}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.statusRow}>
              <View style={styles.brandBadge}>
                <View style={styles.brandDot} />

                <Text
                  style={styles.brandText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  PIXEL ART ARENA
                </Text>
              </View>

              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />

                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>

            <Text
              style={styles.title}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              PIXEL
              <Text style={styles.titleAccent}> CHALLENGE</Text>
            </Text>

            <Text style={styles.subtitle}>
              Çiz. Gönder. Oyları topla.
              {'\n'}
              Günün temasında yerini al.
            </Text>
          </View>

          {/* ACTIVE CHALLENGE */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Aktif challenge'a git"
            onPress={() => router.push('/challenge')}
            style={({ pressed }) => [
              styles.heroCard,
              pressed && styles.heroCardPressed,
            ]}
          >
            <View style={styles.heroGlow} />

            <View style={styles.heroTopRow}>
              <View style={styles.heroBadge}>
                <View style={styles.heroBadgeDot} />

                <Text
                  style={styles.heroBadgeText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  AKTİF CHALLENGE
                </Text>
              </View>

              <Text style={styles.heroTimer}>24H</Text>
            </View>

            <View
              style={[styles.heroMain, compact && styles.heroMainCompact]}
            >
              <View
                style={[styles.heroCopy, compact && styles.heroCopyCompact]}
              >
                <Text style={styles.eyebrow}>TODAY'S MISSION</Text>

                <Text
                  style={styles.heroTitle}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                >
                  Günün Teması
                </Text>

                <Text style={styles.heroDescription}>
                  Aktif challenge'a gir, pixel art'ını oluştur ve
                  topluluğun oyuna sun.
                </Text>
              </View>

              <View
                style={[
                  styles.heroIconBox,
                  compact && styles.heroIconBoxCompact,
                ]}
              >
                <Text style={styles.heroIcon}>👾</Text>
              </View>
            </View>

            <View style={styles.heroFooter}>
              <Text
                style={styles.heroAction}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                CHALLENGE'A GİR
              </Text>

              <Text style={styles.heroArrow}>→</Text>
            </View>
          </Pressable>

          {/* SECONDARY CARDS */}
          <View style={styles.grid}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Arşivi aç"
              onPress={() => router.push('/archive')}
              style={({ pressed }) => [
                styles.smallCard,
                pressed && styles.smallCardPressed,
              ]}
            >
              <View
                style={[
                  styles.smallIcon,
                  { backgroundColor: CyberArcade.goldGlow },
                ]}
              >
                <Text style={styles.smallIconText}>🏆</Text>
              </View>

              <View style={styles.smallCardContent}>
                <Text style={styles.smallCardLabel}>ARŞİV</Text>

                <Text style={styles.smallCardTitle} numberOfLines={1}>
                  Şampiyonlar
                </Text>

                <Text style={styles.smallCardDescription} numberOfLines={2}>
                  Geçmiş kazananları keşfet
                </Text>
              </View>

              <Text style={styles.smallArrow}>→</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pixel studio'ya git"
              onPress={() => router.push('/challenge')}
              style={({ pressed }) => [
                styles.smallCard,
                pressed && styles.smallCardPressed,
              ]}
            >
              <View
                style={[
                  styles.smallIcon,
                  { backgroundColor: CyberArcade.mintGlow },
                ]}
              >
                <Text style={styles.smallIconText}>🎨</Text>
              </View>

              <View style={styles.smallCardContent}>
                <Text style={styles.smallCardLabelMint}>CREATE</Text>

                <Text style={styles.smallCardTitle} numberOfLines={1}>
                  Pixel Studio
                </Text>

                <Text style={styles.smallCardDescription} numberOfLines={2}>
                  Yeni bir çalışma başlat
                </Text>
              </View>

              <Text style={styles.smallArrow}>→</Text>
            </Pressable>
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <View style={styles.footerLine} />

            <Text style={styles.footerText}>NEON PIXEL NETWORK</Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Oturumu kapat"
              onPress={handleLogout}
              hitSlop={10}
            >
              <Text style={styles.logoutText}>OTURUMU KAPAT</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CyberArcade.background,
  },

  scrollContent: {
    flexGrow: 1,
  },

  wrapper: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },

  glowTopRight: {
    position: 'absolute',
    top: -90,
    right: -80,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: CyberArcade.purple,
    opacity: 0.12,
  },

  glowBottomLeft: {
    position: 'absolute',
    bottom: -96,
    left: -96,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: CyberArcade.magenta,
    opacity: 0.12,
  },

  header: {
    marginBottom: Spacing.lg - 4,
  },

  statusRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },

  brandBadge: {
    flex: 1,
    minWidth: 0,
    maxWidth: '78%',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm + 1,
    paddingVertical: Spacing.xs + 2,
    borderWidth: 1,
    borderColor: CyberArcade.border,
    borderRadius: Radius.sm,
    backgroundColor: CyberArcade.surface,
  },

  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: CyberArcade.magenta,
    marginRight: Spacing.xs + 3,
  },

  brandText: {
    flex: 1,
    minWidth: 0,
    color: CyberArcade.secondaryText,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
  },

  liveBadge: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 1,
    paddingVertical: Spacing.xs + 2,
    marginLeft: Spacing.sm,
    borderRadius: Radius.sm,
    backgroundColor: CyberArcade.mintGlow,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.25)',
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: CyberArcade.mint,
    marginRight: Spacing.xs + 2,
  },

  liveText: {
    color: CyberArcade.mint,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  title: {
    maxWidth: '100%',
    color: CyberArcade.textPrimary,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -1,
    fontFamily: Typography.mono,
  },

  titleAccent: {
    color: CyberArcade.magenta,
  },

  subtitle: {
    marginTop: Spacing.sm,
    color: CyberArcade.secondaryText,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },

  heroCard: {
    width: '100%',
    minHeight: 0,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: CyberArcade.magenta,
    backgroundColor: CyberArcade.surface,
    overflow: 'hidden',
    padding: Spacing.md,
    ...Elevation.glowMagenta,
  },

  heroCardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.94,
  },

  heroGlow: {
    position: 'absolute',
    top: -90,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: CyberArcade.magenta,
    opacity: 0.08,
  },

  heroTopRow: {
    width: '100%',
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  heroBadge: {
    flexShrink: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.sm,
    backgroundColor: CyberArcade.magentaGlow,
    borderWidth: 1,
    borderColor: 'rgba(255, 42, 133, 0.35)',
  },

  heroBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: CyberArcade.magenta,
    marginRight: Spacing.xs + 2,
  },

  heroBadgeText: {
    flexShrink: 1,
    color: CyberArcade.magenta,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  heroTimer: {
    flexShrink: 0,
    color: CyberArcade.gold,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginLeft: Spacing.sm,
    fontFamily: Typography.mono,
  },

  heroMain: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg - 4,
  },

  heroMainCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },

  heroCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: Spacing.sm + 4,
  },

  heroCopyCompact: {
    paddingRight: 0,
  },

  eyebrow: {
    color: CyberArcade.mint,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginBottom: Spacing.xs + 1,
  },

  heroTitle: {
    color: CyberArcade.textPrimary,
    fontSize: 27,
    lineHeight: 31,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontFamily: Typography.mono,
  },

  heroDescription: {
    color: CyberArcade.secondaryText,
    fontSize: 13,
    lineHeight: 19,
    marginTop: Spacing.xs + 3,
  },

  heroIconBox: {
    flexShrink: 0,
    width: 76,
    height: 76,
    marginLeft: Spacing.xs,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CyberArcade.purpleGlow,
    borderWidth: 1,
    borderColor: 'rgba(123, 44, 191, 0.35)',
    transform: [{ rotate: '2deg' }],
  },

  heroIconBoxCompact: {
    width: 64,
    height: 64,
    marginTop: Spacing.md - 2,
    marginLeft: 0,
    alignSelf: 'flex-end',
  },

  heroIcon: {
    fontSize: 40,
  },

  heroFooter: {
    width: '100%',
    marginTop: Spacing.md + 2,
    paddingTop: Spacing.sm + 5,
    borderTopWidth: 1,
    borderTopColor: CyberArcade.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  heroAction: {
    flex: 1,
    color: CyberArcade.magenta,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },

  heroArrow: {
    flexShrink: 0,
    color: CyberArcade.magenta,
    fontSize: 21,
    fontWeight: '900',
    marginLeft: Spacing.sm,
  },

  grid: {
    width: '100%',
    marginTop: Spacing.md - 4,
    gap: Spacing.sm + 4,
  },

  smallCard: {
    width: '100%',
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm + 4,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: CyberArcade.border,
    backgroundColor: CyberArcade.surface,
    ...Elevation.card,
  },

  smallCardPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: CyberArcade.surfacePressed,
  },

  smallIcon: {
    flexShrink: 0,
    width: 46,
    height: 46,
    borderRadius: Radius.md - 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: CyberArcade.border,
  },

  smallIconText: {
    fontSize: 23,
  },

  smallCardContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: Spacing.sm + 3,
  },

  smallCardLabel: {
    color: CyberArcade.gold,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 3,
  },

  smallCardLabelMint: {
    color: CyberArcade.mint,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 3,
  },

  smallCardTitle: {
    color: CyberArcade.textPrimary,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '800',
  },

  smallCardDescription: {
    color: CyberArcade.mutedText,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },

  smallArrow: {
    flexShrink: 0,
    color: CyberArcade.secondaryText,
    fontSize: 18,
    fontWeight: '800',
    marginLeft: Spacing.sm,
  },

  footer: {
    width: '100%',
    alignItems: 'center',
    marginTop: Spacing.md,
  },

  footerLine: {
    width: 40,
    height: 1,
    backgroundColor: CyberArcade.border,
    marginBottom: Spacing.sm + 4,
  },

  footerText: {
    color: CyberArcade.mutedText,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.4,
  },

  logoutText: {
    color: CyberArcade.mutedText,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: Spacing.md - 2,
  },
});
