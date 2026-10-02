/**
 * Yasal ve destek bağlantıları. App Store, gizlilik politikası ve bir destek
 * iletişimi ister; değerler .env dosyasından okunur (bkz. .env.example), böylece
 * koda gömülü kişisel bilgi olmaz. Tanımlı olmayan bağlantı arayüzde gösterilmez.
 */
const clean = (value: string | undefined): string | null => {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
};

export const SUPPORT_EMAIL = clean(process.env.EXPO_PUBLIC_SUPPORT_EMAIL);
export const PRIVACY_URL = clean(process.env.EXPO_PUBLIC_PRIVACY_URL);
export const TERMS_URL = clean(process.env.EXPO_PUBLIC_TERMS_URL);
