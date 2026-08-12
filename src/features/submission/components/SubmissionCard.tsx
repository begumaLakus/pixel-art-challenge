import {
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';

import { AntiqueColors } from '@/constants/theme';

import { PixelGrid } from '../../editor/components/PixelGrid';

import type { Submission } from '../types/types';

interface SubmissionCardProps {
  submission: Submission;
}

export const SubmissionCard = ({
  submission,
}: SubmissionCardProps) => {
  const colorScheme = useColorScheme();

  const theme =
    AntiqueColors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.placeholder,
        },
      ]}
    >
      <PixelGrid
        pixels={submission.pixels}
        resolution={submission.resolution}
        onPixelPress={() => {}}
      />

      <View style={styles.info}>
        <Text style={[styles.resolution, { color: theme.text }]}>
          {submission.resolution}×{submission.resolution}
        </Text>

        <Text style={{ color: theme.text }}>
          ❤️ {submission.voteCount} oy
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },

  info: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },

  resolution: {
    fontWeight: '600',
  },
});