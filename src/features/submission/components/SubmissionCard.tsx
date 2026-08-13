import { AntiqueColors } from '@/constants/theme';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';

import { PixelGrid } from '../../editor/components/PixelGrid';
import type { Submission } from '../types/types';

interface SubmissionCardProps {
  submission: Submission;
  onPress?: () => void;
}

export const SubmissionCard = ({
  submission,
  onPress,
}: SubmissionCardProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const baseTheme = AntiqueColors[isDark ? 'dark' : 'light'];

  const theme = {
    ...baseTheme,
    pinkAccent: '#E0809D',
    cardBg: isDark ? '#1A1625' : '#FFFFFF',
    cardBorder: isDark ? '#2D223B' : '#F0E6ED',
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
    >
      {/* PİKSEL ÇİZİM ALANI */}
      <View style={styles.canvasWrapper}>
        <PixelGrid
          pixels={submission.pixels}
          resolution={submission.resolution}
          onPixelPress={() => {}}
        />
      </View>

      {/* ALT BİLGİ ALANI */}
      <View style={styles.info}>
        <Text style={[styles.resolution, { color: theme.placeholder }]}>
          {submission.resolution}×{submission.resolution}
        </Text>

        <View style={styles.voteBadge}>
          <Text style={styles.voteText}>❤️ {submission.voteCount}</Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 8,
    alignItems: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  canvasWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },

  info: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 2,
  },

  resolution: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  voteBadge: {
    backgroundColor: 'rgba(224, 128, 157, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(224, 128, 157, 0.3)',
  },

  voteText: {
    color: '#E0809D',
    fontSize: 11,
    fontWeight: '900',
  },
});