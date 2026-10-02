const MIN_PASSWORD_LENGTH = 6;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'E-posta veya şifre hatalı.',
  'auth/wrong-password': 'E-posta veya şifre hatalı.',
  'auth/user-not-found': 'E-posta veya şifre hatalı.',
  'auth/invalid-email': 'Geçerli bir e-posta adresi gir.',
  'auth/email-already-in-use':
    'Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.',
  'auth/weak-password': `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`,
  'auth/too-many-requests':
    'Çok fazla deneme yaptın. Biraz bekleyip tekrar dene.',
  'auth/network-request-failed':
    'Bağlantı kurulamadı. İnternetini kontrol et.',
  'auth/user-disabled': 'Bu hesap devre dışı bırakılmış.',
};

const FALLBACK_MESSAGE = 'Bir şeyler ters gitti. Tekrar dene.';

/**
 * Firebase Auth hatasını kullanıcıya gösterilecek Türkçe mesaja çevirir.
 * Ham hata metni (İngilizce, teknik) asla arayüze sızmaz.
 */
export const getAuthErrorMessage = (error: unknown): string => {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  return MESSAGES[code] ?? FALLBACK_MESSAGE;
};

export interface CredentialErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

/**
 * Giriş/kayıt formlarının istemci tarafı doğrulaması. `confirmPassword`
 * verilirse (kayıt) şifre tekrarı da kontrol edilir.
 */
export const validateCredentials = (input: {
  email: string;
  password: string;
  confirmPassword?: string;
}): CredentialErrors => {
  const errors: CredentialErrors = {};
  const email = input.email.trim();

  if (!email) {
    errors.email = 'E-posta adresini gir.';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Geçerli bir e-posta adresi gir.';
  }

  if (!input.password) {
    errors.password = 'Şifreni gir.';
  } else if (
    input.confirmPassword !== undefined &&
    input.password.length < MIN_PASSWORD_LENGTH
  ) {
    errors.password = `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`;
  }

  if (
    input.confirmPassword !== undefined &&
    !errors.password &&
    input.password !== input.confirmPassword
  ) {
    errors.confirmPassword = 'Şifreler eşleşmiyor.';
  }

  return errors;
};
