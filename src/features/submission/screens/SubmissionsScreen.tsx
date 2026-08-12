import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SubmissionCard } from '../components/SubmissionCard';
import { useSubmissions } from '../hooks/useSubmission';

interface SubmissionsScreenProps {
  challengeId: string;
}

export const SubmissionsScreen = ({
  challengeId,
}: SubmissionsScreenProps) => {
  const {
    submissions,
    loading,
    error,
  } = useSubmissions(challengeId);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text>{error}</Text>
      </View>
    );
  }

  if (submissions.length === 0) {
    return (
      <View style={styles.center}>
        <Text>Henüz gönderi bulunmuyor.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={submissions}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <SubmissionCard submission={item} />
      )}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    padding: 20,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});