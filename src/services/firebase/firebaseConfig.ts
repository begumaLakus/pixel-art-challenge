import { getApps, initializeApp } from 'firebase/app';

import { EMULATOR_PROJECT_ID, USE_EMULATOR } from './emulator';

const liveConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Emülatör modunda gerçek proje bilgileri hiç kullanılmaz.
const firebaseConfig = USE_EMULATOR
  ? { apiKey: 'demo-key', projectId: EMULATOR_PROJECT_ID, appId: 'demo-app' }
  : liveConfig;

export const firebaseApp =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0];