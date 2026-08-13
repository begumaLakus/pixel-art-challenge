import { AntiqueColors } from '@/constants/theme';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
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

  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!challenge?.endAt) {
      return;
    }

    const calculateTimeLeft = () => {
      const endTime = challenge.endAt.toDate().getTime();
      const remaining = Math.max(0, endTime - Date.now());

      setTimeLeft(remaining);
    };

    calculateTimeLeft();

    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [challenge]);

  const formatTimeLeft = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days} gün ${hours} saat kaldı`;
    }

    if (hours > 0) {
      return `${hours} saat ${minutes} dakika kaldı`;
    }

    if (minutes > 0) {
      return `${minutes} dakika ${seconds} saniye kaldı`;
    }

    return `${seconds} saniye kaldı`;
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>{error}</Text>
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>
          Şu anda aktif bir challenge bulunmuyor.
        </Text>
      </View>
    );
  }

  const challengeEnded = timeLeft <= 0;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      <Text style={[styles.title, { color: theme.text }]}>
        {challenge.title}
      </Text>

      <Text style={[styles.theme, { color: theme.brass }]}>
        Tema: {challenge.theme}
      </Text>

      <Text style={[styles.description, { color: theme.text }]}>
        {challenge.description}
      </Text>

      <Text style={[styles.timer, { color: theme.accent }]}>
        {challengeEnded
          ? '⏱ Challenge sona erdi'
          : `⏱ ${formatTimeLeft(timeLeft)}`}
      </Text>

      <Text style={[styles.idText, { color: theme.placeholder }]}>
        Challenge ID: {challenge.id}
      </Text>

      <Pressable
        disabled={challengeEnded}
        onPress={() =>
          router.push({
            pathname: '/editor',
            params: {
              challengeId: challenge.id,
            },
          })
        }
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: theme.accent,
            opacity: challengeEnded ? 0.4 : pressed ? 0.8 : 1,
          },
        ]}
      >
        <Text style={styles.buttonText}>Pixel Art Oluştur</Text>
      </Pressable>

      <Pressable
        onPress={() =>
          router.push({
            pathname: '/submissions',
            params: {
              challengeId: challenge.id,
            },
          })
        }
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: theme.brass,
            opacity: pressed ? 0.8 : 1,
            marginTop: 12,
          },
        ]}
      >
        <Text style={styles.buttonText}>Galeriyi Gör</Text>
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

  timer: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
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