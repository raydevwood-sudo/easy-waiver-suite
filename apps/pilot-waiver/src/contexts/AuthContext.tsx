import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { orgConfig } from '@waiver-suite/config';

const ALLOWED_DOMAIN = orgConfig.staffEmailDomain;

export interface VolunteerProfile {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  volunteerProfile: VolunteerProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

async function fetchVolunteerProfile(firebaseUser: FirebaseUser): Promise<VolunteerProfile | null> {
  // Try UID-keyed doc first
  const uidDoc = await getDoc(doc(db, 'volunteers', firebaseUser.uid));
  if (uidDoc.exists()) {
    const d = uidDoc.data();
    return {
      uid: firebaseUser.uid,
      email: (d.email as string) || firebaseUser.email || '',
      displayName: (d.displayName as string) || firebaseUser.displayName || '',
      phone: (d.phone as string | undefined) ?? undefined,
    };
  }
  // Fall back to email query (pending_ docs)
  if (firebaseUser.email) {
    const snap = await getDocs(
      query(collection(db, 'volunteers'), where('email', '==', firebaseUser.email))
    );
    if (!snap.empty) {
      const d = snap.docs[0].data();
      return {
        uid: firebaseUser.uid,
        email: (d.email as string) || firebaseUser.email,
        displayName: (d.displayName as string) || firebaseUser.displayName || '',
        phone: (d.phone as string | undefined) ?? undefined,
      };
    }
  }
  // Signed-in but not yet a volunteer record — return basic auth info
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || '',
    phone: undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [volunteerProfile, setVolunteerProfile] = useState<VolunteerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      hd: ALLOWED_DOMAIN,
      prompt: 'select_account',
    });
    const result = await signInWithPopup(auth, provider);
    const email = result.user.email ?? '';
    if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
      await firebaseSignOut(auth);
      throw new Error(`Sign-in is restricted to @${ALLOWED_DOMAIN} accounts.`);
    }
    const profile = await fetchVolunteerProfile(result.user);
    setVolunteerProfile(profile);
  }

  async function signOut() {
    await firebaseSignOut(auth);
    setVolunteerProfile(null);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !user.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
        void firebaseSignOut(auth);
        setCurrentUser(null);
        setVolunteerProfile(null);
        setLoading(false);
        return;
      }
      setCurrentUser(user);
      if (user) {
        fetchVolunteerProfile(user)
          .then(setVolunteerProfile)
          .catch(console.error)
          .finally(() => setLoading(false));
      } else {
        setVolunteerProfile(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, volunteerProfile, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
