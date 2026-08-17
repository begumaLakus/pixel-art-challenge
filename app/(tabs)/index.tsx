import { AntiqueColors } from '@/constants/theme';
import { logoutUser } from '@/src/features/auth/services/authServices';
import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const baseTheme = AntiqueColors[isDark ? 'dark' : 'light'];
  const theme = {
    ...baseTheme,
    accentGlow: isDark ? '#FFD700' : '#8B5A2B',
    liveBadge: '#FF4757',
    cardBg: isDark ? '#191724' : '#FFFFFF', // Derin gece moru
    borderDark: isDark ? '#26233a' : '#E0E0E0',
    danger: '#FF5252',
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await logoutUser();
      router.replace('/auth/login');
    } catch {
      Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu.');
    }
  };

  const handleArchivePress = (): void => {
    router.push('/archive');
  };

  return (

    <View style={[styles.mainWrapper, { backgroundColor: theme.background }]}>
      {/* ARKA PLAN ORB/GLOW EFEKTLERİ (Düzlüğü Kıran Katmanlar) */}
      <View style={styles.glowTopRight} />
      <View style={styles.glowBottomLeft} />

      <ScrollView
        contentContainerStyle={styles.container}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER SECTION */}
        <View style={styles.header}>
          <View style={styles.titleBadge}>
            <Text style={styles.titleBadgeText}>🕹️ RETRO PIXEL ARENA</Text>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            Pixel Art <Text style={{ color: theme.brass }}>Challenge</Text>
          </Text>

          <Text style={[styles.subtitle, { color: theme.placeholder }]}>
            Piksellerini konuştur, topluluğun favorisi ol! 🚀
          </Text>
        </View>

        {/* MENU SECTION */}
        <View style={styles.menu}>
          {/* AKTİF CHALLENGE CARD */}
          <Pressable
            onPress={() => router.push('/challenge')}
            style={({ pressed }) => [
              styles.card,
              styles.activeCard,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.brass,
                transform: [{ translateY: pressed ? 3 : 0 }],
              },
            ]}
          >
            <View
              style={[styles.accentLine, { backgroundColor: theme.brass }]}
            />

            <View style={styles.cardContent}>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.liveBadge,
                    { backgroundColor: theme.liveBadge },
                  ]}
                >
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>AKTİF MEYDAN OKUMA</Text>
                </View>
                <Text style={styles.timerText}>⏱️ 24 Saat</Text>
              </View>

              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Günün Teması
              </Text>

              <Text
                style={[styles.cardDescription, { color: theme.placeholder }]}
              >
                Çizimini yap, oylamaya katıl ve kupayı kap!
              </Text>

              <View style={styles.cardActionRow}>
                <Text style={[styles.actionText, { color: theme.brass }]}>
                  Meydan Okumaya Katıl ➔
                </Text>
              </View>
            </View>

            <View style={styles.iconContainer}>
              <Text style={styles.cardPixelIcon}>👾</Text>
            </View>
          </Pressable>

          {/* ARŞİV CARD */}
          <Pressable
            onPress={handleArchivePress}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.borderDark,
                transform: [{ translateY: pressed ? 3 : 0 }],
              },
            ]}
          >
            <View
              style={[styles.accentLine, { backgroundColor: theme.accent }]}
            />

            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Geçmiş Arşiv & Kazananlar
              </Text>

              <Text
                style={[styles.cardDescription, { color: theme.placeholder }]}
              >
                Eski şampiyonların piksellerini incele
              </Text>
            </View>

            <View style={styles.iconContainer}>
              <Text style={styles.cardPixelIcon}>🏆</Text>
            </View>
          </Pressable>

          {/* GÖZ ALMAYAN SADE ÇIKIŞ BUTTONU */}
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              {
                borderColor: 'rgba(255, 82, 82, 0.3)', // Şeffaf ince kırmızı kenarlık
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Text style={[styles.logoutText, { color: theme.danger }]}>
              🚪 Oturumu Kapat
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    position: 'relative',
  },

  /* Arka plan parlama efektleri */
  glowTopRight: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#7B2CBF',
    opacity: 0.15,
  },

  glowBottomLeft: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#B58840',
    opacity: 0.12,
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 60,
    justifyContent: 'center',
  },

  header: {
    marginBottom: 28,
  },

  titleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#2A1B4E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#5A2A82',
    marginBottom: 12,
  },

  titleBadgeText: {
    color: '#D8B4FE',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },

  title: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },

  menu: {
    gap: 18,
  },

  card: {
    width: '100%',
    minHeight: 100,
    borderWidth: 1.5,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },

  activeCard: {
    borderWidth: 2,
  },

  accentLine: {
    width: 5,
    height: '100%',
  },

  cardContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 5,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },

  liveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  timerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFB703',
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },

  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
  },

  cardActionRow: {
    marginTop: 10,
  },

  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },

  iconContainer: {
    paddingRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardPixelIcon: {
    fontSize: 34,
  },

  /* Şeffaf ve Göz Yormayan Çıkış Butonu */
  logoutButton: {
    width: '100%',
    paddingVertical: 13,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginTop: 14,
  },

  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});