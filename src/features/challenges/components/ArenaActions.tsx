import { router } from 'expo-router';
import type { Timestamp } from 'firebase/firestore';
import React, { memo, useCallback, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppAlert } from '@/src/components/ui/AppAlert';
import { AppText } from '@/src/components/ui/AppText';
import { Chip } from '@/src/components/ui/Chip';
import { PixelArt } from '@/src/components/ui/PixelArt';
import { StickerBox } from '@/src/components/ui/StickerBox';
import { StickerButton } from '@/src/components/ui/StickerButton';
import { JuryNote } from '@/src/features/submission/components/JuryNote';
import { TimelapseButton } from '@/src/features/submission/components/TimelapseButton';
import { useMySubmission } from '@/src/features/submission/hooks/useSubmission';
import { ShareArtButton } from '@/src/features/share/ShareArtButton';
import {
  cancelEndingReminder,
  scheduleEndingReminder,
} from '@/src/features/notifications/notificationService';
import { useNotificationPreference } from '@/src/features/notifications/useNotificationPreference';
import { useLiveVoteCount } from '@/src/features/voting/hooks/useVoting';
import { colors, radius, spacing } from '@/src/theme';

import { useChallengeHasEnded } from '../hooks/useChallengeHasEnded';

interface ArenaActionsProps {
  challengeId: string;
  endsAt: Timestamp;
  /** Paylaşım kartında gösterilen tema başlığı ve adı. */
  challengeTitle: string;
  theme: string;
}

const PREVIEW_SIZE = 96;

/** Başkaları oy verdikçe sayı bu ekrandan çıkmadan canlı güncellenir. */
const VoteCount = ({
  submissionId,
  initialVoteCount,
}: {
  submissionId: string;
  initialVoteCount: number;
}) => {
  const liveVoteCount = useLiveVoteCount(submissionId, initialVoteCount);

  return (
    <AppText variant="body" color={colors.muted}>
      {liveVoteCount} oy aldı
    </AppText>
  );
};

/**
 * Arena'daki eylem alanı: kullanıcı henüz katılmadıysa "Çizmeye başla",
 * katıldıysa kendi çizimi (canlı oy sayısıyla) ve silme/galeri eylemleri.
 */
export const ArenaActions = memo(
  ({ challengeId, endsAt, challengeTitle, theme }: ArenaActionsProps) => {
  const hasEnded = useChallengeHasEnded(endsAt);
  const { mySubmission, loading, deleting, removeMySubmission } =
    useMySubmission(challengeId);

  const { enabled: remindersEnabled } = useNotificationPreference();
  const endsAtMs = endsAt.toMillis();
  const joined = Boolean(mySubmission);

  // Katılmadıysan challenge bitmeden 2 saat önce hatırlatır; katılınca iptal.
  useEffect(() => {
    if (loading) {
      return;
    }

    if (remindersEnabled && !joined) {
      void scheduleEndingReminder(endsAtMs).catch(() => {});
    } else {
      void cancelEndingReminder().catch(() => {});
    }
  }, [loading, remindersEnabled, joined, endsAtMs]);

  const openEditor = useCallback(() => {
    router.push({ pathname: '/editor', params: { challengeId } });
  }, [challengeId]);

  const openGallery = useCallback(() => {
    router.navigate('/(tabs)/gallery');
  }, []);

  const confirmDelete = useCallback(() => {
    AppAlert.alert(
      'Çizimi sil',
      'Gönderdiğin çizim silinecek ve bu challenge’a yeniden katılabileceksin. Emin misin?',
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

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  if (!mySubmission) {
    return (
      <View style={styles.stack}>
        <StickerButton
          label={hasEnded ? 'Süre doldu' : 'Çizmeye başla'}
          icon="pencil"
          fullWidth
          disabled={hasEnded}
          onPress={openEditor}
        />
        <StickerButton
          label="Galeriye göz at"
          icon="image-multiple"
          variant="white"
          fullWidth
          onPress={openGallery}
        />
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      <StickerBox radius={radius.lg} contentStyle={styles.submitted}>
        <PixelArt
          pixels={mySubmission.pixels}
          resolution={mySubmission.resolution}
          size={PREVIEW_SIZE}
          style={styles.preview}
        />

        <View style={styles.info}>
          <Chip label="Gönderildi" icon="check-bold" background={colors.lime} />
          <AppText variant="title">Senin çizimin</AppText>
          <VoteCount
            submissionId={mySubmission.id}
            initialVoteCount={mySubmission.voteCount ?? 0}
          />
          <View style={styles.action}>
            <TimelapseButton submission={mySubmission} />
          </View>
        </View>
      </StickerBox>

      <JuryNote submission={mySubmission} />

      <View style={styles.row}>
        <StickerButton
          label="Galeri"
          icon="image-multiple"
          variant="ink"
          style={styles.flex}
          onPress={openGallery}
        />
        <ShareArtButton
          compact
          submission={mySubmission}
          themeTitle={challengeTitle}
          theme={theme}
          headline="Bugünün çizimi"
          detail={`${mySubmission.voteCount ?? 0} oy`}
        />
        {!hasEnded && (
          <StickerButton
            icon="trash-can-outline"
            accessibilityLabel="Çizimi sil"
            variant="white"
            loading={deleting}
            onPress={confirmDelete}
          />
        )}
      </View>
    </View>
  );
  },
);

ArenaActions.displayName = 'ArenaActions';

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  loading: { padding: spacing.xl, alignItems: 'center' },
  submitted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.md,
  },
  preview: {
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.sm,
  },
  info: { flex: 1, gap: spacing.xs + 2 },
  action: { alignSelf: 'flex-start' },
  row: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});
