import {
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';

import { AntiqueColors } from '@/constants/theme';

import { VoteButton } from '../../voting/components/VoteButton';
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

  const { pixels, resolution } = submission;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.pixelArtContainer}>
        {Array.from({ length: resolution }).map((_, rowIndex) => (
          <View
            key={`row-${rowIndex}`}
            style={styles.pixelRow}
          >
            {Array.from({ length: resolution }).map(
              (_, columnIndex) => {
                const pixelIndex =
                  rowIndex * resolution + columnIndex;

                return (
                  <View
                    key={`pixel-${rowIndex}-${columnIndex}`}
                    style={[
                      styles.pixel,
                      {
                        backgroundColor:
                          pixels[pixelIndex] ?? '#FFFDFC',
                      },
                    ]}
                  />
                );
              },
            )}
          </View>
        ))}
      </View>

      <View style={styles.info}>
        <Text
          style={[
            styles.voteCount,
            { color: theme.text },
          ]}
        >
          {submission.voteCount ?? 0} oy
        </Text>

        <VoteButton
          submissionId={submission.id}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },

  pixelArtContainer: {
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 8,
  },

  pixelRow: {
    flexDirection: 'row',
  },

  pixel: {
    width: 8,
    height: 8,
  },

  info: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },

  voteCount: {
    fontSize: 14,
    fontWeight: '600',
  },
});