import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
} from 'firebase/auth';
import { Platform } from 'react-native';

import {
  EMULATOR_HOST,
  EMULATOR_PORTS,
  USE_EMULATOR,
} from '../../../services/firebase/emulator';
import { firebaseApp } from '../../../services/firebase/firebaseConfig';
import { createUserProfile } from '../../../services/firebase/firestore';

/**
 * Native'de oturumun uygulama kapanıp açıldığında korunması için Firebase
 * Auth'a AsyncStorage tabanlı kalıcılık verilmelidir; `getAuth` tek başına
 * bellek içi (in-memory) kalıcılık kullanır ve kullanıcı her açılışta çıkış
 * yapmış olur. Web'de tarayıcının kendi kalıcılığı yeterlidir.
 *
 * `initializeAuth` aynı app için ikinci kez çağrılırsa hata fırlatır (ör.
 * Fast Refresh); bu durumda var olan örneğe düşülür.
 */
const createAuth = (): Auth => {
  if (Platform.OS === 'web') {
    return getAuth(firebaseApp);
  }

  try {
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch {
    return getAuth(firebaseApp);
  }
};

const auth = createAuth();

if (USE_EMULATOR) {
  try {
    connectAuthEmulator(auth, `http://${EMULATOR_HOST}:${EMULATOR_PORTS.auth}`, {
      disableWarnings: true,
    });
  } catch {
    // Fast Refresh: emülatör bağlantısı zaten kurulmuş.
  }
}

export const registerUser = async (
  email: string,
  password: string,
): Promise<void> => {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );

  await createUserProfile(
    credential.user.uid,
    credential.user.email ?? email,
  );
};

export const loginUser = async (
  email: string,
  password: string,
): Promise<void> => {
  await signInWithEmailAndPassword(auth, email, password);
};

export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

export { auth };

