import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
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
  };
  createdAt: string;
}

// Authentication Context value type
interface AuthContextType {
  user: any | null; // FirebaseUser or MockUser
  userData: UserProfile | null;
  loading: boolean;
  isMock: boolean;
  signIn: (emailOrUsername: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, username: string) => Promise<void>;
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
              username: firebaseUser.email ? firebaseUser.email.split('@')[0] : 'pulse_athlete',
              bio: 'Welcome to Pulse! Push your limits.',
              role: 'athlete',
              selectedGoal: null,
              settings: {
                pushNotifications: true,
                emailReports: false,
                darkMode: true,
                profileVisibility: true,
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
  const signUp = async (email: string, password: string, name: string, username: string) => {
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

  // Google Social Sign In Stub
  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      console.log('[AuthContext] Triggering Google Sign In flow...');
      const targetEmail = 'google.athlete@pulse.com';
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', targetEmail), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingProfile = querySnapshot.docs[0].data() as UserProfile;
        console.log('[AuthContext] Existing Google athlete found in DB:', existingProfile.uid);
        setUser({ uid: existingProfile.uid, email: existingProfile.email });
        setUserData(existingProfile);
      } else {
        console.log('[AuthContext] No Google athlete found. Creating new default account...');
        const googleUid = 'google-mock-athlete-uid';
        const googleUser: UserProfile = {
          uid: googleUid,
          name: 'GOOGLE ATHLETE',
          email: targetEmail,
          username: 'google_athlete',
          bio: 'Connected via Google authentication.',
          role: 'athlete',
          selectedGoal: 'strength', // set goal to bypass onboarding in demo
          settings: {
            pushNotifications: true,
            emailReports: true,
            darkMode: true,
            profileVisibility: true,
          },
          createdAt: new Date().toISOString(),
        };

        await setDoc(doc(db, 'users', googleUid), googleUser);
        setUser({ uid: googleUid, email: googleUser.email });
        setUserData(googleUser);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Google sign in aborted.');
    } finally {
      setLoading(false);
    }
  };

  // Apple Social Sign In Stub
  const signInWithApple = async () => {
    setLoading(true);
    try {
      console.log('[AuthContext] Triggering Apple Sign In flow...');
      const targetEmail = 'apple.athlete@pulse.com';
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', targetEmail), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingProfile = querySnapshot.docs[0].data() as UserProfile;
        console.log('[AuthContext] Existing Apple athlete found in DB:', existingProfile.uid);
        setUser({ uid: existingProfile.uid, email: existingProfile.email });
        setUserData(existingProfile);
      } else {
        console.log('[AuthContext] No Apple athlete found. Creating new default account...');
        const appleUid = 'apple-mock-athlete-uid';
        const appleUser: UserProfile = {
          uid: appleUid,
          name: 'APPLE ATHLETE',
          email: targetEmail,
          username: 'apple_athlete',
          bio: 'Connected via Apple authentication.',
          role: 'athlete',
          selectedGoal: 'strength', // set goal to bypass onboarding in demo
          settings: {
            pushNotifications: true,
            emailReports: true,
            darkMode: true,
            profileVisibility: true,
          },
          createdAt: new Date().toISOString(),
        };

        await setDoc(doc(db, 'users', appleUid), appleUser);
        setUser({ uid: appleUid, email: appleUser.email });
        setUserData(appleUser);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Apple sign in aborted.');
    } finally {
      setLoading(false);
    }
  };

  // Sign Out
  const signOut = async () => {
    setLoading(true);
    try {
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
