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
  const baseTheme = AntiqueColors[isDark ? 'dark' : 'light'];

  const theme = {
    ...baseTheme,
    pinkAccent: '#E0809D',
    cardBg: isDark ? '#1A1625' : '#FFFFFF',
    cardBorder: isDark ? '#2D223B' : '#F0E6ED',
  };

  const { submissions, loading, error } = useSubmissions(challengeId);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.pinkAccent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.pinkAccent, fontSize: 15 }}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.mainWrapper, { backgroundColor: theme.background }]}>
      {/* ARKA PLAN AMBİYANS IŞIKLARI */}
      <View
        style={[styles.glowTopRight, { backgroundColor: theme.pinkAccent }]}
      />
      <View style={styles.glowBottomLeft} />

      <View style={styles.container}>
        {/* HEADER SECTION */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.galleryBadge}>
              <Text style={styles.galleryBadgeText}>🖼️ TOPLULUK GALERİSİ</Text>
            </View>

            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {submissions.length} Çizim
              </Text>
            </View>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            Pixel Art <Text style={{ color: theme.pinkAccent }}>Sergisi</Text>
          </Text>
        </View>

        {/* LİSTE VEYA BOŞ DURUM */}
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
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Henüz Çizim Yok
            </Text>
            <Text
              style={[styles.emptyMessage, { color: theme.placeholder }]}
            >
              Bu challenge için ilk piksel sanatı eserini sen oluştur ve sergile!
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
                <SubmissionCard submission={item} />
              </View>
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
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

  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  header: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },

  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  galleryBadge: {
    backgroundColor: 'rgba(224, 128, 157, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
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

  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  cardWrapper: {
    width: '48.5%',
  },

  emptyContainer: {
    padding: 30,
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
    fontWeight: '800',
    marginBottom: 6,
  },

  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});