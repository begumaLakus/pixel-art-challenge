/**
 * Yerel geliştirme modu: `npm run start:emulator` uygulamayı gerçek Firebase
 * projesi yerine yerel Auth + Firestore emülatörlerine bağlar. Böylece
 * ekranlar canlı verilere dokunmadan, tohumlanmış örnek veriyle denenebilir
 * (bkz. scripts/seed-emulator.mjs ve README "Geliştirme" bölümü).
 *
 * Fiziksel bir cihazdan bağlanırken EXPO_PUBLIC_EMULATOR_HOST'a bilgisayarın
 * yerel ağ IP'sini yaz (Android emülatörü için 10.0.2.2).
 */
export const USE_EMULATOR = process.env.EXPO_PUBLIC_USE_EMULATOR === 'true';

export const EMULATOR_HOST =
  process.env.EXPO_PUBLIC_EMULATOR_HOST ?? '127.0.0.1';

export const EMULATOR_PORTS = {
  auth: 9099,
  firestore: 8089,
} as const;

export const EMULATOR_PROJECT_ID = 'demo-pixel-art';
