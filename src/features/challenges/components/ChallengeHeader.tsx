import { router } from 'expo-router';
import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CyberArcade } from '@/constants/theme';

export const ChallengeHeader = memo(() => (
  <View style={styles.header}>
    <Pressable onPress={() => router.back()} style={styles.backButton}>
      <Text style={styles.backText}>← ARENA</Text>
    </Pressable>

    <View style={styles.headerBadge}>
      <View style={styles.headerDot} />

      <Text style={styles.headerBadgeText}>LIVE CHALLENGE</Text>
    </View>
  </View>
));

ChallengeHeader.displayName = 'ChallengeHeader';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },

  backText: {
    color: CyberArcade.secondaryText,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor: CyberArcade.mintGlow,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.25)',
  },

  headerDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: CyberArcade.mint,
    marginRight: 6,
  },

  headerBadgeText: {
    color: CyberArcade.mint,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
