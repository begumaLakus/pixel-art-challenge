import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { Platform } from 'react-native';

import { auth } from '../auth/services/authServices';
import { db } from '../../services/firebase/firestore';
import { getReminderTime } from './reminderTime';

const REMINDER_ID = 'challenge-ending-reminder';

const supported = Platform.OS !== 'web';

/** Uygulama açıkken de bildirim banner'ı göster. */
export const configureNotificationHandler = (): void => {
  if (!supported) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
};

/** Bildirim iznini ister; verildiyse true döner. */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!supported) {
    return false;
  }

  const current = await Notifications.getPermissionsAsync();

  if (current.granted) {
    return true;
  }

  return (await Notifications.requestPermissionsAsync()).granted;
};

export const cancelEndingReminder = async (): Promise<void> => {
  if (supported) {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
  }
};

/**
 * Challenge bitmeden 2 saat önce yerel bir hatırlatma zamanlar (sunucu
 * gerekmez). Zaman geçmişteyse sadece eskisini iptal eder.
 */
export const scheduleEndingReminder = async (endsAtMs: number): Promise<void> => {
  if (!supported) {
    return;
  }

  await cancelEndingReminder();

  const when = getReminderTime(endsAtMs, Date.now());

  if (!when) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: {
      title: 'Challenge bitmek üzere',
      body: 'Son 2 saat! Çizimini gönder, yarışa katıl.',
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
  });
};

/**
 * Cihazın push token'ını alıp `users/{uid}.pushToken` alanına yazar (yeni
 * tema ve kazanma bildirimleri için). EAS proje kimliği yoksa (henüz
 * `eas init` yapılmadıysa) ya da simülatördeyse sessizce null döner;
 * yerel hatırlatmalar yine çalışır.
 */
export const registerPushToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;

  if (!supported || !user || !projectId) {
    return null;
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });

    await updateDoc(doc(db, 'users', user.uid), { pushToken: data });

    return data;
  } catch (error) {
    console.warn('Push token alınamadı:', error);
    return null;
  }
};

export const clearPushToken = async (): Promise<void> => {
  const user = auth.currentUser;

  if (user) {
    await updateDoc(doc(db, 'users', user.uid), { pushToken: deleteField() });
  }
};
