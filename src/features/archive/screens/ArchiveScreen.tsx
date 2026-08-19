import { router } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CyberArcade, Elevation, Radius, Spacing } from '@/constants/theme';

import { ArchiveCard } from '../components/ArchiveCard';
import { useArchive } from '../hooks/useArchive';

/**
 * Arşiv vitrini: geçmiş challenge kazananları. Bu ekran "geçmiş/tarih"
 * hissini vurgulamak için ana magenta yerine daha sakin bir "rose gold"
 * vurgu rengi kullanıyor — diğer ekranlardan görsel olarak ayrışan ama
 * aynı yüzey/gölge/boşluk sistemine (CyberArcade + Spacing/Radius/
 * Elevation) sadık kalan bilinçli bir tercih.
 */
const ARCHIVE_ACCENT = '#E8A0BE';

export const ArchiveScreen = () => {
  const insets = useSafeAreaInsets();

  const { archivedChallenges, loading, error, refresh } = useArchive();

  if (loading && archivedChallenges.length === 0) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={ARCHIVE_ACCENT} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{error}</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tekrar dene"
          onPress={refresh}
          style={({ pressed }) => [
            styles.retryButton,
            pressed && styles.retryButtonPressed,
          ]}
        >
          <Text style={styles.retryButtonText}>Tekrar Dene</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* BACKGROUND GLOWS */}
      <View pointerEvents="none" style={styles.glowTopRight} />
      <View pointerEvents="none" style={styles.glowBottomLeft} />

      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + Spacing.md,
            paddingBottom: Math.max(insets.bottom, Spacing.md),
          },
        ]}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Geri dön"
            onPress={() => router.back()}
            hitSlop={10}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <Text style={styles.backButtonText}>←</Text>
            <Text style={styles.backButtonLabel}>GERİ</Text>
          </Pressable>

          <View style={styles.headerTopRow}>
            <View style={styles.archiveBadge}>
              <Text
                style={styles.archiveBadgeText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                🏆 PixelArt Arşivi
              </Text>
            </View>

            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText} numberOfLines={1}>
                {archivedChallenges.length} Arena
              </Text>
            </View>
          </View>
        </View>

        {/* CONTENT */}
        {archivedChallenges.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🗓️</Text>

            <Text style={styles.emptyTitle}>Arşiv Henüz Boş</Text>

            <Text style={styles.emptyMessage}>
              Tamamlanan ilk meydan okumadan sonra kazananlar burada
              sergilenecek.
            </Text>
          </View>
        ) : (
          <FlatList
            data={archivedChallenges}
            keyExtractor={(item) => item.challenge.id}
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <ArchiveCard archivedChallenge={item} />
              </View>
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshing={loading}
            onRefresh={refresh}
            removeClippedSubviews
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: 'relative',
    backgroundColor: CyberArcade.background,
  },

  container: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    backgroundColor: CyberArcade.background,
  },

  /* BACKGROUND */
  glowTopRight: {
    position: 'absolute',
    top: -70,
    right: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: ARCHIVE_ACCENT,
    opacity: 0.12,
  },

  glowBottomLeft: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: CyberArcade.purple,
    opacity: 0.12,
  },

  /* HEADER */
  header: {
    width: '100%',
    marginBottom: Spacing.md,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm + 4,
    paddingVertical: Spacing.xs + 3,
    paddingHorizontal: Spacing.sm + 3,
    borderRadius: Radius.pill,
    backgroundColor: CyberArcade.surface,
    borderWidth: 1,
    borderColor: 'rgba(232, 160, 190, 0.28)',
    shadowColor: CyberArcade.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },

  backButtonPressed: {
    opacity: 0.75,
    backgroundColor: CyberArcade.surfacePressed,
  },

  backButtonText: {
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '900',
    color: ARCHIVE_ACCENT,
  },

  backButtonLabel: {
    marginLeft: Spacing.xs + 3,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: CyberArcade.secondaryText,
  },

  headerTopRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  archiveBadge: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'rgba(232, 160, 190, 0.12)',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 1,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(232, 160, 190, 0.28)',
  },

  archiveBadgeText: {
    color: ARCHIVE_ACCENT,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  countBadge: {
    flexShrink: 0,
    backgroundColor: CyberArcade.surface,
    borderWidth: 1,
    borderColor: CyberArcade.border,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 1,
    borderRadius: Radius.pill,
  },

  countBadgeText: {
    color: CyberArcade.gold,
    fontSize: 12,
    fontWeight: '700',
  },

  /* LIST */
  list: {
    width: '100%',
    paddingBottom: Spacing.lg,
  },

  cardWrapper: {
    width: '100%',
    marginBottom: Spacing.sm + 6,
  },

  /* EMPTY */
  emptyContainer: {
    width: '100%',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl - 2,
    borderWidth: 1,
    borderRadius: Radius.xl,
    backgroundColor: CyberArcade.surface,
    borderColor: CyberArcade.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    ...Elevation.card,
  },

  emptyIcon: {
    fontSize: 44,
    marginBottom: Spacing.sm + 4,
  },

  emptyTitle: {
    color: CyberArcade.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: Spacing.xs + 2,
    textAlign: 'center',
  },

  emptyMessage: {
    width: '100%',
    color: CyberArcade.secondaryText,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  /* ERROR */
  errorText: {
    maxWidth: 340,
    color: CyberArcade.secondaryText,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },

  retryButton: {
    paddingVertical: Spacing.sm + 3,
    paddingHorizontal: Spacing.lg - 2,
    borderWidth: 1,
    borderRadius: Radius.md,
    borderColor: ARCHIVE_ACCENT,
    backgroundColor: 'rgba(232, 160, 190, 0.10)',
  },

  retryButtonPressed: {
    opacity: 0.8,
  },

  retryButtonText: {
    color: ARCHIVE_ACCENT,
    fontSize: 14,
    fontWeight: '700',
  },
});
