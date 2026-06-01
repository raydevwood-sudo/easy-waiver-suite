import React, { createContext, useContext, useEffect, useState } from 'react';
import type { RecordModel } from 'pocketbase';
import { pb } from '../pb';
import { orgConfig } from '@easy-waiver/config';

const ALLOWED_DOMAIN = orgConfig.staffEmailDomain;

export interface VolunteerProfile {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
}

interface AuthContextType {
  currentUser: RecordModel | null;
  volunteerProfile: VolunteerProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<RecordModel | null>(
    pb.authStore.isValid ? pb.authStore.record : null,
  );
  const [loading, setLoading] = useState(true);

  const volunteerProfile: VolunteerProfile | null = currentUser
    ? {
        id: currentUser.id,
        email: (currentUser['email'] as string) || '',
        displayName: (currentUser['name'] as string) || (currentUser['email'] as string) || '',
        phone: (currentUser['phone'] as string | undefined) ?? undefined,
      }
    : null;

  async function signIn(email: string, password: string) {
    if (ALLOWED_DOMAIN && !email.endsWith(`@${ALLOWED_DOMAIN}`)) {
      throw new Error(`Sign-in is restricted to @${ALLOWED_DOMAIN} accounts.`);
    }
    await pb.collection('users').authWithPassword(email, password);
    setCurrentUser(pb.authStore.record);
  }

  async function signOut() {
    pb.authStore.clear();
    setCurrentUser(null);
  }

  useEffect(() => {
    const unsub = pb.authStore.onChange(() => {
      setCurrentUser(pb.authStore.isValid ? pb.authStore.record : null);
    });
    setLoading(false);
    return () => { unsub(); };
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, volunteerProfile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
