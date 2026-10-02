import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppAlert } from '@/src/components/ui/AppAlert';
import { AppText } from '@/src/components/ui/AppText';
import { TAB_BAR_SPACE } from '@/src/components/ui/FloatingTabBar';
import { PixelSprite } from '@/src/components/ui/PixelSprite';
import { Screen } from '@/src/components/ui/Screen';
import { StickerBox } from '@/src/components/ui/StickerBox';
import { StickerButton } from '@/src/components/ui/StickerButton';
import {
  auth,
  logoutUser,
} from '@/src/features/auth/services/authServices';
import { PRIVACY_URL, SUPPORT_EMAIL, TERMS_URL } from '@/src/config/legal';
import { colors, radius, spacing } from '@/src/theme';

import { useNotificationPreference } from '@/src/features/notifications/useNotificationPreference';
import { useBlockedUsers } from '@/src/features/moderation/hooks/useBlockedUsers';
import { unblockUser } from '@/src/features/moderation/services/moderationService';

import { BadgeGrid } from '../components/BadgeGrid';
import { DeleteAccountModal } from '../components/DeleteAccountModal';
import { useUserStats } from '../hooks/useUserStats';

const Stat = ({ label, value }: { label: string; value: number }) => (
  <StickerBox
    radius={radius.md}
    style={styles.stat}
    contentStyle={styles.statContent}
  >
    <AppText variant="title">{value}</AppText>
    <AppText variant="pixel" color={colors.inkSoft}>
      {label}
    </AppText>
  </StickerBox>
);

const LinkText = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <Pressable accessibilityRole="link" onPress={onPress} hitSlop={8}>
    <AppText variant="caption" color={colors.muted} style={styles.underline}>
      {label}
    </AppText>
  </Pressable>
);

/** Hesap bilgileri, istatistikler, rozetler ve oturum yönetimi. */
export const ProfileScreen = () => {
  const email = auth.currentUser?.email ?? '';
  const { stats } = useUserStats();
  const { blockedIds } = useBlockedUsers();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { enabled: notificationsOn, setEnabled: setNotifications } = useNotificationPreference();
  const privacyUrl = PRIVACY_URL;
  const termsUrl = TERMS_URL;
  const supportEmail = SUPPORT_EMAIL;

  const handleLogout = useCallback(async () => {
    try {
      await logoutUser();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Çıkış yapılamadı:', error);
      AppAlert.alert('Çıkış yapılamadı', 'Birazdan tekrar dene.');
    }
  }, []);

  return (
    <Screen bottomSpace={TAB_BAR_SPACE}>
      <AppText variant="display">Profil</AppText>

      <StickerBox
        background={colors.lime}
        radius={radius.xl}
        offset={5}
        style={styles.card}
        contentStyle={styles.cardContent}
      >
        <View style={styles.avatar}>
          <PixelSprite name="pixo" cell={7} />
        </View>

        <View style={styles.identity}>
          <AppText variant="pixel">Hesabın</AppText>
          <AppText variant="heading" numberOfLines={1}>
            {email}
          </AppText>
        </View>
      </StickerBox>

      <View style={styles.statsRow}>
        <Stat label="Çizim" value={stats.entries} />
        <Stat label="En iyi seri" value={stats.bestStreak} />
        <Stat label="Zafer" value={stats.wins} />
      </View>

      <View style={styles.section}>
        <AppText variant="title">Rozetler</AppText>
        <BadgeGrid earned={stats.badges} />
      </View>

      {blockedIds.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="title">Engellenenler</AppText>
          {blockedIds.map((blockedId) => (
            <StickerBox
              key={blockedId}
              radius={radius.md}
              contentStyle={styles.blockedRow}
            >
              <AppText variant="body" style={styles.identity}>
                Kullanıcı …{blockedId.slice(-4)}
              </AppText>
              <StickerButton
                size="sm"
                variant="white"
                label="Engeli kaldır"
                onPress={() => {
                  void unblockUser(blockedId);
                }}
              />
            </StickerBox>
          ))}
        </View>
      ) : null}

      <View style={styles.footer}>
        <StickerButton
          label={notificationsOn ? 'Bildirimler açık' : 'Bildirimleri aç'}
          icon={notificationsOn ? 'bell-ring' : 'bell-outline'}
          variant={notificationsOn ? 'lime' : 'white'}
          fullWidth
          onPress={async () => {
            const done = await setNotifications(!notificationsOn);

            if (!done) {
              AppAlert.alert(
                'Bildirim izni gerekli',
                'Bildirimleri açmak için telefonun ayarlarından izin ver.',
              );
            }
          }}
        />

        <StickerButton
          label="Oturumu kapat"
          icon="logout"
          variant="white"
          fullWidth
          onPress={handleLogout}
        />

        {privacyUrl || termsUrl || supportEmail ? (
          <View style={styles.links}>
            {privacyUrl ? (
              <LinkText label="Gizlilik politikası" onPress={() => Linking.openURL(privacyUrl)} />
            ) : null}
            {termsUrl ? (
              <LinkText label="Kullanım koşulları" onPress={() => Linking.openURL(termsUrl)} />
            ) : null}
            {supportEmail ? (
              <LinkText
                label="Destek"
                onPress={() => Linking.openURL(`mailto:${supportEmail}`)}
              />
            ) : null}
          </View>
        ) : null}

        <StickerButton
          label="Hesabımı sil"
          icon="delete-outline"
          variant="pink"
          size="sm"
          onPress={() => setDeleteOpen(true)}
        />
      </View>

      <DeleteAccountModal visible={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  card: { marginVertical: spacing.xl },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
  },
  avatar: {
    padding: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
  },
  identity: { flex: 1, gap: spacing.xs },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  stat: { flex: 1 },
  statContent: { alignItems: 'center', gap: 2, padding: spacing.md },
  section: { gap: spacing.md, marginVertical: spacing.xl },
  footer: { gap: spacing.lg, alignItems: 'stretch' },
  links: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg },
  underline: { textDecorationLine: 'underline' },
  blockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
});
