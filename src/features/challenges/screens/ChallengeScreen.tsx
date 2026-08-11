import { AntiqueColors } from '@/constants/theme';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useActiveChallenge } from '../hooks/useActiveChallenge';

export const ChallengeScreen = () => {
  const { challenge, loading, error } = useActiveChallenge();
  const colorScheme = useColorScheme();
  const theme = AntiqueColors[colorScheme === 'dark' ? 'dark' : 'light'];

  // 1. Yüklenme Durumu (Early Return)
  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  // 2. Hata Durumu (Early Return)
  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>{error}</Text>
      </View>
    );
  }

  // 3. Challenge Bulunamama Durumu (Early Return)
  if (!challenge) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>
          Şu anda aktif bir challenge bulunmuyor.
        </Text>
      </View>
    );
  }

  // 4. Ana Ekran Render'ı (Tüm veriler hazır olduğunda burası çalışır)
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>
        {challenge.title}
      </Text>

      <Text style={[styles.theme, { color: theme.brass }]}>
        Tema: {challenge.theme}
      </Text>

      <Text style={[styles.description, { color: theme.text }]}>
        {challenge.description}
      </Text>

      <Text style={[styles.idText, { color: theme.placeholder }]}>
        Challenge ID: {challenge.id}
      </Text>

      {/* Pixel Art Oluştur Butonu Doğru Yerde */}
      <Pressable
        onPress={() => router.push('/editor' as any)}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.accent, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <Text style={styles.buttonText}>Pixel Art Oluştur</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  theme: {
    fontSize: 18,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    marginBottom: 16,
  },
  idText: {
    fontSize: 12,
    marginBottom: 24,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});