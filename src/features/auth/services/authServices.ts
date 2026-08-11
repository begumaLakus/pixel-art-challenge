import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

import { firebaseApp } from '../../../services/firebase/firebaseConfig';
import { createUserProfile } from '../../../services/firebase/firestore';

const auth = getAuth(firebaseApp);

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

