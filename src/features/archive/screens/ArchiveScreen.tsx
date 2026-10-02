import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/ui/AppText';
import { TAB_BAR_SPACE } from '@/src/components/ui/FloatingTabBar';
import { Screen } from '@/src/components/ui/Screen';
import { LoadingView, StateView } from '@/src/components/ui/StateView';
import { colors, spacing } from '@/src/theme';

import { ArchiveCard } from '../components/ArchiveCard';
import { useArchive } from '../hooks/useArchive';

/** Şampiyonlar: geçmiş challenge'lar ve kazanan çizimleri. */
export const ArchiveScreen = () => {
  const { archivedChallenges, loading, error, refresh } = useArchive();

  if (loading && archivedChallenges.length === 0) {
    return <LoadingView />;
  }

  if (error) {
    return (
      <StateView
        title="Arşiv yüklenemedi"
        message={error}
        actionLabel="Tekrar dene"
        onAction={refresh}
      />
    );
  }

  if (archivedChallenges.length === 0) {
    return (
      <StateView
        title="Henüz şampiyon yok"
        message="İlk challenge bittiğinde kazanan çizim burada görünür."
        sprite="trophy"
      />
    );
  }

  return (
    <Screen bottomSpace={TAB_BAR_SPACE}>
      <AppText variant="display">Şampiyonlar</AppText>
      <AppText variant="body" color={colors.muted} style={styles.subtitle}>
        Geçmiş challenge’ların kazananları.
      </AppText>

      <View style={styles.list}>
        {archivedChallenges.map((item) => (
          <ArchiveCard key={item.challenge.id} archivedChallenge={item} />
        ))}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  subtitle: { marginTop: spacing.xs },
  list: { marginTop: spacing.xl, gap: spacing.lg },
});
