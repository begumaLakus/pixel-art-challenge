import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AntiqueColors } from '@/constants/theme';

import { ArchiveCard } from '../components/ArchiveCard';
import { useArchive } from '../hooks/useArchive';

export const ArchiveScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const baseTheme =
    AntiqueColors[isDark ? 'dark' : 'light'];

  const theme = {
    ...baseTheme,
    pinkAccent: '#E0809D',
    cardBg: isDark ? '#1A1625' : '#FFFFFF',
    cardBorder: isDark ? '#2D223B' : '#F0E6ED',
  };

  const {
    archivedChallenges,
    loading,
    error,
    refresh,
  } = useArchive();

  if (loading && archivedChallenges.length === 0) {
    return (
      <View
        style={[
          styles.center,
          {
            backgroundColor: theme.background,
            paddingTop: insets.top,
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={theme.pinkAccent}
        />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.center,
          {
            backgroundColor: theme.background,
            paddingTop: insets.top,
          },
        ]}
      >
        <Text
          style={[
            styles.errorText,
            { color: theme.pinkAccent },
          ]}
        >
          {error}
        </Text>

        <Pressable
          onPress={refresh}
          style={({ pressed }) => [
            styles.retryButton,
            {
              borderColor: theme.pinkAccent,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.retryButtonText,
              { color: theme.text },
            ]}
          >
            Tekrar Dene
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: theme.background },
      ]}
    >
      {/* BACKGROUND GLOWS */}
      <View
        pointerEvents="none"
        style={[
          styles.glowTopRight,
          {
            backgroundColor: theme.pinkAccent,
          },
        ]}
      />

      <View
        pointerEvents="none"
        style={styles.glowBottomLeft}
      />

      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + 16,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        {/* HEADER */}
        <View style={styles.header}>
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
              <Text
                style={styles.countBadgeText}
                numberOfLines={1}
              >
                {archivedChallenges.length} Arena
              </Text>
            </View>
          </View>

          
        </View>

        {/* CONTENT */}
        {archivedChallenges.length === 0 ? (
          <View
            style={[
              styles.emptyContainer,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.cardBorder,
              },
            ]}
          >
            <Text style={styles.emptyIcon}>
              🗓️
            </Text>

            <Text
              style={[
                styles.emptyTitle,
                { color: theme.text },
              ]}
            >
              Arşiv Henüz Boş
            </Text>

            <Text
              style={[
                styles.emptyMessage,
                { color: theme.placeholder },
              ]}
            >
              Tamamlanan ilk meydan okumadan sonra
              kazananlar burada sergilenecek.
            </Text>
          </View>
        ) : (
          <FlatList
            data={archivedChallenges}
            keyExtractor={(item) => item.challenge.id}
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <ArchiveCard
                  archivedChallenge={item}
                />
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
  },

  container: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  /* BACKGROUND */
  glowTopRight: {
    position: 'absolute',
    top: -70,
    right: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.15,
  },

  glowBottomLeft: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#7B2CBF',
    opacity: 0.12,
  },

  /* HEADER */
  header: {
    width: '100%',
    marginBottom: 16,
  },

  headerTopRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },

  archiveBadge: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'rgba(224, 128, 157, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(224, 128, 157, 0.3)',
  },

  archiveBadgeText: {
    color: '#E0809D',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  countBadge: {
    flexShrink: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },

  countBadgeText: {
    color: '#FFB703',
    fontSize: 12,
    fontWeight: '700',
  },

  title: {
    width: '100%',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  /* LIST */
  list: {
    width: '100%',
    paddingBottom: 24,
  },

  cardWrapper: {
    width: '100%',
    marginBottom: 14,
  },

  /* EMPTY */
  emptyContainer: {
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 30,
    borderWidth: 2,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },

  emptyMessage: {
    width: '100%',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  /* ERROR */
  errorText: {
    maxWidth: 340,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 16,
  },

  retryButton: {
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderWidth: 1.5,
    borderRadius: 12,
  },

  retryButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});