import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { auth, db, isMockMode } from '../config/firebase';

// Interface for User Data stored in Firestore / Mock DB
export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  username: string;
  bio: string;
  avatar?: string;
  followersCount?: number;
  role?: 'athlete' | 'trainer';
  trainerId?: string;
  selectedGoal?: string | null;
  instagram?: string;
  twitter?: string;
  website?: string;
  settings: {
    pushNotifications: boolean;
    emailReports: boolean;
    darkMode: boolean;
    profileVisibility: boolean;
    weightUnit?: 'kg' | 'lbs';
    metricUnits?: boolean;
  };
  createdAt: string;
}

// Authentication Context value type
interface AuthContextType {
  user: any | null; // FirebaseUser or MockUser
  userData: UserProfile | null;
  loading: boolean;
  isMock: boolean;
  isAppleSupported: boolean;
  signIn: (emailOrUsername: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, username: string, weightUnit?: 'kg' | 'lbs') => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAppleSupported, setIsAppleSupported] = useState(Platform.OS === 'ios');

  // Initialize Google Sign In configuration
  useEffect(() => {
    try {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        offlineAccess: false,
      });
    } catch (err) {
      console.warn('[AuthContext] GoogleSignin configuration error:', err);
    }
  }, []);

  // Check Apple Authentication availability
  useEffect(() => {
    const checkApple = async () => {
      if (Platform.OS === 'ios') {
        try {
          const available = await AppleAuthentication.isAvailableAsync();
          setIsAppleSupported(available);
        } catch {
          setIsAppleSupported(false);
        }
      } else {
        setIsAppleSupported(false);
      }
    };
    checkApple();
  }, []);

  // Initialize and listen to Auth Changes
  useEffect(() => {
    if (!auth) {
      console.error('[AuthContext] Firebase auth is not initialized. Check configuration.');
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          // Fetch additional profile data from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setUserData(userDocSnap.data() as UserProfile);
          } else {
            // Profile doesn't exist, create a default one
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'Pulse Athlete',
              email: firebaseUser.email || '',
              username: (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'pulse_athlete')
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, '_'),
              bio: 'Welcome to Pulse! Push your limits.',
              avatar: firebaseUser.photoURL || undefined,
              role: 'athlete',
              selectedGoal: null,
              settings: {
                pushNotifications: true,
                emailReports: false,
                darkMode: true,
                profileVisibility: true,
                weightUnit: 'lbs',
              },
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setUserData(newProfile);
          }
        } else {
          setUser(null);
          setUserData(null);
        }
      } catch (error) {
        console.error('[AuthContext] Error retrieving user document:', error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Standard Email/Password Sign In
  const signIn = async (emailOrUsername: string, password: string) => {
    setLoading(true);
    try {
      let resolvedEmail = emailOrUsername.trim();
      if (!resolvedEmail.includes('@')) {
        const usersRef = collection(db, 'users');
        const q = query(
          usersRef,
          where('username', '==', resolvedEmail.toLowerCase()),
          limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          resolvedEmail = querySnapshot.docs[0].data().email;
        } else {
          throw new Error(`No user found with the username "@${emailOrUsername}".`);
        }
      }
      await signInWithEmailAndPassword(auth, resolvedEmail, password);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  // Standard Email/Password Sign Up
  const signUp = async (email: string, password: string, name: string, username: string, weightUnit: 'kg' | 'lbs' = 'lbs') => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Save additional profile data to Firestore
      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        name: name,
        email: email.toLowerCase(),
        username: username.trim().toLowerCase(),
        bio: 'Pushing boundaries with Pulse.',
        role: 'athlete',
        selectedGoal: null,
        settings: {
          pushNotifications: true,
          emailReports: false,
          darkMode: true,
          profileVisibility: true,
          weightUnit: weightUnit,
        },
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
      setUserData(newProfile);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign up.');
    } finally {
      setLoading(false);
    }
  };

  // Real Google Social Sign In
  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      console.log('[AuthContext] Initiating Google Sign In flow...');
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      const signInResult = await GoogleSignin.signIn();

      if (signInResult.type === 'cancelled') {
        console.log('[AuthContext] Google sign in cancelled by user.');
        return;
      }

      const idToken = signInResult.data?.idToken;
      if (!idToken) {
        throw new Error('Google authentication succeeded but no ID token was returned.');
      }

      // Create Firebase credential & authenticate
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseUser = userCredential.user;

      // Sync with Firestore profile
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const existingData = userDocSnap.data() as UserProfile;
        if (!existingData.avatar && firebaseUser.photoURL) {
          await updateDoc(userDocRef, { avatar: firebaseUser.photoURL });
          existingData.avatar = firebaseUser.photoURL;
        }
        setUserData(existingData);
      } else {
        const googleUser = signInResult.data?.user;
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || googleUser?.name || 'Pulse Athlete',
          email: firebaseUser.email || googleUser?.email || '',
          username: (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'pulse_athlete')
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_'),
          bio: 'Welcome to Pulse! Push your limits.',
          avatar: firebaseUser.photoURL || googleUser?.photo || undefined,
          role: 'athlete',
          selectedGoal: null,
          settings: {
            pushNotifications: true,
            emailReports: false,
            darkMode: true,
            profileVisibility: true,
            weightUnit: 'lbs',
          },
          createdAt: new Date().toISOString(),
        };

        await setDoc(userDocRef, newProfile);
        setUserData(newProfile);
      }
    } catch (error: any) {
      if (error?.code === statusCodes.SIGN_IN_CANCELLED || error?.code === '12501') {
        console.log('[AuthContext] Google sign in cancelled.');
        return;
      }
      if (error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services is not available or outdated.');
      }
      console.error('[AuthContext] Google sign in error:', error);
      throw new Error(error.message || 'Google sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  // Real Apple Social Sign In
  const signInWithApple = async () => {
    setLoading(true);
    try {
      console.log('[AuthContext] Initiating Apple Sign In flow...');
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Apple Sign In is not available on this device.');
      }

      // Generate random nonce and SHA-256 hash for secure Apple credential exchange
      const rawNonce = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!appleCredential.identityToken) {
        throw new Error('Apple Sign In failed: No identity token returned.');
      }

      // Create Firebase credential & authenticate
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: appleCredential.identityToken,
        rawNonce: rawNonce,
      });

      const userCredential = await signInWithCredential(auth, credential);
      const firebaseUser = userCredential.user;

      // Extract full name if available (Apple only provides name on the first authorization)
      let appleFullName: string | undefined = undefined;
      if (appleCredential.fullName) {
        const { givenName, familyName } = appleCredential.fullName;
        const parts = [givenName, familyName].filter(Boolean);
        if (parts.length > 0) {
          appleFullName = parts.join(' ');
        }
      }

      // Sync with Firestore profile
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const existingData = userDocSnap.data() as UserProfile;
        if (appleFullName && (!existingData.name || existingData.name === 'Pulse Athlete')) {
          await updateDoc(userDocRef, { name: appleFullName });
          existingData.name = appleFullName;
        }
        setUserData(existingData);
      } else {
        const resolvedName = appleFullName || firebaseUser.displayName || 'Pulse Athlete';
        const resolvedEmail = appleCredential.email || firebaseUser.email || '';
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          name: resolvedName,
          email: resolvedEmail,
          username: (resolvedEmail ? resolvedEmail.split('@')[0] : 'pulse_athlete')
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_'),
          bio: 'Welcome to Pulse! Push your limits.',
          role: 'athlete',
          selectedGoal: null,
          settings: {
            pushNotifications: true,
            emailReports: false,
            darkMode: true,
            profileVisibility: true,
            weightUnit: 'lbs',
          },
          createdAt: new Date().toISOString(),
        };

        await setDoc(userDocRef, newProfile);
        setUserData(newProfile);
      }
    } catch (error: any) {
      if (error?.code === 'ERR_REQUEST_CANCELED' || error?.code === 'ERR_CANCELED') {
        console.log('[AuthContext] Apple sign in cancelled by user.');
        return;
      }
      console.error('[AuthContext] Apple sign in error:', error);
      throw new Error(error.message || 'Apple sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  // Sign Out
  const signOut = async () => {
    setLoading(true);
    try {
      try {
        if (GoogleSignin.hasPreviousSignIn()) {
          await GoogleSignin.signOut();
        }
      } catch {
        // Ignore Google sign out error if user was not signed in via Google
      }
      await firebaseSignOut(auth);
      setUser(null);
      setUserData(null);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign out.');
    } finally {
      setLoading(false);
    }
  };

  // Update Profile fields
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !userData) throw new Error('No user is currently authenticated.');

    try {
      const updatedProfile = {
        ...userData,
        ...updates,
        settings: {
          ...userData.settings,
          ...(updates.settings || {}),
        },
      };

      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, updates as any);
      setUserData(updatedProfile);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        isMock: isMockMode,
        isAppleSupported,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithApple,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
