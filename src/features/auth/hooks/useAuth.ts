import {
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { useEffect, useState } from 'react';

import { auth } from '../services/authServices';

interface AuthState {
  user: User | null;
  loading: boolean;
}

export const useAuth = (): AuthState => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return {
    user,
    loading,
  };
};