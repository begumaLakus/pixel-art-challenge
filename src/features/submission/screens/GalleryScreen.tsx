import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/src/components/ui/AppText';
import { TAB_BAR_SPACE } from '@/src/components/ui/FloatingTabBar';
import { LoadingView, StateView } from '@/src/components/ui/StateView';
import { StickerBox } from '@/src/components/ui/StickerBox';
import { StickerButton } from '@/src/components/ui/StickerButton';
import { Countdown } from '@/src/features/challenges/components/Countdown';
import { useActiveChallenge } from '@/src/features/challenges/hooks/useActiveChallenge';
import type { Challenge } from '@/src/features/challenges/types/challenge';
import {
  colors,
  MAX_CONTENT_WIDTH,
  radius,
  spacing,
  stroke,
} from '@/src/theme';

import { SubmissionCard } from '../components/SubmissionCard';
import { useBlockedUsers } from '../../moderation/hooks/useBlockedUsers';
import { useSubmissions } from '../hooks/useSubmission';
import type { Submission } from '../types/types';

type SortMode = 'newest' | 'top';

const SORT_OPTIONS: { mode: SortMode; label: string }[] = [
  { mode: 'newest', label: 'En yeni' },
  { mode: 'top', label: 'En çok oy' },
];

const COLUMN_GAP = spacing.md;

const sortSubmissions = (
  submissions: Submission[],
  mode: SortMode,
): Submission[] =>
  mode === 'newest'
    ? submissions
    : [...submissions].sort(
        (a, b) =>
          (b.voteCount ?? 0) - (a.voteCount ?? 0) ||
          (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0),
      );

interface GalleryContentProps {
  challenge: Challenge;
}

const GalleryContent = ({ challenge }: GalleryContentProps) => {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { submissions, loading, error, refresh } = useSubmissions(challenge.id);
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const { blockedSet } = useBlockedUsers();
  const [reportedIds, setReportedIds] = useState<string[]>([]);

  // Engellediğin kullanıcıların ve şikayet ettiğin çizimlerin gizlenmesi
  // (App Store Guideline 1.2).
  const visible = useMemo(
    () =>
      submissions.filter(
        (item) => !blockedSet.has(item.userId) && !reportedIds.includes(item.id),
      ),
    [submissions, blockedSet, reportedIds],
  );

  const sorted = useMemo(
    () => sortSubmissions(visible, sortMode),
    [visible, sortMode],
  );

  const contentWidth = Math.min(windowWidth, MAX_CONTENT_WIDTH);
  const cardWidth = Math.floor(
    (contentWidth - spacing.lg * 2 - COLUMN_GAP) / 2,
  );

  const renderItem = useCallback(
    ({ item }: { item: Submission }) => (
      <SubmissionCard
        submission={item}
        width={cardWidth}
        onDeleted={refresh}
        onReported={() => setReportedIds((current) => [...current, item.id])}
      />
    ),
    [cardWidth, refresh],
  );

  const header = (
    <View style={styles.header}>
      <AppText variant="display">Galeri</AppText>

      <View style={styles.themeRow}>
        <AppText variant="heading" style={styles.themeTitle} numberOfLines={1}>
          {challenge.title}
        </AppText>
        <Countdown endsAt={challenge.endsAt} />
      </View>

      <View style={styles.sortRow}>
        {SORT_OPTIONS.map(({ mode, label }) => {
          const selected = sortMode === mode;

          return (
            <Pressable
              key={mode}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setSortMode(mode)}
              style={[styles.sortChip, selected && styles.sortChipSelected]}
            >
              <AppText variant="pixel">{label}</AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  if (loading && submissions.length === 0) {
    return <LoadingView />;
  }

  if (error) {
    return (
      <StateView
        title="Galeri yüklenemedi"
        message={error}
        actionLabel="Tekrar dene"
        onAction={refresh}
      />
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.columns}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <StickerBox radius={radius.lg} contentStyle={styles.empty}>
            <AppText variant="title">Henüz çizim yok</AppText>
            <AppText variant="body" color={colors.muted}>
              İlk çizen sen ol, topluluk oy vermeye başlasın.
            </AppText>
            <StickerButton
              label="Çizmeye başla"
              icon="pencil"
              onPress={() =>
                router.push({
                  pathname: '/editor',
                  params: { challengeId: challenge.id },
                })
              }
            />
          </StickerBox>
        }
        refreshing={loading}
        onRefresh={refresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          {
            paddingTop: insets.top + spacing.md,
            paddingBottom: insets.bottom + TAB_BAR_SPACE,
          },
        ]}
      />
    </View>
  );
};

const Separator = () => <View style={styles.separator} />;

export const GalleryScreen = () => {
  const { challenge, loading, error } = useActiveChallenge();

  if (loading) {
    return <LoadingView />;
  }

  if (error || !challenge) {
    return (
      <StateView
        title="Galeri henüz boş"
        message={error ?? 'Yeni challenge başlayınca çizimler burada görünür.'}
      />
    );
  }

  return <GalleryContent challenge={challenge} />;
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  list: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
  },
  columns: { gap: COLUMN_GAP },
  separator: { height: spacing.md },
  header: { gap: spacing.md, marginBottom: spacing.lg },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  themeTitle: { flex: 1 },
  sortRow: { flexDirection: 'row', gap: spacing.sm },
  sortChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    borderWidth: stroke.thin,
    borderColor: colors.ink,
    backgroundColor: colors.white,
  },
  sortChipSelected: { backgroundColor: colors.lime },
  empty: { padding: spacing.xl, gap: spacing.md, alignItems: 'flex-start' },
});
