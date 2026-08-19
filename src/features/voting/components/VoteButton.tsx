import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { AppAlert } from '@/src/components/ui/AppAlert';
import { CyberArcade, Radius, Spacing } from '@/constants/theme';

import { useVoting } from '../hooks/useVoting';

interface VoteButtonProps {
  submissionId: string;
  challengeId: string;
  /**
   * Kartın sahibi giriş yapmış kullanıcının kendisiyse `true`. Bu
   * durumda buton hâlâ dokunulabilir (accessibility açısından tamamen
   * `disabled` yapmıyoruz), ama oy vermek yerine kullanıcıya kendi
   * eserine oy veremeyeceğini açıklayan bir Alert/toast gösteriyor.
   * votingService de aynı durumu reddediyor (savunma katmanı), ama
   * kullanıcıyı hiç o hataya sürüklememek daha iyi bir deneyim.
   */
  isOwnSubmission?: boolean;
}

/**
 * Boyut notu: bu buton SubmissionCard içinde 2 sütunlu, ~130-160px
 * genişliğindeki dar bir kartta "X oy" metniyle yan yana duruyor.
 * Önceki minWidth (110) + metin, dar telefonlarda (~360dp) kartın
 * sağından taşıp oy butonlarının satır satır hizasını bozuyordu.
 * Daha kompakt bir "chip" boyutuna çekildi; dokunma alanı hitSlop ile
 * korunuyor.
 */
export const VoteButton = ({
  submissionId,
  challengeId,
  isOwnSubmission,
}: VoteButtonProps) => {
  const { hasVoted, loading, voting, vote } = useVoting(
    submissionId,
    challengeId,
  );

  if (isOwnSubmission) {
    const handleOwnSubmissionPress = () => {
      AppAlert.alert('Kendi eserinize oy veremezsiniz.');
    };

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Kendi çiziminize oy veremezsiniz"
        accessibilityState={{ disabled: true }}
        hitSlop={6}
        onPress={handleOwnSubmissionPress}
        style={({ pressed }) => [
          styles.button,
          styles.buttonOwn,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={styles.buttonTextOwn} numberOfLines={1}>
          Senin Çizimin
        </Text>
      </Pressable>
    );
  }

  if (loading) {
    return (
      <Pressable disabled style={[styles.button, styles.buttonSkeleton]}>
        <ActivityIndicator size="small" color={CyberArcade.mutedText} />
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hasVoted ? 'Oyu geri al' : 'Oy ver'}
      hitSlop={6}
      onPress={vote}
      disabled={voting}
      style={({ pressed }) => [
        styles.button,
        hasVoted ? styles.buttonVoted : styles.buttonActive,
        voting && styles.buttonMuted,
        pressed && !voting && styles.buttonPressed,
      ]}
    >
      {voting ? (
        <ActivityIndicator
          size="small"
          color={hasVoted ? CyberArcade.mutedText : CyberArcade.white}
        />
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

  buttonOwn: {
    backgroundColor: CyberArcade.surfaceInset,
    borderColor: CyberArcade.border,
    opacity: 0.7,
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

  buttonTextOwn: {
    color: CyberArcade.mutedText,
    fontSize: 10,
    fontWeight: '700',
  },
});
