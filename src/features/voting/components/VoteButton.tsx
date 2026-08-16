import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    useColorScheme,
} from 'react-native';

import { AntiqueColors } from '@/constants/theme';

import { useVoting } from '../hooks/useVoting';

interface VoteButtonProps {
  submissionId: string;
}

export const VoteButton = ({
  submissionId,
}: VoteButtonProps) => {
  const colorScheme = useColorScheme();

  const theme =
    AntiqueColors[colorScheme === 'dark' ? 'dark' : 'light'];

  const {
    hasVoted,
    loading,
    voting,
    error,
    vote,
  } = useVoting(submissionId);

  if (loading) {
    return (
      <Pressable
        disabled
        style={[
          styles.button,
          {
            backgroundColor: theme.border,
          },
        ]}
      >
        <ActivityIndicator
          size="small"
          color={theme.text}
        />
      </Pressable>
    );
  }

  return (
    <>
      <Pressable
        onPress={vote}
        disabled={hasVoted || voting}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: hasVoted
              ? theme.border
              : theme.accent,
            opacity:
              hasVoted || voting
                ? 0.7
                : pressed
                  ? 0.8
                  : 1,
          },
        ]}
      >
        {voting ? (
          <ActivityIndicator
            size="small"
            color={theme.background}
          />
        ) : (
          <Text
            style={[
              styles.buttonText,
              {
                color: hasVoted
                  ? theme.placeholder
                  : theme.background,
              },
            ]}
          >
            {hasVoted ? '✓ Oy Verildi' : '♡ Oy Ver'}
          </Text>
        )}
      </Pressable>

      {error && (
        <Text
          style={[
            styles.error,
            { color: theme.danger },
          ]}
        >
          {error}
        </Text>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    minWidth: 110,
    minHeight: 42,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  error: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
});