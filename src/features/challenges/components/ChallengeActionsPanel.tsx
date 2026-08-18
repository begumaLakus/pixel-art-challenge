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

/**
 * `hasEnded` burada kendi hook'undan (useChallengeHasEnded) geliyor —
 * saniyelik tick üreten useCountdown'a bağımlı DEĞİL. Böylece bu panel,
 * hero karttaki geri sayım her saniye güncellenirken gereksiz yere
 * yeniden render olmaz; sadece challenge gerçekten bittiğinde bir kez
 * render olur.
 */
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
          disabled={hasEnded}
          onPress={handleCreatePress}
          style={({ pressed }) => [
            styles.primaryButton,
            hasEnded && styles.disabledButton,
            pressed && !hasEnded && styles.buttonPressed,
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
          onPress={handleGalleryPress}
          style={({ pressed }) => [
            styles.galleryButton,
            pressed && styles.buttonPressed,
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
    marginTop: 12,
    gap: 10,
  },

  primaryButton: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: CyberArcade.magenta,
    borderWidth: 1,
    borderColor: '#FF69A8',
    shadowColor: CyberArcade.magenta,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 4,
  },

  primaryButtonIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.14)',
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
    color: 'rgba(255,255,255,0.7)',
    fontSize: 8,
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
    fontSize: 22,
    fontWeight: '900',
  },

  galleryButton: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor: CyberArcade.surface,
    borderWidth: 1,
    borderColor: CyberArcade.border,
  },

  galleryIcon: {
    color: CyberArcade.mint,
    fontSize: 19,
    marginRight: 10,
  },

  galleryText: {
    flex: 1,
    color: CyberArcade.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  galleryArrow: {
    color: CyberArcade.secondaryText,
    fontSize: 19,
    fontWeight: '900',
  },

  buttonPressed: {
    transform: [{ translateY: 3 }],
    opacity: 0.88,
  },

  disabledButton: {
    opacity: 0.35,
  },
});
