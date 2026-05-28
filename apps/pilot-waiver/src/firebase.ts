import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, import.meta.env.VITE_FIRESTORE_DB ?? 'canada');
export const storage = getStorage(app);

// App Check — uses reCAPTCHA v3 in production, debug token in emulator/preview
// Set VITE_APPCHECK_DEBUG_TOKEN in .env to enable debug mode (preview channels, local dev)
if (import.meta.env.VITE_APPCHECK_DEBUG_TOKEN) {
  // If the value is the string "true", use boolean true so Firebase auto-generates a UUID token
  // and prints it to the console. Otherwise use the value as a specific registered debug token.
  // @ts-expect-error — FIREBASE_APPCHECK_DEBUG_TOKEN is a global set by the App Check debug provider
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN === 'true'
    ? true
    : import.meta.env.VITE_APPCHECK_DEBUG_TOKEN;
} else if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  // @ts-expect-error
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true; // auto-generate token, print to console
}

export let appCheck: AppCheck | null = null;
if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
}

if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}

export default app;
