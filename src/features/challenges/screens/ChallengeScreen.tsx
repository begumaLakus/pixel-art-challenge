import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CyberArcade } from '@/constants/theme';
import { ArcadeMascotStage } from '../components/ArcadeMascotStage';
import { ChallengeActionsPanel } from '../components/ChallengeActionsPanel';
import { ChallengeEmptyState } from '../components/ChallengeEmptyState';
import { ChallengeHeader } from '../components/ChallengeHeader';
import { ChallengeHeroCard } from '../components/ChallengeHeroCard';
import { ChallengeInfoRow } from '../components/ChallengeInfoRow';
import { ChallengeLoadingState } from '../components/ChallengeLoadingState';
import { getChallengeThemeAsset } from '../constants/challengeThemes';
import { useActiveChallenge } from '../hooks/useActiveChallenge';

/**
 * Orkestratör ekran. Tema haritası, maskot animasyonu, geri sayım ve
 * ~600 satırlık stil bloğu artık ayrı dosyalarda; bu dosya sadece
 * layout + veri akışını birleştirir.
 */
export const ChallengeScreen = () => {
  const insets = useSafeAreaInsets();
  const { challenge, loading, error } = useActiveChallenge();

  if (loading) {
    return <ChallengeLoadingState />;
  }

  if (error || !challenge) {
    return <ChallengeEmptyState message={error} />;
  }

  const themeAsset = getChallengeThemeAsset(
    challenge.theme,
    CyberArcade.magenta,
  );

  return (
    <View style={styles.screen}>
      <View pointerEvents="none" style={styles.glowTopRight} />
      <View pointerEvents="none" style={styles.glowBottomLeft} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 22,
            paddingBottom: insets.bottom + 32,
          },
        ]}
      >
        <View style={styles.wrapper}>
          <ChallengeHeader />

          <ChallengeHeroCard challenge={challenge} themeAsset={themeAsset} />

          <ChallengeActionsPanel
            challengeId={challenge.id}
            endsAt={challenge.endsAt}
          />

          <ChallengeInfoRow />

          <ArcadeMascotStage themeColor={themeAsset.color} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CyberArcade.background,
    position: 'relative',
  },

  scrollContent: {
    flexGrow: 1,
  },

  wrapper: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 18,
  },

  glowTopRight: {
    position: 'absolute',
    top: -90,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: CyberArcade.purple,
    opacity: 0.12,
  },

  glowBottomLeft: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: CyberArcade.magenta,
    opacity: 0.12,
  },
});
