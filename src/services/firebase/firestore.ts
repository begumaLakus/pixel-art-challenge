import {
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { firebaseApp } from './firebaseConfig';

const db = getFirestore(firebaseApp);

export const createUserProfile = async (
  userId: string,
  email: string,
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);

    await setDoc(userRef, {
      email,
      createdAt: serverTimestamp(),
    });
    
    console.log('✅ Firestore kullanıcı profili başarıyla oluşturuldu:', userId);
  } catch (error) {
    console.error('❌ Firestore createUserProfile Hatası:', error);
    throw error; // Hatayı yukarı fırlat ki authService de bilsin
  }
};

export { db };
