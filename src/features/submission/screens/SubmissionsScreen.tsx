import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CyberArcade, Elevation, Radius, Spacing } from '@/constants/theme';

import { SubmissionCard } from '../components/SubmissionCard';
import { useSubmissions } from '../hooks/useSubmission';

interface SubmissionsScreenProps {
  challengeId: string;
}

/**
 Topluluk Galerisi
 */
export const SubmissionsScreen = ({
  challengeId,
}: SubmissionsScreenProps) => {
  const { submissions, loading, error } = useSubmissions(challengeId);

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={CyberArcade.magenta} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center} edges={['top', 'left', 'right']}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.mainWrapper} edges={['top', 'left', 'right']}>
      <View pointerEvents="none" style={styles.glowTopRight} />
      <View pointerEvents="none" style={styles.glowBottomLeft} />

      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.galleryBadge}>
              <Text style={styles.galleryBadgeText} numberOfLines={1}>
                🖼️ TOPLULUK GALERİSİ
              </Text>
            </View>

            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText} numberOfLines={1}>
                {submissions.length} Çizim
              </Text>
            </View>
          </View>

          <Text style={styles.title}>
            Pixel Art <Text style={styles.titleAccent}>Sergisi</Text>
          </Text>
        </View>

        {/* EMPTY STATE */}
        {submissions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎨</Text>

            <Text style={styles.emptyTitle}>Henüz Çizim Yok</Text>

            <Text style={styles.emptyMessage}>
              Bu challenge için ilk piksel sanatı eserini sen oluştur ve
              sergile!
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
    backgroundColor: CyberArcade.background,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    backgroundColor: CyberArcade.background,
  },

  errorText: {
    maxWidth: 340,
    color: CyberArcade.secondaryText,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },

  glowTopRight: {
    position: 'absolute',
    top: -70,
    right: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: CyberArcade.magenta,
    opacity: 0.1,
  },

  glowBottomLeft: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: CyberArcade.purple,
    opacity: 0.1,
  },

  container: {
    flex: 1,
    width: '100%',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },

  header: {
    width: '100%',
    marginBottom: Spacing.md,
  },

  headerTopRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },

  galleryBadge: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: Spacing.sm + 1,
    paddingVertical: Spacing.xs + 1,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: CyberArcade.border,
    backgroundColor: CyberArcade.surface,
  },

  galleryBadgeText: {
    color: CyberArcade.secondaryText,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  countBadge: {
    flexShrink: 0,
    paddingHorizontal: Spacing.sm + 1,
    paddingVertical: Spacing.xs + 1,
    borderRadius: Radius.pill,
    backgroundColor: CyberArcade.surface,
    borderWidth: 1,
    borderColor: CyberArcade.border,
  },

  countBadgeText: {
    color: CyberArcade.gold,
    fontSize: 10,
    fontWeight: '700',
  },

  title: {
    width: '100%',
    color: CyberArcade.textPrimary,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  titleAccent: {
    color: CyberArcade.magenta,
  },

  list: {
    width: '100%',
    paddingBottom: Spacing.lg,
  },

  columnWrapper: {
    width: '100%',
    alignItems: 'flex-start',
    gap: Spacing.sm + 4,
    marginBottom: Spacing.sm + 4,
  },

  cardWrapper: {
    flex: 1,
    minWidth: 0,
    maxWidth: '50%',
  },

  emptyContainer: {
    width: '100%',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl - 4,
    borderWidth: 1,
    borderRadius: Radius.xl,
    backgroundColor: CyberArcade.surface,
    borderColor: CyberArcade.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl - 4,
    ...Elevation.card,
  },

  emptyIcon: {
    fontSize: 42,
    marginBottom: Spacing.sm + 2,
  },

  emptyTitle: {
    color: CyberArcade.textPrimary,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.xs + 2,
  },

  emptyMessage: {
    width: '100%',
    maxWidth: 320,
    color: CyberArcade.secondaryText,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
