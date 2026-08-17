import { AntiqueColors } from '@/constants/theme';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';

import { SubmissionCard } from '../components/SubmissionCard';
import { useSubmissions } from '../hooks/useSubmission';

interface SubmissionListScreenProps {
  challengeId: string;
}

export const SubmissionListScreen = ({
  challengeId,
}: SubmissionListScreenProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { width } = useWindowDimensions();

  const baseTheme = AntiqueColors[isDark ? 'dark' : 'light'];

  const theme = {
    ...baseTheme,
    pinkAccent: '#E0809D',
    cardBg: isDark ? '#1A1625' : '#FFFFFF',
    cardBorder: isDark ? '#2D223B' : '#F0E6ED',
  };

  const { submissions, loading, error } =
    useSubmissions(challengeId);

  /*
   * Container horizontal padding:
   * 16 + 16 = 32
   *
   * İki kart arasındaki boşluk:
   * 12
   *
   * Her kartın gerçek genişliği:
   * (ekran - 32 - 12) / 2
   */
  const horizontalPadding = 32;
  const columnGap = 12;

  const cardWidth = Math.max(
    0,
    (width - horizontalPadding - columnGap) / 2,
  );

  if (loading) {
    return (
      <View
        style={[
          styles.center,
          {
            backgroundColor: theme.background,
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
          },
        ]}
      >
        <Text
          style={[
            styles.message,
            {
              color: theme.pinkAccent,
            },
          ]}
        >
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.mainWrapper,
        {
          backgroundColor: theme.background,
        },
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

      <View style={styles.container}>
        {/* HEADER */}

        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.galleryBadge}>
              <Text
                style={styles.galleryBadgeText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                🖼️ TOPLULUK GALERİSİ
              </Text>
            </View>

            <View style={styles.countBadge}>
              <Text
                style={styles.countBadgeText}
                numberOfLines={1}
              >
                {submissions.length} Çizim
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.title,
              {
                color: theme.text,
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            Pixel Art{' '}
            <Text
              style={{
                color: theme.pinkAccent,
              }}
            >
              Sergisi
            </Text>
          </Text>
        </View>

        {/* EMPTY STATE */}

        {submissions.length === 0 ? (
          <View
            style={[
              styles.emptyContainer,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.cardBorder,
              },
            ]}
          >
            <Text style={styles.emptyIcon}>🎨</Text>

            <Text
              style={[
                styles.emptyTitle,
                {
                  color: theme.text,
                },
              ]}
            >
              Henüz Çizim Yok
            </Text>

            <Text
              style={[
                styles.emptyMessage,
                {
                  color: theme.placeholder,
                },
              ]}
            >
              Bu challenge için ilk piksel sanatı eserini
              sen oluştur ve sergile!
            </Text>
          </View>
        ) : (
          <FlatList
            data={submissions}
            keyExtractor={(item) => item.id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            columnWrapperStyle={styles.columnWrapper}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.cardWrapper,
                  {
                    width: cardWidth,
                  },
                ]}
              >
                <SubmissionCard submission={item} />
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  message: {
    maxWidth: 320,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },

  /* BACKGROUND */

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

  /* CONTAINER */

  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  /* HEADER */

  header: {
    marginBottom: 16,
  },

  headerTopRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },

  galleryBadge: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'flex-start',

    backgroundColor: 'rgba(224, 128, 157, 0.15)',

    paddingHorizontal: 10,
    paddingVertical: 5,

    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(224, 128, 157, 0.3)',
  },

  galleryBadgeText: {
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

  columnWrapper: {
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  cardWrapper: {
    flexShrink: 0,
    overflow: 'hidden',
  },

  /* EMPTY STATE */

  emptyContainer: {
    width: '100%',

    paddingHorizontal: 24,
    paddingVertical: 30,

    borderWidth: 2,
    borderRadius: 20,

    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 40,
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },

  emptyMessage: {
    width: '100%',
    maxWidth: 320,

    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});