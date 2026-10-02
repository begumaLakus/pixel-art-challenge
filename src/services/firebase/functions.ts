import { getFunctions, httpsCallable } from 'firebase/functions';

import { firebaseApp } from './firebaseConfig';

const functions = getFunctions(firebaseApp);

interface GetCreativeInspirationResponse {
  suggestion: string;
}

/**
 * Editördeki "İlham İste" butonunun çağırdığı Cloud Function
 * (`functions/src/index.ts` içindeki `getCreativeInspiration`). AI çağrısı
 * ve rate limiting tamamen sunucu tarafında; burası sadece sonucu istiyor
 * ve döndürüyor.
 *
 * Firebase Functions SDK'sı, sunucudaki `HttpsError`'ları `error.code`
 * (ör. `'functions/resource-exhausted'`) ve `error.message` alanlarıyla
 * client'a taşır — çağıran taraf (editör ekranı) bu `message`'ı doğrudan
 * kullanıcıya gösterebilir.
 */
export const requestCreativeInspiration = async (): Promise<string> => {
  try {
    const callable = httpsCallable<undefined, GetCreativeInspirationResponse>(
      functions,
      'getCreativeInspiration',
    );

    const result = await callable();

    return result.data.suggestion;
  } catch (error) {
    console.error('❌ getCreativeInspiration çağrısı başarısız:', error);
    throw error;
  }
};

/**
 * Hesabı ve tüm kişisel veriyi silen Cloud Function (`deleteMyAccount`).
 * Çağırmadan önce kullanıcı şifresiyle yeniden doğrulanmış olmalıdır;
 * sunucu yakın zamanlı bir giriş istemezse `failed-precondition` döner.
 */
export const requestAccountDeletion = async (): Promise<void> => {
  const callable = httpsCallable<undefined, { deleted: true }>(
    functions,
    'deleteMyAccount',
  );

  await callable();
};
