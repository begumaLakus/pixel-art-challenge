import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { CyberArcade, Radius, Spacing } from '@/constants/theme';

import { useVoting } from '../hooks/useVoting';

interface VoteButtonProps {
  submissionId: string;
}

/**
 * Boyut notu: bu buton SubmissionCard içinde 2 sütunlu, ~130-160px
 * genişliğindeki dar bir kartta "X oy" metniyle yan yana duruyor.
 * Önceki minWidth (110) + metin, dar telefonlarda (~360dp) kartın
 * sağından taşıp oy butonlarının satır satır hizasını bozuyordu.
 * Daha kompakt bir "chip" boyutuna çekildi; dokunma alanı hitSlop ile
 * korunuyor.
 */
export const VoteButton = ({ submissionId }: VoteButtonProps) => {
  const { hasVoted, loading, voting, error, vote } = useVoting(submissionId);

  if (loading) {
    return (
      <Pressable disabled style={[styles.button, styles.buttonSkeleton]}>
        <ActivityIndicator size="small" color={CyberArcade.mutedText} />
      </Pressable>
    );
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={hasVoted ? 'Oy verildi' : 'Oy ver'}
        hitSlop={6}
        onPress={vote}
        disabled={hasVoted || voting}
        style={({ pressed }) => [
          styles.button,
          hasVoted ? styles.buttonVoted : styles.buttonActive,
          (hasVoted || voting) && styles.buttonMuted,
          pressed && !hasVoted && !voting && styles.buttonPressed,
        ]}
      >
        {voting ? (
          <ActivityIndicator size="small" color={CyberArcade.white} />
        ) : (
          <Text
            style={[
              styles.buttonText,
              hasVoted ? styles.buttonTextVoted : styles.buttonTextActive,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            {hasVoted ? '✓ Oy Verildi' : '♡ Oy Ver'}
          </Text>
        )}
      </Pressable>

      {error && (
        <Text style={styles.error} numberOfLines={2}>
          {error}
        </Text>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    minWidth: 84,
    minHeight: 36,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  buttonActive: {
    backgroundColor: CyberArcade.magenta,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },

  buttonVoted: {
    backgroundColor: CyberArcade.surfaceInset,
    borderColor: CyberArcade.border,
  },

  buttonSkeleton: {
    backgroundColor: CyberArcade.surfaceInset,
    borderColor: CyberArcade.border,
  },

  buttonMuted: {
    opacity: 0.75,
  },

  buttonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },

  buttonText: {
    fontSize: 11,
    fontWeight: '700',
  },

  buttonTextActive: {
    color: CyberArcade.white,
  },

  buttonTextVoted: {
    color: CyberArcade.mutedText,
  },

  error: {
    color: CyberArcade.danger,
    fontSize: 11,
    marginTop: Spacing.xs + 2,
    textAlign: 'center',
  },
});
