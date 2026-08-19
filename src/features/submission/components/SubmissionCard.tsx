import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppAlert } from '@/src/components/ui/AppAlert';
import { CyberArcade, Elevation, Radius, Spacing } from '@/constants/theme';

import { auth } from '../../auth/services/authServices';
import { VoteButton } from '../../voting/components/VoteButton';
import { useLiveVoteCount } from '../../voting/hooks/useVoting';
import { deleteSubmission } from '../services/submissionService';
import type { Submission } from '../types/types';

interface SubmissionCardProps {
  submission: Submission;
  /**
   * Bu kart, kullanıcının kendi gönderisi silindiğinde çağrılır —
   * galeriyi (SubmissionsScreen) yeniden yükleyerek listeden kaldırır.
   */
  onDeleted?: () => void;
}

/**
 * DÜZELTME: Önceki sürümde her piksel sabit 8x8'lik bir View'dı, yani
 * bir 32x32 çizim 256px, bir 16x16 çizim ise 128px genişliğinde
 * render ediliyordu. Galeri ızgarasında (2 sütun) kart genişliği sabit
 * olduğu için 32'lik çizim kartı kendi genişliğini zorlayıp taşıyor,
 * 16'lık çizim ise aynı kart genişliğine göre küçük kalıyordu — yan
 * yana geldiklerinde biri "küçücük" görünüyor, kartların genişliği
 * birbirini tutmadığı için altındaki oy butonları da hizadan kayıyordu.
 *
 * Çözüm: piksel ızgarası artık resolution'dan bağımsız, HER ZAMAN
 * kartın kullanılabilir genişliği kadar bir kare (width: '100%' +
 * aspectRatio: 1) ve her hücre flex:1 ile o karenin eşit bir dilimi.
 * 16x16 ve 32x32 çizimler artık birebir aynı fiziksel boyutta
 * gösteriliyor (32'lik olan daha ince/detaylı pikselli görünür, ki bu
 * doğru ve beklenen davranış), kart genişlikleri de böylece tutarlı
 * kalıp altındaki oy butonu satırını hizalı tutuyor.
 */
export const SubmissionCard = ({ submission, onDeleted }: SubmissionCardProps) => {
  const { pixels, resolution } = submission;
  const [deleting, setDeleting] = useState(false);

  const isOwnSubmission = auth.currentUser?.uid === submission.userId;

  // Kart, listeleme sorgusundan gelen `submission.voteCount`'u değil,
  // Firestore'u canlı dinleyen bu sayıyı gösterir — böylece bu karta ya
  // da (oy transferi yüzünden) başka bir karta oy verildiğinde/oy geri
  // alındığında sayı ekrandan çıkıp geri girmeden anında güncellenir.
  const liveVoteCount = useLiveVoteCount(submission.id, submission.voteCount ?? 0);

  const handleDeletePress = useCallback(() => {
    AppAlert.alert(
      'Çizimi Sil',
      'Gönderdiğin pixel art silinecek ve bu meydan okumaya yeniden katılabileceksin. Emin misin?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);

              await deleteSubmission(submission.id);

              onDeleted?.();
            } catch (err) {
              console.error('Gönderi silinemedi:', err);

              setDeleting(false);

              AppAlert.alert('Hata', 'Çizim silinirken bir hata oluştu.');
            }
          },
        },
      ],
    );
  }, [submission.id, onDeleted]);

  return (
    <View style={styles.card}>
      <View style={styles.pixelArtFrame}>
        <View style={styles.pixelArtContainer}>
          {Array.from({ length: resolution }).map((_, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.pixelRow}>
              {Array.from({ length: resolution }).map((_, columnIndex) => {
                const pixelIndex = rowIndex * resolution + columnIndex;

                return (
                  <View
                    key={`pixel-${rowIndex}-${columnIndex}`}
                    style={[
                      styles.pixel,
                      { backgroundColor: pixels[pixelIndex] ?? '#FFFFFF' },
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {isOwnSubmission && (
        <View style={styles.ownerBadge}>
          <Text style={styles.ownerBadgeText}>SENİN ÇİZİMİN</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.voteCount} numberOfLines={1}>
          {liveVoteCount} oy
        </Text>

        <VoteButton
          submissionId={submission.id}
          challengeId={submission.challengeId}
          isOwnSubmission={isOwnSubmission}
        />
      </View>

      {isOwnSubmission && (
      <Pressable
          accessibilityRole="button"
          accessibilityLabel="Çizimi sil"
          onPress={handleDeletePress}
          disabled={deleting}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && !deleting && styles.deleteButtonPressed,
            deleting && styles.deleteButtonDisabled,
          ]}
        >
          {deleting ? (
            <ActivityIndicator size="small" color={CyberArcade.danger} />
          ) : (
            <Text style={styles.deleteButtonText}>🗑 Sil</Text>
          )}
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.sm + 4,
    backgroundColor: CyberArcade.surface,
    borderColor: CyberArcade.border,
    ...Elevation.card,
  },

  pixelArtFrame: {
    width: '100%',
    borderRadius: Radius.sm + 2,
    padding: 2,
    backgroundColor: CyberArcade.surfaceInset,
    borderWidth: 1,
    borderColor: CyberArcade.border,
  },

  // resolution ne olursa olsun (16 ya da 32) HER ZAMAN kartın
  // genişliği kadar bir kare — tutarlı thumbnail boyutu buradan gelir.
  pixelArtContainer: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
    borderRadius: Radius.sm,
  },

  pixelRow: {
    flex: 1,
    flexDirection: 'row',
  },

  pixel: {
    flex: 1,
  },

  info: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.xs + 2,
    marginTop: Spacing.sm + 4,
  },

  voteCount: {
    flexShrink: 1,
    color: CyberArcade.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },

  ownerBadge: {
    alignSelf: 'flex-start',
    marginTop: Spacing.xs + 2,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    backgroundColor: CyberArcade.mintGlow,
  },

  ownerBadgeText: {
    color: CyberArcade.mint,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  deleteButton: {
    marginTop: Spacing.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.sm + 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 107, 0.4)',
    backgroundColor: 'rgba(255, 59, 107, 0.08)',
  },

  deleteButtonPressed: {
    opacity: 0.7,
  },

  deleteButtonDisabled: {
    opacity: 0.5,
  },

  deleteButtonText: {
    color: CyberArcade.danger,
    fontSize: 11,
    fontWeight: '800',
  },
});
