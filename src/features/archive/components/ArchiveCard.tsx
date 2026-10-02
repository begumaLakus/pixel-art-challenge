import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/ui/AppText';
import { Chip } from '@/src/components/ui/Chip';
import { PixelArt } from '@/src/components/ui/PixelArt';
import { PixelSprite } from '@/src/components/ui/PixelSprite';
import { StickerBox } from '@/src/components/ui/StickerBox';
import { getChallengeThemeStyle } from '@/src/features/challenges/constants/challengeThemes';
import { colors, radius, spacing, stroke } from '@/src/theme';

import { ShareArtButton } from '@/src/features/share/ShareArtButton';
import { TimelapseButton } from '@/src/features/submission/components/TimelapseButton';

import type { ArchivedChallenge } from '../types/types';
import { formatTurkishDate } from '../utils/formatDate';

interface ArchiveCardProps {
  archivedChallenge: ArchivedChallenge;
}

const ART_SIZE = 108;

/** Tamamlanmış bir challenge: tema, tarih ve kazanan çizim. */
export const ArchiveCard = memo(({ archivedChallenge }: ArchiveCardProps) => {
  const { challenge, winnerSubmission } = archivedChallenge;
  const { accent, sprite } = getChallengeThemeStyle(challenge.theme);
  const date = formatTurkishDate(challenge.completedAt ?? challenge.endsAt);

  return (
    <StickerBox radius={radius.lg} background={accent} contentStyle={styles.card}>
      {winnerSubmission ? (
        <View>
          <PixelArt
            pixels={winnerSubmission.pixels}
            resolution={winnerSubmission.resolution}
            size={ART_SIZE}
            style={styles.art}
          />
          <View style={styles.trophy}>
            <PixelSprite name="trophy" cell={3} />
          </View>
        </View>
      ) : (
        <View style={[styles.art, styles.noWinner]}>
          <PixelSprite name={sprite} cell={6} />
        </View>
      )}

      <View style={styles.info}>
        {date ? <AppText variant="pixel">{date}</AppText> : null}

        <AppText variant="title" numberOfLines={2}>
          {challenge.title}
        </AppText>

        {winnerSubmission ? (
          <>
            <Chip
              label={`Kazanan · ${winnerSubmission.voteCount ?? 0} oy`}
              icon="trophy"
              background={colors.white}
            />
            <View style={styles.actions}>
              <TimelapseButton submission={winnerSubmission} compact />
              <ShareArtButton
                submission={winnerSubmission}
                themeTitle={challenge.title}
                theme={challenge.theme}
                headline="Günün şampiyonu"
                detail={`${winnerSubmission.voteCount ?? 0} oy${date ? ` · ${date}` : ''}`}
              />
            </View>
          </>
        ) : (
          <Chip
            label={challenge.winnerSubmissionId ? 'Çizim kaldırıldı' : 'Katılım olmadı'}
            background={colors.white}
          />
        )}
      </View>
    </StickerBox>
  );
});

ArchiveCard.displayName = 'ArchiveCard';

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.md,
  },
  art: {
    width: ART_SIZE,
    height: ART_SIZE,
    borderWidth: stroke.base,
    borderColor: colors.ink,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  noWinner: { alignItems: 'center', justifyContent: 'center' },
  trophy: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    padding: 3,
    backgroundColor: colors.white,
    borderWidth: stroke.thin,
    borderColor: colors.ink,
    borderRadius: radius.sm,
  },
  info: { flex: 1, gap: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm, alignSelf: 'flex-start' },
});
