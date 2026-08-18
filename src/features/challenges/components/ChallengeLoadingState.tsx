import React, { memo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { CyberArcade } from '@/constants/theme';

export const ChallengeLoadingState = memo(() => (
  <View style={styles.loadingScreen}>
    <View style={styles.loadingBox}>
      <ActivityIndicator size="small" color={CyberArcade.magenta} />

      <Text style={styles.loadingText}>ARENA YÜKLENİYOR</Text>
    </View>
  </View>
));

ChallengeLoadingState.displayName = 'ChallengeLoadingState';

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: CyberArcade.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    color: CyberArcade.mutedText,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});
