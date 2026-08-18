import { router } from 'expo-router';
import type { Timestamp } from 'firebase/firestore';
import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CyberArcade } from '@/constants/theme';
import { useChallengeHasEnded } from '../hooks/useChallengeHasEnded';

interface ChallengeActionsPanelProps {
  challengeId: string;
  endsAt: Timestamp;
}

export const ChallengeActionsPanel = memo(
  ({ challengeId, endsAt }: ChallengeActionsPanelProps) => {
    const hasEnded = useChallengeHasEnded(endsAt);

    const handleCreatePress = useCallback(() => {
      router.push({
        pathname: '/editor',
        params: { challengeId },
      });
    }, [challengeId]);

    const handleGalleryPress = useCallback(() => {
      router.push({
        pathname: '/submissions',
        params: { challengeId },
      });
    }, [challengeId]);

    return (
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pixel art oluştur"
          disabled={hasEnded}
          onPress={handleCreatePress}
          style={({ pressed }) => [
            styles.primaryButton,
            hasEnded && styles.disabledButton,
            pressed && !hasEnded && styles.primaryButtonPressed,
          ]}
        >
          <View style={styles.primaryButtonIcon}>
            <Text style={styles.primaryButtonIconText}>✦</Text>
          </View>

          <View style={styles.primaryButtonCopy}>
            <Text style={styles.primaryButtonEyebrow}>CREATE</Text>

            <Text style={styles.primaryButtonText}>PIXEL ART OLUŞTUR</Text>
          </View>

          <Text style={styles.primaryArrow}>→</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Topluluk galerisi"
          onPress={handleGalleryPress}
          style={({ pressed }) => [
            styles.galleryButton,
            pressed && styles.galleryButtonPressed,
          ]}
        >
          <Text style={styles.galleryIcon}>◈</Text>

          <Text style={styles.galleryText}>TOPLULUK GALERİSİ</Text>

          <Text style={styles.galleryArrow}>→</Text>
        </Pressable>
      </View>
    );
  },
);

ChallengeActionsPanel.displayName = 'ChallengeActionsPanel';

const styles = StyleSheet.create({
  actions: {
    marginTop: 16,
    gap: 12,
  },

  // --- Birincil CTA: dolu, yüksek kontrast, yumuşak "glow" gölge ---
  primaryButton: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: CyberArcade.magenta,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    shadowColor: CyberArcade.magenta,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 5,
  },

  primaryButtonIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
  },

  primaryButtonIconText: {
    color: CyberArcade.white,
    fontSize: 22,
    fontWeight: '900',
  },

  primaryButtonCopy: {
    flex: 1,
    marginLeft: 12,
  },

  primaryButtonEyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 2,
  },

  primaryButtonText: {
    color: CyberArcade.white,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  primaryArrow: {
    color: CyberArcade.white,
    fontSize: 20,
    fontWeight: '900',
  },

  primaryButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },

  galleryButton: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 245, 212, 0.32)',
  },

  galleryIcon: {
    color: CyberArcade.mint,
    fontSize: 18,
    marginRight: 10,
  },

  galleryText: {
    flex: 1,
    color: CyberArcade.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  galleryArrow: {
    color: CyberArcade.secondaryText,
    fontSize: 18,
    fontWeight: '900',
  },

  galleryButtonPressed: {
    backgroundColor: CyberArcade.mintGlow,
    opacity: 0.92,
  },

  disabledButton: {
    opacity: 0.35,
  },
});
