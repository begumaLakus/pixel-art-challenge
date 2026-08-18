import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CyberArcade } from '@/constants/theme';


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
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 16,
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
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  infoLabel: {
    marginTop: 4,
    color: CyberArcade.mutedText,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
