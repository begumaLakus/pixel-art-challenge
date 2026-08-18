import type { Timestamp } from 'firebase/firestore';
import { StyleSheet, Text, View } from 'react-native';

import { CyberArcade, Elevation, Radius, Spacing } from '@/constants/theme';
import { PixelGrid } from '@/src/features/editor/components/PixelGrid';

import type { ArchivedChallenge } from '../types/types';

interface ArchiveCardProps {
  archivedChallenge: ArchivedChallenge;
}

// ArchiveScreen ile aynı "rose gold" vurgu — arşiv bölümünü diğer
// (canlı/magenta) ekranlardan görsel olarak ayırt eden bilinçli tercih.
const ARCHIVE_ACCENT = '#E8A0BE';

/*
 * Tema koduna göre ikon/etiket.
 * ChallengeScreen içindeki eşleştirmenin arşiv karşılığı; oradaki map
 * export edilmediği ve o dosyaya dokunmamam gerektiği için burada
 * ayrıca tutuluyor.
 */
const THEME_ICONS: Record<string, { icon: string; label: string }> = {
  uzay_macerasi: { icon: '🚀', label: 'UZAY' },
  cilgin_canlilar: { icon: '🐱', label: 'CANLILAR' },
  masalsi_doga: { icon: '🍄', label: 'DOĞA' },
  gece_acikmalari: { icon: '🍕', label: 'YEMEK' },
  buyulu_dunyam: { icon: '🧙‍♂️', label: 'BÜYÜ' },
  nostalji_atari: { icon: '🕹️', label: 'ATARİ' },
  gelecegin_sehri: { icon: '🤖', label: 'CYBER' },
  derin_okyanus: { icon: '🐙', label: 'OKYANUS' },
  sevimli_canavarlar: { icon: '👾', label: 'CANAVAR' },
  cilgin_araclar: { icon: '🏎️', label: 'ARAÇ' },
  perili_gece: { icon: '👻', label: 'PERİLİ' },
  sira_disi_meslekler: { icon: '👨‍🔬', label: 'MESLEK' },
};

const MONTHS_TR = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

/**
 * Timestamp eski dokümanlarda eksik olabileceği için toDate()
 * doğrudan çağrılmıyor. Okunamazsa null döner.
 */
const formatDate = (value: Timestamp | null | undefined): string | null => {
  const date = value?.toDate?.();

  if (!date) {
    return null;
  }

  return `${date.getDate()} ${MONTHS_TR[date.getMonth()]} ${date.getFullYear()}`;
};

export const ArchiveCard = ({ archivedChallenge }: ArchiveCardProps) => {
  const { challenge, winnerSubmission } = archivedChallenge;

  const themeAsset = THEME_ICONS[challenge.theme] ?? {
    icon: '🎨',
    label: challenge.theme?.toUpperCase() ?? 'TEMA',
  };

  /*
   * completedAt Cloud Function tarafından yazılıyor ama eski
   * kayıtlarda olmayabilir; o durumda endsAt'e düşüyoruz.
   */
  const completedLabel =
    formatDate(challenge.completedAt) ?? formatDate(challenge.endsAt);

  return (
    <View style={styles.card}>
      {/* ÜST BİLGİ */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.themeTag}>
            <Text style={styles.themeTagText}>
              {themeAsset.icon} {themeAsset.label}
            </Text>
          </View>

          {completedLabel && (
            <Text style={styles.dateText}>{completedLabel}</Text>
          )}
        </View>

        <Text style={styles.title}>{challenge.title}</Text>

        {challenge.description && (
          <Text numberOfLines={2} style={styles.description}>
            {challenge.description}
          </Text>
        )}
      </View>

      {/* KAZANAN ÇİZİM */}
      {winnerSubmission ? (
        <>
          <View style={styles.winnerBanner}>
            <Text style={styles.winnerBannerText}>🏆 KAZANAN ÇİZİM</Text>

            <Text style={styles.voteCountText}>
              {winnerSubmission.voteCount ?? 0} oy
            </Text>
          </View>

          {/*
            PixelGrid dokunma olaylarını yakalıyor; arşiv salt okunur
            olduğu için pointerEvents="none" ile devre dışı bırakıyoruz.
            Bu aynı zamanda listenin kaydırılmasını da engellemiyor.
          */}
          <View pointerEvents="none" style={styles.gridWrapper}>
            <PixelGrid
              pixels={winnerSubmission.pixels}
              resolution={winnerSubmission.resolution}
              onPixelPress={() => {}}
            />
          </View>
        </>
      ) : (
        <View style={styles.noWinner}>
          <Text style={styles.noWinnerIcon}>🫥</Text>

          <Text style={styles.noWinnerTitle}>Katılım Olmadı</Text>

          <Text style={styles.noWinnerMessage}>
            Bu meydan okumaya hiç çizim gönderilmedi.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm + 6,
    backgroundColor: CyberArcade.surface,
    borderColor: CyberArcade.border,
    ...Elevation.card,
  },

  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm + 6,
    paddingBottom: Spacing.sm + 4,
  },

  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm + 2,
  },

  themeTag: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm - 2,
    backgroundColor: ARCHIVE_ACCENT,
  },

  themeTagText: {
    color: '#2B0E1E',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  dateText: {
    color: CyberArcade.mutedText,
    fontSize: 12,
    fontWeight: '600',
  },

  title: {
    color: CyberArcade.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: Spacing.xs + 2,
  },

  description: {
    color: CyberArcade.secondaryText,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },

  winnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm + 2,
  },

  winnerBannerText: {
    color: CyberArcade.gold,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  voteCountText: {
    color: ARCHIVE_ACCENT,
    fontSize: 13,
    fontWeight: '800',
  },

  /*
   * Yatay padding yok: PixelGrid kendi genişliğini
   * (ekran genişliği - 20) olarak hesaplıyor ve kart bu
   * genişliğe tam oturuyor.
   */
  gridWrapper: {
    alignItems: 'center',
  },

  noWinner: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.lg,
    borderStyle: 'dashed',
    borderColor: CyberArcade.border,
    alignItems: 'center',
  },

  noWinnerIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },

  noWinnerTitle: {
    color: CyberArcade.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },

  noWinnerMessage: {
    color: CyberArcade.secondaryText,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
