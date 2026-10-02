import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

import { requestAccountDeletion } from '../../../services/firebase/functions';
import { auth, logoutUser } from './authServices';

/**
 * Hesabı ve tüm kişisel veriyi kalıcı olarak siler (App Store zorunluluğu).
 *
 * Akış: önce şifreyle yeniden doğrulama (sunucu, yakın zamanlı bir girişi
 * ister), sonra sunucudaki `deleteMyAccount` fonksiyonu çizimleri, oyları,
 * engelleri, profili ve Auth kullanıcısını siler. Başarılı olursa yerel oturum
 * da kapatılır.
 */
export const deleteAccount = async (password: string): Promise<void> => {
  const user = auth.currentUser;

  if (!user || !user.email) {
    throw new Error('Kullanıcı oturumu bulunamadı.');
  }

  await reauthenticateWithCredential(
    user,
    EmailAuthProvider.credential(user.email, password),
  );

  await requestAccountDeletion();

  try {
    await logoutUser();
  } catch {
    // Auth kullanıcısı zaten silindi; yerel oturum kendiliğinden düşer.
  }
};
