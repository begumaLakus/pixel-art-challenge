import { router } from 'expo-router';
import type { Timestamp } from 'firebase/firestore';
import React, { memo, useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppAlert } from '@/src/components/ui/AppAlert';
import { CyberArcade, Elevation, Radius, Spacing } from '@/constants/theme';
import { useMySubmission } from '@/src/features/submission/hooks/useSubmission';
import { useLiveVoteCount } from '@/src/features/voting/hooks/useVoting';

import { useChallengeHasEnded } from '../hooks/useChallengeHasEnded';

interface ChallengeActionsPanelProps {
  challengeId: string;
  endsAt: Timestamp;
}

const PREVIEW_RESOLUTION_CAP = 32;

/**
 * Kullanıcının kendi gönderisinin küçük, salt okunur önizlemesi.
 * PixelGrid dokunma/gesture altyapısına ihtiyaç duymadığı için burada
 * SubmissionCard'daki basit View ızgarası yaklaşımı tekrar kullanılıyor.
 */
const MySubmissionPreview = memo(
  ({ pixels, resolution }: { pixels: string[]; resolution: number }) => {
    const safeResolution = Math.min(resolution, PREVIEW_RESOLUTION_CAP);

    return (
      <View style={styles.previewFrame}>
        {Array.from({ length: safeResolution }).map((_, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.previewRow}>
            {Array.from({ length: safeResolution }).map((_, columnIndex) => {
              const pixelIndex = rowIndex * resolution + columnIndex;

              return (
                <View
                  key={`pixel-${rowIndex}-${columnIndex}`}
                  style={[
                    styles.previewPixel,
                    { backgroundColor: pixels[pixelIndex] ?? '#FFFFFF' },
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
    );
  },
);

MySubmissionPreview.displayName = 'MySubmissionPreview';

/**
 * "X oy aldı" metnini canlı gösterir — başkaları bu çizime oy verdikçe
 * (ya da oylarını geri aldıkça/başka bir çizime taşıdıkça) kullanıcı bu
 * ekrandan hiç çıkmadan sayı güncellenir.
 */
const MySubmissionVoteSubtitle = ({
  submissionId,
  initialVoteCount,
}: {
  submissionId: string;
  initialVoteCount: number;
}) => {
  const liveVoteCount = useLiveVoteCount(submissionId, initialVoteCount);

  return (
    <Text style={styles.submittedSubtitle}>{liveVoteCount} oy aldı</Text>
  );
};

export const ChallengeActionsPanel = memo(
  ({ challengeId, endsAt }: ChallengeActionsPanelProps) => {
    const hasEnded = useChallengeHasEnded(endsAt);
    const {
      mySubmission,
      loading: mySubmissionLoading,
      deleting,
      removeMySubmission,
    } = useMySubmission(challengeId);

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

    const handleDeletePress = useCallback(() => {
      AppAlert.alert(
        'Çizimi Sil',
        'Gönderdiğin pixel art silinecek ve bu meydan okumaya yeniden katılabileceksin. Emin misin?',
        [
          { text: 'Vazgeç', style: 'cancel' },
          {
            text: 'Sil',
            style: 'destructive',
            onPress: () => {
              removeMySubmission();
            },
          },
        ],
      );
    }, [removeMySubmission]);

    // Kullanıcı bu challenge'a zaten katıldıysa "PIXEL ART OLUŞTUR"
    // butonu yerine kendi çizimini + silme aksiyonunu gösteriyoruz.
    // Böylece aynı challenge'a ikinci kez editor ekranından girip
    // (zaten createSubmission tarafında da engellenen) mükerrer bir
    // gönderi denemesi UI seviyesinde de mümkün olmuyor.
    if (mySubmission) {
      return (
        <View style={styles.actions}>
          <View style={styles.submittedCard}>
            <MySubmissionPreview
              pixels={mySubmission.pixels}
              resolution={mySubmission.resolution}
            />

            <View style={styles.submittedInfo}>
              <View style={styles.submittedBadge}>
                <Text style={styles.submittedBadgeText}>✓ GÖNDERİLDİ</Text>
              </View>

              <Text style={styles.submittedTitle}>Senin Çizimin</Text>

              <MySubmissionVoteSubtitle
                submissionId={mySubmission.id}
                initialVoteCount={mySubmission.voteCount ?? 0}
              />

              {!hasEnded && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Çizimi sil"
                  onPress={handleDeletePress}
                  disabled={deleting}
                  style={({ pressed }) => [
                    styles.deleteButton,
                    pressed && !deleting && styles.deleteButtonPressed,
                    deleting && styles.disabledButton,
                  ]}
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color={CyberArcade.danger} />
                  ) : (
                    <Text style={styles.deleteButtonText}>🗑 Çizimi Sil</Text>
                  )}
                </Pressable>
              )}
            </View>
          </View>

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
    }

    const isCreateDisabled = hasEnded || mySubmissionLoading;

    return (
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pixel art oluştur"
          disabled={isCreateDisabled}
          onPress={handleCreatePress}
          style={({ pressed }) => [
            styles.primaryButton,
            isCreateDisabled && styles.disabledButton,
            pressed && !isCreateDisabled && styles.primaryButtonPressed,
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

  /* SENİN ÇİZİMİN KARTI */
  submittedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm + 4,
    borderRadius: Radius.lg,
    backgroundColor: CyberArcade.surface,
    borderWidth: 1,
    borderColor: CyberArcade.border,
    ...Elevation.card,
  },

  previewFrame: {
    width: 84,
    height: 84,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: CyberArcade.border,
  },

  previewRow: {
    flex: 1,
    flexDirection: 'row',
  },

  previewPixel: {
    flex: 1,
  },

  submittedInfo: {
    flex: 1,
    marginLeft: Spacing.sm + 4,
  },

  submittedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    backgroundColor: CyberArcade.mintGlow,
    marginBottom: Spacing.xs + 2,
  },

  submittedBadgeText: {
    color: CyberArcade.mint,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  submittedTitle: {
    color: CyberArcade.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },

  submittedSubtitle: {
    color: CyberArcade.secondaryText,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.xs + 4,
  },

  deleteButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.sm + 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 107, 0.4)',
    backgroundColor: 'rgba(255, 59, 107, 0.08)',
    minWidth: 96,
    alignItems: 'center',
  },

  deleteButtonPressed: {
    opacity: 0.7,
  },

  deleteButtonText: {
    color: CyberArcade.danger,
    fontSize: 11,
    fontWeight: '800',
  },
});
