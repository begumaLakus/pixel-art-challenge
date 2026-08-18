import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CyberArcade } from '@/constants/theme';

/**
 * Statik bilgi şeridi (24H / LIVE / 🏆). Props almaz, hiçbir zaman
 * yeniden render olmasına gerek yok — memo salt bir garanti katmanı.
 */
export const ChallengeInfoRow = memo(() => (
  <View style={styles.infoRow}>
    <View style={styles.infoItem}>
      <Text style={styles.infoValue}>24H</Text>

      <Text style={styles.infoLabel}>CHALLENGE</Text>
    </View>

    <View style={styles.infoDivider} />

    <View style={styles.infoItem}>
      <Text style={[styles.infoValue, { color: CyberArcade.mint }]}>
        LIVE
      </Text>

      <Text style={styles.infoLabel}>OYLAMA</Text>
    </View>

    <View style={styles.infoDivider} />

    <View style={styles.infoItem}>
      <Text style={[styles.infoValue, { color: CyberArcade.gold }]}>🏆</Text>

      <Text style={styles.infoLabel}>ÖDÜL</Text>
    </View>
  </View>
));

ChallengeInfoRow.displayName = 'ChallengeInfoRow';

const styles = StyleSheet.create({
  infoRow: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: CyberArcade.border,
  },

  infoItem: {
    alignItems: 'center',
    minWidth: 70,
  },

  infoDivider: {
    width: 1,
    height: 24,
    backgroundColor: CyberArcade.border,
  },

  infoValue: {
    color: CyberArcade.gold,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  infoLabel: {
    marginTop: 4,
    color: CyberArcade.mutedText,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
