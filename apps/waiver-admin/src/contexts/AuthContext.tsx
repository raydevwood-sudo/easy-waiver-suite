import React, { createContext, useContext, useEffect, useState } from 'react';
import type { RecordModel } from 'pocketbase';
import { pb } from '../pb';

interface AuthContextType {
  currentUser: RecordModel | null;
  isAdmin: boolean;
  loading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<RecordModel | null>(
    pb.authStore.isValid ? (pb.authStore.record as RecordModel) : null,
  );
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const isAdmin = !!currentUser;

  async function signIn(email: string, password: string) {
    setAuthError(null);
    await pb.collection('users').authWithPassword(email, password);
  }

  async function signOut() {
    pb.authStore.clear();
  }

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange(() => {
      setCurrentUser(
        pb.authStore.isValid ? (pb.authStore.record as RecordModel) : null,
      );
      setLoading(false);
    });
    setLoading(false);
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, isAdmin, loading, authError, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
