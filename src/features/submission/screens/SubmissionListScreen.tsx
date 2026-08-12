import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    View,
    useColorScheme,
} from 'react-native';

import { AntiqueColors } from '@/constants/theme';

import { SubmissionCard } from '../components/SubmissionCard';
import { useSubmissions } from '../hooks/useSubmission';

interface SubmissionListScreenProps {
  challengeId: string;
}

export const SubmissionListScreen = ({
  challengeId,
}: SubmissionListScreenProps) => {
  const colorScheme = useColorScheme();

  const theme =
    AntiqueColors[colorScheme === 'dark' ? 'dark' : 'light'];

  const {
    submissions,
    loading,
    error,
  } = useSubmissions(challengeId);

  if (loading) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={theme.accent}
        />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: theme.background },
        ]}
      >
        <Text style={{ color: theme.text }}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: theme.text },
        ]}
      >
        Pixel Art Çalışmaları
      </Text>

      {submissions.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ color: theme.text }}>
            Henüz gönderilmiş bir çalışma yok.
          </Text>
        </View>
      ) : (
        <FlatList
          data={submissions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SubmissionCard submission={item} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },

  list: {
    paddingBottom: 24,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
});