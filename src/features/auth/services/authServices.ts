import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
} from 'firebase/auth';

import { getAuth } from 'firebase/auth';

import { firebaseApp } from '../../../services/firebase/firebaseConfig';

const auth = getAuth(firebaseApp);

export const registerUser = async (
  email: string,
  password: string,
): Promise<void> => {
  await createUserWithEmailAndPassword(auth, email, password);
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
