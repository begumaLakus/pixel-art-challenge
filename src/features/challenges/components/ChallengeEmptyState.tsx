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

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Geri dön"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.emptyButton,
            pressed && styles.emptyButtonPressed,
          ]}
        >
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
    top: -88,
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

  emptyWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },

  emptyCard: {
    width: '100%',
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    backgroundColor: CyberArcade.surface,
    borderWidth: 1,
    borderColor: CyberArcade.border,
    shadowColor: CyberArcade.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 4,
  },

  emptyIcon: {
    color: CyberArcade.magenta,
    fontSize: 32,
    marginBottom: 12,
  },

  emptyTitle: {
    color: CyberArcade.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.6,
    textAlign: 'center',
  },

  emptyText: {
    color: CyberArcade.secondaryText,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },

  emptyButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CyberArcade.magenta,
    backgroundColor: CyberArcade.magentaGlow,
  },

  emptyButtonPressed: {
    opacity: 0.8,
  },

  emptyButtonText: {
    color: CyberArcade.magenta,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
