// src/features/challenges/screens/ChallengeScreen.tsx

import { AntiqueColors } from '@/constants/theme';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';

import { useActiveChallenge } from '../hooks/useActiveChallenge';

const THEME_ASSETS: Record<
  string,
  { icon: string; label: string; accentColor: string }
> = {
  uzay_macerasi: {
    icon: '🚀',
    label: 'UZAY',
    accentColor: '#FF7AC6',
  },
  cilgin_canlilar: {
    icon: '🐱',
    label: 'CANLILAR',
    accentColor: '#FF922B',
  },
  masalsi_doga: {
    icon: '🍄',
    label: 'DOĞA',
    accentColor: '#51CF66',
  },
  gece_acikmalari: {
    icon: '🍕',
    label: 'YEMEK',
    accentColor: '#FFD43B',
  },
  buyulu_dunyam: {
    icon: '🧙‍♂️',
    label: 'BÜYÜ',
    accentColor: '#CC5DE8',
  },
  nostalji_atari: {
    icon: '🕹️',
    label: 'ATARİ',
    accentColor: '#FF6B6B',
  },
  gelecegin_sehri: {
    icon: '🤖',
    label: 'CYBER',
    accentColor: '#339AF0',
  },
  derin_okyanus: {
    icon: '🐙',
    label: 'OKYANUS',
    accentColor: '#22B8CF',
  },
  sevimli_canavarlar: {
    icon: '👾',
    label: 'CANAVAR',
    accentColor: '#F06595',
  },
  cilgin_araclar: {
    icon: '🏎️',
    label: 'ARAÇ',
    accentColor: '#FCC419',
  },
  perili_gece: {
    icon: '👻',
    label: 'PERİLİ',
    accentColor: '#845EF7',
  },
  sira_disi_meslekler: {
    icon: '👨‍🔬',
    label: 'MESLEK',
    accentColor: '#20C997',
  },
};

export const ChallengeScreen = () => {
  const {
    challenge,
    loading,
    error,
    refetch,
  } = useActiveChallenge();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const baseTheme = AntiqueColors[isDark ? 'dark' : 'light'];

  const theme = {
    ...baseTheme,
    pinkAccent: '#E0809D',
    pinkGlow: 'rgba(224, 128, 157, 0.18)',
    purpleGlow: 'rgba(123, 44, 191, 0.2)',
    cardBg: isDark ? '#1A1625' : '#FFFFFF',
    cardBorder: isDark ? '#2D223B' : '#F0E6ED',
  };

  const [timeLeft, setTimeLeft] = useState<number>(0);

  /*
   * Challenge değiştiğinde sayaç yeniden başlar.
   */
  useEffect(() => {
    if (!challenge?.endsAt) {
      setTimeLeft(0);
      return;
    }

    const calculateTimeLeft = () => {
      const endTime = challenge.endsAt.toDate().getTime();
      const remaining = Math.max(0, endTime - Date.now());

      setTimeLeft(remaining);
    };

    calculateTimeLeft();

    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [challenge]);

  /*
   * Challenge bittiğinde backend'in yeni challenge'ı oluşturmasını
   * beklemek yerine kısa aralıklarla tekrar Firestore'dan kontrol ediyoruz.
   *
   * Ayrıca challenge yoksa ekran sürekli kendini toparlamaya çalışır.
   */
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      void refetch();
    }, 10000);

    return () => clearInterval(refreshInterval);
  }, [refetch]);

  /*
   * Sayaç 0'a ulaştığında hemen refetch.
   * 10 saniyelik interval'i beklemiyoruz.
   */
  useEffect(() => {
    if (!challenge || timeLeft > 0) return;

    void refetch();
  }, [challenge, timeLeft, refetch]);

  const formatTimeLeft = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days} gün ${hours}s kaldı`;
    }

    if (hours > 0) {
      return `${hours}sa ${minutes}dk kaldı`;
    }

    if (minutes > 0) {
      return `${minutes}dk ${seconds}sn kaldı`;
    }

    return `${seconds}sn kaldı`;
  };

  if (loading && !challenge) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={theme.pinkAccent}
        />
        <Text
          style={{
            color: theme.text,
            marginTop: 12,
            fontWeight: '700',
          }}
        >
          Yeni challenge aranıyor...
        </Text>
      </View>
    );
  }

  /*
   * Challenge yoksa artık sadece statik hata göstermiyoruz.
   * Hook 10 saniyede bir tekrar deniyor.
   */
  if (!challenge) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator
          size="small"
          color={theme.pinkAccent}
        />

        <Text
          style={{
            color: theme.text,
            fontSize: 16,
            fontWeight: '700',
            marginTop: 12,
            textAlign: 'center',
          }}
        >
          {error || 'Yeni challenge hazırlanıyor...'}
        </Text>
      </View>
    );
  }

  const challengeEnded = timeLeft <= 0;

  const themeAsset =
    THEME_ASSETS[challenge.theme] || {
      icon: '🎨',
      label: challenge.theme.toUpperCase(),
      accentColor: theme.pinkAccent,
    };

  return (
    <View
      style={[
        styles.mainWrapper,
        { backgroundColor: theme.background },
      ]}
    >
      <View
        style={[
          styles.glowTopRight,
          { backgroundColor: theme.pinkAccent },
        ]}
      />

      <View style={styles.glowBottomLeft} />

      <ScrollView
        contentContainerStyle={styles.container}
        bounces={false}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text
              style={[
                styles.backText,
                { color: theme.text },
              ]}
            >
              ← Geri
            </Text>
          </Pressable>

          <View style={styles.arenaBadge}>
            <Text style={styles.arenaBadgeText}>
              ARENA #01
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.pinkAccent,
            },
          ]}
        >
          <View style={styles.themeAvatarContainer}>
            <Text style={styles.themeAvatarIcon}>
              {themeAsset.icon}
            </Text>
          </View>

          <View style={styles.themeTag}>
            <Text style={styles.themeTagText}>
              TEMA: {themeAsset.label}
            </Text>
          </View>

          <Text
            style={[
              styles.title,
              { color: theme.text },
            ]}
          >
            {challenge.title}
          </Text>

          <Text
            style={[
              styles.description,
              { color: theme.placeholder },
            ]}
          >
            {challenge.description}
          </Text>

          <View style={styles.timerBox}>
            <Text
              style={[
                styles.timerText,
                {
                  color: challengeEnded
                    ? theme.danger
                    : theme.pinkAccent,
                },
              ]}
            >
              {challengeEnded
                ? '⏱ Yeni challenge hazırlanıyor...'
                : `⏱️ ${formatTimeLeft(timeLeft)}`}
            </Text>
          </View>
        </View>

        <View style={styles.buttonGroup}>
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
              styles.primaryButton,
              {
                backgroundColor: theme.pinkAccent,
                opacity: challengeEnded
                  ? 0.4
                  : pressed
                    ? 0.85
                    : 1,
                transform: [
                  {
                    translateY: pressed ? 3 : 0,
                  },
                ],
              },
            ]}
          >
            <Text style={styles.primaryButtonText}>
              🎨 Pixel Art Oluştur
            </Text>
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
              styles.secondaryButton,
              {
                borderColor: theme.pinkAccent,
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.03)'
                  : '#FFF',
                opacity: pressed ? 0.8 : 1,
                transform: [
                  {
                    translateY: pressed ? 3 : 0,
                  },
                ],
              },
            ]}
          >
            <Text
              style={[
                styles.secondaryButtonText,
                { color: theme.text },
              ]}
            >
              🖼️ Galeriyi & Çizimleri Gör
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    position: 'relative',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  glowTopRight: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.18,
  },

  glowBottomLeft: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#7B2CBF',
    opacity: 0.15,
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 40,
    justifyContent: 'center',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },

  backText: {
    fontSize: 15,
    fontWeight: '700',
  },

  arenaBadge: {
    backgroundColor: 'rgba(224, 128, 157, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(224, 128, 157, 0.4)',
  },

  arenaBadgeText: {
    color: '#E0809D',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },

  heroCard: {
    width: '100%',
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 4,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },

  themeAvatarContainer: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(224, 128, 157, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  themeAvatarIcon: {
    fontSize: 38,
  },

  themeTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0809D',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 14,
  },

  themeTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 10,
    paddingRight: 60,
  },

  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
    fontWeight: '500',
  },

  timerBox: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(224, 128, 157, 0.3)',
  },

  timerText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  buttonGroup: {
    gap: 14,
  },

  primaryButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 3,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  secondaryButton: {
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});