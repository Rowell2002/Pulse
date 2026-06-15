import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
// @ts-ignore - getReactNativePersistence exists in the RN bundle but is not in the TS types
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Firebase credentials read from environment variables.
// Expo loads EXPO_PUBLIC_ variables automatically at runtime.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Check if credentials are set (not empty, not undefined, and not placeholders)
const hasCredentials =
  !!firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'your-api-key-here' &&
  firebaseConfig.apiKey.trim() !== '';

let app;
let auth: any = null;
let db: any = null;
const isMockMode = false;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    // On native platforms, use AsyncStorage for auth persistence.
    // getAuth() assumes browser localStorage which doesn't exist on React Native,
    // causing a native crash before any JS error handler can catch it.
    if (Platform.OS !== 'web') {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } else {
      auth = getAuth(app);
    }
  } else {
    app = getApp();
    auth = getAuth(app);
  }
  db = getFirestore(app);
  console.log('[Firebase] Successfully initialized real database and authentication services.');
} catch (error) {
  console.error('[Firebase] Failed to initialize Firebase services. Please check your credentials in .env:', error);
}

export { auth, db, isMockMode };
export default app;
