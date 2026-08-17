import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';

import { AntiqueColors } from '@/constants/theme';

import { ArchiveCard } from '../components/ArchiveCard';
import { useArchive } from '../hooks/useArchive';

export const ArchiveScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const baseTheme = AntiqueColors[isDark ? 'dark' : 'light'];

  const theme = {
    ...baseTheme,
    pinkAccent: '#E0809D',
    cardBg: isDark ? '#1A1625' : '#FFFFFF',
    cardBorder: isDark ? '#2D223B' : '#F0E6ED',
  };

  const { archivedChallenges, loading, error, refresh } =
    useArchive();

  /*
   * Tam ekran spinner yalnızca ilk yüklemede.
   * Sonraki yenilemeler listenin refresh control'ü ile gösteriliyor.
   */
  if (loading && archivedChallenges.length === 0) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: theme.background },
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
          { backgroundColor: theme.background },
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
        styles.mainWrapper,
        { backgroundColor: theme.background },
      ]}
    >
      {/* ARKA PLAN AMBİYANS IŞIKLARI */}
      <View
        style={[
          styles.glowTopRight,
          { backgroundColor: theme.pinkAccent },
        ]}
      />
      <View style={styles.glowBottomLeft} />

      <View style={styles.container}>
        {/* HEADER SECTION */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.archiveBadge}>
              <Text style={styles.archiveBadgeText}>
                🏆 GEÇMİŞ ŞAMPİYONLAR
              </Text>
            </View>

            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {archivedChallenges.length} Arena
              </Text>
            </View>
          </View>

          <Text
            style={[styles.title, { color: theme.text }]}
          >
            Pixel Art{' '}
            <Text style={{ color: theme.pinkAccent }}>
              Arşivi
            </Text>
          </Text>
        </View>

        {/* LİSTE VEYA BOŞ DURUM */}
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
            <Text style={styles.emptyIcon}>🗓️</Text>

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
              Tamamlanan ilk meydan okumadan sonra kazananlar
              burada sergilenecek.
            </Text>
          </View>
        ) : (
          <FlatList
            data={archivedChallenges}
            keyExtractor={(item) => item.challenge.id}
            renderItem={({ item }) => (
              <ArchiveCard archivedChallenge={item} />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshing={loading}
            onRefresh={refresh}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    position: 'relative',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  errorText: {
    fontSize: 15,
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

  glowTopRight: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.15,
  },

  glowBottomLeft: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#7B2CBF',
    opacity: 0.12,
  },

  /*
   * paddingHorizontal 10: PixelGrid genişliğini
   * (ekran genişliği - 20) olarak hesapladığı için
   * kazanan çizim kart genişliğine tam oturuyor.
   */
  container: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 20,
  },

  header: {
    marginBottom: 16,
    paddingHorizontal: 6,
  },

  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  archiveBadge: {
    backgroundColor: 'rgba(224, 128, 157, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  countBadgeText: {
    color: '#FFB703',
    fontSize: 12,
    fontWeight: '700',
  },

  title: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  list: {
    paddingBottom: 24,
  },

  emptyContainer: {
    padding: 30,
    borderWidth: 2,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginHorizontal: 6,
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },

  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
