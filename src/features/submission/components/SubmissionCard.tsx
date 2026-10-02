import React, { memo, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppAlert } from '@/src/components/ui/AppAlert';
import { AppText } from '@/src/components/ui/AppText';
import { Icon } from '@/src/components/ui/Icon';
import { PixelArt } from '@/src/components/ui/PixelArt';
import { StickerBox } from '@/src/components/ui/StickerBox';
import { StickerButton } from '@/src/components/ui/StickerButton';
import { colors, radius, shadowOffset, spacing, stroke } from '@/src/theme';

import { auth } from '../../auth/services/authServices';
import { openModerationMenu } from '../../moderation/moderationMenu';
import { VoteButton } from '../../voting/components/VoteButton';
import { useLiveVoteCount } from '../../voting/hooks/useVoting';
import { deleteSubmission } from '../services/submissionService';
import { JuryNote } from './JuryNote';
import { TimelapseButton } from './TimelapseButton';
import type { Submission } from '../types/types';

interface SubmissionCardProps {
  submission: Submission;
  /** Kartın toplam genişliği (px); galeri ızgarası hesaplar. */
  width: number;
  /** Kullanıcının kendi gönderisi silindiğinde galeriyi yeniler. */
  onDeleted?: () => void;
  /** Çizim şikayet edilince galerinin onu listeden gizlemesi için. */
  onReported?: () => void;
}

const CARD_PADDING = spacing.sm;

export const SubmissionCard = memo(
  ({ submission, width, onDeleted, onReported }: SubmissionCardProps) => {
    const [deleting, setDeleting] = useState(false);

    const isOwnSubmission = auth.currentUser?.uid === submission.userId;

    // Listeleme sorgusundaki sayı değil, canlı dinlenen sayı gösterilir;
    // oy verilince ya da geri alınınca ekrandan çıkmadan güncellenir.
    const liveVoteCount = useLiveVoteCount(
      submission.id,
      submission.voteCount ?? 0,
    );

    const artSize =
      width - shadowOffset.md - (CARD_PADDING + stroke.base) * 2;

    const handleDeletePress = useCallback(() => {
      AppAlert.alert(
        'Çizimi sil',
        'Gönderdiğin çizim silinecek ve bu challenge’a yeniden katılabileceksin. Emin misin?',
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
              } catch (error) {
                console.error('Gönderi silinemedi:', error);
                setDeleting(false);
                AppAlert.alert('Çizim silinemedi', 'Birazdan tekrar dene.');
              }
            },
          },
        ],
      );
    }, [submission.id, onDeleted]);

    return (
      <StickerBox
        radius={radius.lg}
        style={{ width }}
        contentStyle={styles.card}
      >
        <PixelArt
          pixels={submission.pixels}
          resolution={submission.resolution}
          size={artSize}
          style={styles.art}
        />

        <View style={styles.infoRow}>
          <View style={styles.count}>
            <Icon name="heart" size={14} color={colors.pink} />
            <AppText variant="pixel">{liveVoteCount} oy</AppText>
          </View>

          <View style={styles.actions}>
            <TimelapseButton submission={submission} compact />

            {!isOwnSubmission && (
              <StickerButton
                size="sm"
                variant="white"
                icon="flag-outline"
                accessibilityLabel="Çizimi bildir veya kullanıcıyı engelle"
                onPress={() =>
                  openModerationMenu({
                    submission,
                    onReported: () => onReported?.(),
                    onBlocked: () => {},
                  })
                }
              />
            )}

            {isOwnSubmission && (
              <StickerButton
                size="sm"
                variant="white"
                icon="trash-can-outline"
                accessibilityLabel="Çizimi sil"
                loading={deleting}
                onPress={handleDeletePress}
              />
            )}
          </View>
        </View>

        <JuryNote submission={submission} compact />

        <VoteButton
          submissionId={submission.id}
          challengeId={submission.challengeId}
          isOwnSubmission={isOwnSubmission}
        />
      </StickerBox>
    );
  },
);

SubmissionCard.displayName = 'SubmissionCard';

const styles = StyleSheet.create({
  card: { padding: CARD_PADDING, gap: spacing.sm },
  art: {
    borderWidth: stroke.thin,
    borderColor: colors.ink,
    borderRadius: radius.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 28,
  },
  count: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  actions: { flexDirection: 'row', gap: spacing.xs + 2 },
});
