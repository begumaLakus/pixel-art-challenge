import { AntiqueColors } from '@/constants/theme';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SubmissionCard } from '../components/SubmissionCard';
import { useSubmissions } from '../hooks/useSubmission';

interface SubmissionsScreenProps {
  challengeId: string;
}

export const SubmissionsScreen = ({
  challengeId,
}: SubmissionsScreenProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const baseTheme =
    AntiqueColors[isDark ? 'dark' : 'light'];

  const theme = {
    ...baseTheme,
    pinkAccent: '#E0809D',
    cardBg: isDark ? '#1A1625' : '#FFFFFF',
    cardBorder: isDark ? '#2D223B' : '#F0E6ED',
  };

  const {
    submissions,
    loading,
    error,
  } = useSubmissions(challengeId);

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.center,
          {
            backgroundColor: theme.background,
          },
        ]}
        edges={['top', 'left', 'right']}
      >
        <ActivityIndicator
          size="large"
          color={theme.pinkAccent}
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[
          styles.center,
          {
            backgroundColor: theme.background,
          },
        ]}
        edges={['top', 'left', 'right']}
      >
        <Text
          style={[
            styles.errorText,
            {
              color: theme.pinkAccent,
            },
          ]}
        >
          {error}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.mainWrapper,
        {
          backgroundColor: theme.background,
        },
      ]}
      edges={['top', 'left', 'right']}
    >
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
            <Text style={styles.emptyIcon}>
              🎨
            </Text>

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
              Bu challenge için ilk piksel sanatı
              eserini sen oluştur ve sergile!
            </Text>
          </View>
        ) : (
          <FlatList
            data={submissions}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <SubmissionCard
                  submission={item}
                />
              </View>
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  errorText: {
    maxWidth: 340,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },

  glowTopRight: {
    position: 'absolute',
    top: -70,
    right: -70,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.12,
  },

  glowBottomLeft: {
    position: 'absolute',
    bottom: -70,
    left: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#7B2CBF',
    opacity: 0.10,
  },

  container: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  header: {
    width: '100%',
    marginBottom: 14,
  },

  headerTopRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  galleryBadge: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(224, 128, 157, 0.3)',
    backgroundColor: 'rgba(224, 128, 157, 0.15)',
  },

  galleryBadgeText: {
    color: '#E0809D',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  countBadge: {
    flexShrink: 0,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  countBadgeText: {
    color: '#FFB703',
    fontSize: 10,
    fontWeight: '700',
  },

  title: {
    width: '100%',
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  list: {
    width: '100%',
    paddingBottom: 24,
  },

  columnWrapper: {
    width: '100%',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },

  cardWrapper: {
    flex: 1,
    minWidth: 0,
    maxWidth: '50%',
  },

  emptyContainer: {
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderWidth: 1.5,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },

  emptyIcon: {
    fontSize: 42,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },

  emptyMessage: {
    width: '100%',
    maxWidth: 320,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});