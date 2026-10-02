import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/ui/AppText';
import { Icon } from '@/src/components/ui/Icon';
import { colors, radius, spacing, stroke } from '@/src/theme';

import type { Submission } from '../types/types';

interface JuryNoteProps {
  submission: Pick<Submission, 'jury'>;
  /** Kart içinde yer kazanmak için metni kısaltır. */
  compact?: boolean;
}

/** Yapay zekâ jürinin kısa yorumu; yorum yoksa hiçbir şey çizmez. */
export const JuryNote = ({ submission, compact = false }: JuryNoteProps) => {
  const text = submission.jury?.text;

  if (!text) {
    return null;
  }

  return (
    <View style={styles.note} accessibilityLabel={`Yapay zekâ jüri: ${text}`}>
      <View style={styles.header}>
        <Icon name="creation" size={12} />
        <AppText variant="pixel" style={styles.label}>
          AI jüri
        </AppText>
      </View>

      <AppText variant="caption" numberOfLines={compact ? 3 : undefined}>
        {text}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  note: {
    gap: 2,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: stroke.thin,
    borderColor: colors.ink,
    backgroundColor: colors.paper,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  label: { fontSize: 10 },
});
