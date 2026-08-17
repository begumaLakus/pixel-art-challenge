import type { Timestamp } from 'firebase/firestore';
import {
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';

import { AntiqueColors } from '@/constants/theme';
import { PixelGrid } from '@/src/features/editor/components/PixelGrid';

import type { ArchivedChallenge } from '../types/types';

interface ArchiveCardProps {
  archivedChallenge: ArchivedChallenge;
}

/*
 * Tema koduna göre ikon/etiket.
 * ChallengeScreen içindeki eşleştirmenin arşiv karşılığı; oradaki map
 * export edilmediği ve o dosyaya dokunmamam gerektiği için burada
 * ayrıca tutuluyor.
 */
const THEME_ICONS: Record<
  string,
  { icon: string; label: string }
> = {
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
const formatDate = (
  value: Timestamp | null | undefined,
): string | null => {
  const date = value?.toDate?.();

  if (!date) {
    return null;
  }

  return `${date.getDate()} ${
    MONTHS_TR[date.getMonth()]
  } ${date.getFullYear()}`;
};

export const ArchiveCard = ({
  archivedChallenge,
}: ArchiveCardProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const baseTheme = AntiqueColors[isDark ? 'dark' : 'light'];

  const theme = {
    ...baseTheme,
    pinkAccent: '#E0809D',
    cardBg: isDark ? '#1A1625' : '#FFFFFF',
    cardBorder: isDark ? '#2D223B' : '#F0E6ED',
  };

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
    formatDate(challenge.completedAt) ??
    formatDate(challenge.endsAt);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder,
        },
      ]}
    >
      {/* ÜST BİLGİ */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View
            style={[
              styles.themeTag,
              { backgroundColor: theme.pinkAccent },
            ]}
          >
            <Text style={styles.themeTagText}>
              {themeAsset.icon} {themeAsset.label}
            </Text>
          </View>

          {completedLabel && (
            <Text
              style={[
                styles.dateText,
                { color: theme.placeholder },
              ]}
            >
              {completedLabel}
            </Text>
          )}
        </View>

        <Text
          style={[styles.title, { color: theme.text }]}
        >
          {challenge.title}
        </Text>

        {challenge.description && (
          <Text
            numberOfLines={2}
            style={[
              styles.description,
              { color: theme.placeholder },
            ]}
          >
            {challenge.description}
          </Text>
        )}
      </View>

      {/* KAZANAN ÇİZİM */}
      {winnerSubmission ? (
        <>
          <View style={styles.winnerBanner}>
            <Text
              style={[
                styles.winnerBannerText,
                { color: theme.brass },
              ]}
            >
              🏆 KAZANAN ÇİZİM
            </Text>

            <Text
              style={[
                styles.voteCountText,
                { color: theme.pinkAccent },
              ]}
            >
              {winnerSubmission.voteCount ?? 0} oy
            </Text>
          </View>

          {/*
            PixelGrid dokunma olaylarını yakalıyor; arşiv salt okunur
            olduğu için pointerEvents="none" ile devre dışı bırakıyoruz.
            Bu aynı zamanda listenin kaydırılmasını da engellemiyor.
          */}
          <View
            pointerEvents="none"
            style={styles.gridWrapper}
          >
            <PixelGrid
              pixels={winnerSubmission.pixels}
              resolution={winnerSubmission.resolution}
              onPixelPress={() => {}}
            />
          </View>
        </>
      ) : (
        <View
          style={[
            styles.noWinner,
            { borderColor: theme.cardBorder },
          ]}
        >
          <Text style={styles.noWinnerIcon}>🫥</Text>

          <Text
            style={[
              styles.noWinnerTitle,
              { color: theme.text },
            ]}
          >
            Katılım Olmadı
          </Text>

          <Text
            style={[
              styles.noWinnerMessage,
              { color: theme.placeholder },
            ]}
          >
            Bu meydan okumaya hiç çizim gönderilmedi.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    paddingBottom: 14,
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },

  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  themeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },

  themeTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  dateText: {
    fontSize: 12,
    fontWeight: '600',
  },

  title: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
  },

  description: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },

  winnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },

  winnerBannerText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  voteCountText: {
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
    marginHorizontal: 16,
    marginBottom: 4,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderRadius: 14,
    borderStyle: 'dashed',
    alignItems: 'center',
  },

  noWinnerIcon: {
    fontSize: 32,
    marginBottom: 8,
  },

  noWinnerTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },

  noWinnerMessage: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
