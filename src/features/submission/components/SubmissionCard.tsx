import { StyleSheet, Text, View } from 'react-native';

import { CyberArcade, Elevation, Radius, Spacing } from '@/constants/theme';

import { VoteButton } from '../../voting/components/VoteButton';
import type { Submission } from '../types/types';

interface SubmissionCardProps {
  submission: Submission;
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
export const SubmissionCard = ({ submission }: SubmissionCardProps) => {
  const { pixels, resolution } = submission;

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

      <View style={styles.info}>
        <Text style={styles.voteCount} numberOfLines={1}>
          {submission.voteCount ?? 0} oy
        </Text>

        <VoteButton submissionId={submission.id} />
      </View>
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
});
