import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase';
import { orgConfig } from '@waiver-suite/config';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      hd: orgConfig.staffEmailDomain,
      prompt: 'select_account',
    });
    setAuthError(null);
    const result = await signInWithPopup(auth, provider);
    if (!result.user.email?.endsWith(`@${orgConfig.staffEmailDomain}`)) {
      await firebaseSignOut(auth);
      const msg = `${result.user.email} is not authorised. Please use your @${orgConfig.staffEmailDomain} account.`;
      setAuthError(msg);
      throw new Error(msg);
    }
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading, authError, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
