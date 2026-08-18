import { router } from 'expo-router';
import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CyberArcade } from '@/constants/theme';

interface ChallengeEmptyStateProps {
  message: string | null;
}

export const ChallengeEmptyState = memo(({ message }: ChallengeEmptyStateProps) => (
  <View style={styles.screen}>
    <View pointerEvents="none" style={styles.glowTopRight} />
    <View pointerEvents="none" style={styles.glowBottomLeft} />

    <View style={styles.emptyWrapper}>
      <View style={styles.emptyCard}>
        <Text style={styles.emptyIcon}>⚠</Text>

        <Text style={styles.emptyTitle}>ARENA BAĞLANTISI YOK</Text>

        <Text style={styles.emptyText}>
          {message ?? 'Şu anda aktif bir challenge bulunmuyor.'}
        </Text>

        <Pressable onPress={() => router.back()} style={styles.emptyButton}>
          <Text style={styles.emptyButtonText}>GERİ DÖN</Text>
        </Pressable>
      </View>
    </View>
  </View>
));

ChallengeEmptyState.displayName = 'ChallengeEmptyState';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CyberArcade.background,
    position: 'relative',
  },

  glowTopRight: {
    position: 'absolute',
    top: -90,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: CyberArcade.purple,
    opacity: 0.12,
  },

  glowBottomLeft: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: CyberArcade.magenta,
    opacity: 0.12,
  },

  emptyWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },

  emptyCard: {
    width: '100%',
    alignItems: 'center',
    padding: 26,
    borderRadius: 18,
    backgroundColor: CyberArcade.surface,
    borderWidth: 1,
    borderColor: CyberArcade.border,
  },

  emptyIcon: {
    color: CyberArcade.magenta,
    fontSize: 34,
    marginBottom: 12,
  },

  emptyTitle: {
    color: CyberArcade.white,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.8,
    textAlign: 'center',
  },

  emptyText: {
    color: CyberArcade.secondaryText,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
  },

  emptyButton: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: CyberArcade.magenta,
    backgroundColor: CyberArcade.magentaGlow,
  },

  emptyButtonText: {
    color: CyberArcade.magenta,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
