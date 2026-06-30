import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  toggleDemoRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      // Clean up previous profile listener if any
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }
      
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Listen to real-time updates for user profile
        unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
            setLoading(false);
          } else {
            // If user doc doesn't exist yet, create a default profile
            // Check if user is the creator (niyom2131@gmail.com) and make them a manager by default
            const isDefaultManager = firebaseUser.email === 'niyom2131@gmail.com';
            
            const defaultProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'พนักงานใหม่',
              photoURL: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
              role: isDefaultManager ? 'manager' : 'employee',
              department: 'ทั่วไป',
              sickQuota: 30,
              personalQuota: 6,
              vacationQuota: 10,
              sickUsed: 0,
              personalUsed: 0,
              vacationUsed: 0,
            };
            
            try {
              await setDoc(userDocRef, defaultProfile);
              setProfile(defaultProfile);
            } catch (err) {
              handleFirestoreError(err, OperationType.CREATE, 'users/' + firebaseUser.uid);
            }
            setLoading(false);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'users/' + firebaseUser.uid);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) {
        unsubProfile();
      }
    };
  }, []);

  const signIn = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setLoading(false);
      throw error;
    }
  };

  const logOut = async () => {
    try {
      setLoading(true);
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userDocRef, data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users/' + user.uid);
    }
  };

  const toggleDemoRole = async () => {
    if (!profile || !user) return;
    const newRole: UserRole = profile.role === 'employee' ? 'manager' : 'employee';
    await updateProfile({ role: newRole });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        logOut,
        updateProfile,
        toggleDemoRole,
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
