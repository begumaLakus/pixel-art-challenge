import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import {
  cancelEndingReminder,
  clearPushToken,
  registerPushToken,
  requestNotificationPermission,
} from './notificationService';

const STORAGE_KEY = 'notifications:enabled';

/** Bildirim tercihini cihazda saklar; açarken izin ister ve token kaydeder. */
export const useNotificationPreference = () => {
  const [enabled, setEnabledState] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => setEnabledState(value === 'true'))
      .catch(() => {});
  }, []);

  const setEnabled = useCallback(async (next: boolean): Promise<boolean> => {
    if (next) {
      if (!(await requestNotificationPermission())) {
        return false;
      }

      await registerPushToken();
    } else {
      await cancelEndingReminder();
      await clearPushToken().catch(() => {});
    }

    await AsyncStorage.setItem(STORAGE_KEY, String(next));
    setEnabledState(next);

    return true;
  }, []);

  return { enabled, setEnabled };
};
