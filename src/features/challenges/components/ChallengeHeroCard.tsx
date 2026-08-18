import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CyberArcade } from '@/constants/theme';
import type { ChallengeThemeAsset } from '../constants/challengeThemes';
import { useCountdown } from '../hooks/useCountdown';
import type { Challenge } from '../types/challenge';

interface ChallengeHeroCardProps {
  challenge: Challenge;
  themeAsset: ChallengeThemeAsset;
}

/**
 * Saniyede bir tick atan tek yer burasıdır (useCountdown). Bu sayede
 * ChallengeScreen ve kardeş component'ler (ActionsPanel, InfoRow, mascot)
 * her saniye yeniden render olmaz — re-render sadece bu karta izole edilir.
 */
export const ChallengeHeroCard = memo(
  ({ challenge, themeAsset }: ChallengeHeroCardProps) => {
    const { formatted, hasEnded } = useCountdown(challenge.endsAt);

    return (
      <View style={[styles.heroCard, { borderColor: themeAsset.color }]}>
        <View
          style={[styles.heroOrb, { backgroundColor: themeAsset.color }]}
        />

        <View style={styles.heroTop}>
          <View style={styles.themeBadge}>
            <Text style={styles.themeBadgeIcon}>{themeAsset.icon}</Text>

            <Text
              style={[styles.themeBadgeText, { color: themeAsset.color }]}
            >
              {themeAsset.label}
            </Text>
          </View>

          <View style={styles.liveStatus}>
            <View style={styles.liveStatusDot} />

            <Text style={styles.liveStatusText}>ACTIVE</Text>
          </View>
        </View>

        <Text style={styles.missionLabel}>TODAY'S MISSION</Text>

        <Text style={styles.title}>{challenge.title}</Text>

        <Text style={styles.description}>{challenge.description}</Text>

        <View style={styles.timerPanel}>
          <View>
            <Text style={styles.timerLabel}>REMAINING TIME</Text>

            <Text style={[styles.timer, hasEnded && styles.timerEnded]}>
              {formatted}
            </Text>
          </View>

          <View style={styles.timerIcon}>
            <Text style={styles.timerIconText}>⏱</Text>
          </View>
        </View>
      </View>
    );
  },
);

ChallengeHeroCard.displayName = 'ChallengeHeroCard';

const styles = StyleSheet.create({
  heroCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: CyberArcade.surface,
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    shadowColor: CyberArcade.magenta,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 7,
  },

  heroOrb: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: 210,
    height: 210,
    borderRadius: 105,
    opacity: 0.06,
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  themeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor: CyberArcade.background,
    borderWidth: 1,
    borderColor: CyberArcade.border,
  },

  themeBadgeIcon: {
    fontSize: 13,
    marginRight: 6,
  },

  themeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  liveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  liveStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: CyberArcade.magenta,
    marginRight: 6,
  },

  liveStatusText: {
    color: CyberArcade.magenta,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  missionLabel: {
    marginTop: 26,
    color: CyberArcade.mint,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.8,
  },

  title: {
    marginTop: 5,
    color: CyberArcade.white,
    fontSize: 30,
    lineHeight: 35,
    fontWeight: '900',
    letterSpacing: -0.8,
  },

  description: {
    marginTop: 10,
    color: CyberArcade.secondaryText,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },

  timerPanel: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 13,
    borderRadius: 12,
    backgroundColor: CyberArcade.background,
    borderWidth: 1,
    borderColor: CyberArcade.border,
  },

  timerLabel: {
    color: CyberArcade.mutedText,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 4,
  },

  timer: {
    color: CyberArcade.magenta,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
  },

  timerEnded: {
    color: CyberArcade.danger,
  },

  timerIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CyberArcade.magentaGlow,
    borderWidth: 1,
    borderColor: 'rgba(255, 42, 133, 0.2)',
  },

  timerIconText: {
    color: CyberArcade.magenta,
    fontSize: 20,
  },
});
