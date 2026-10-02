import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/ui/AppText';
import { Chip } from '@/src/components/ui/Chip';
import { TAB_BAR_SPACE } from '@/src/components/ui/FloatingTabBar';
import { Screen } from '@/src/components/ui/Screen';
import { LoadingView, StateView } from '@/src/components/ui/StateView';
import { useUserStats } from '@/src/features/profile/hooks/useUserStats';
import { getActiveStreak } from '@/src/features/profile/utils/stats';
import { colors, spacing } from '@/src/theme';

import { ArenaActions } from '../components/ArenaActions';
import { ChallengeHero } from '../components/ChallengeHero';
import { useActiveChallenge } from '../hooks/useActiveChallenge';

/**
 * Ana ekran: günün teması, kalan süre ve kullanıcının bu challenge'daki
 * durumu (katıl / kendi çizimi). Veri canlı abonelikle gelir.
 */
export const ArenaScreen = () => {
  const { challenge, loading, error } = useActiveChallenge();
  const { stats } = useUserStats();

  if (loading) {
    return <LoadingView />;
  }

  if (error || !challenge) {
    return (
      <StateView
        title="Arena şu an boş"
        message={
          error ??
          'Aktif bir challenge yok. Yeni tema birazdan yayınlanacak, birazdan tekrar bak.'
        }
      />
    );
  }

  const streak = getActiveStreak(stats, challenge.startsAt.toMillis());

  return (
    <Screen bottomSpace={TAB_BAR_SPACE}>
      <View style={styles.header}>
        <AppText variant="pixel" color={colors.inkSoft}>
          Pixel.art
        </AppText>
        <View style={styles.chips}>
          {streak > 0 ? (
            <Chip label={`${streak} gün seri`} icon="fire" background={colors.yellow} />
          ) : null}
          <Chip label="Canlı" dot />
        </View>
      </View>

      <AppText variant="display" style={styles.title}>
        Pixel{'\n'}Challenge
      </AppText>

      <View style={styles.sections}>
        <ChallengeHero challenge={challenge} />

        <ArenaActions
          challengeId={challenge.id}
          endsAt={challenge.endsAt}
          challengeTitle={challenge.title}
          theme={challenge.theme}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chips: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { marginTop: spacing.lg, fontSize: 40, lineHeight: 42 },
  sections: { marginTop: spacing.xl, gap: spacing.xl },
});
