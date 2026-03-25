/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

const ALLOW_MANAGER_ROLE = import.meta.env.VITE_ALLOW_MANAGER_ROLE === 'true';
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

const hasRoleAccess = (role) => {
  if (role === 'admin') return true;
  return ALLOW_MANAGER_ROLE && role === 'manager';
};

const mapAuthError = (error) => {
  switch (error?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid credentials. Please try again.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before authentication.';
    case 'auth/popup-blocked':
      return 'Popup was blocked by browser settings. Please allow popups for this site.';
    default:
      return error?.message || 'Authentication failed.';
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (!currentUser) {
          setUser(null);
          setProfile(null);
          setAuthError('');
          setLoading(false);
          return;
        }

        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          // Anyone logging into the Admin Dashboard gets admin role automatically
          await setDoc(userRef, {
            uid: currentUser.uid,
            name: currentUser.displayName || currentUser.email || 'User',
            email: currentUser.email || '',
            role: 'admin',
            active: true,
            walletAssigned: 0,
            walletBalance: 0,
            walletSpent: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }, { merge: true });
        } else if (userSnap.data().role !== 'admin') {
          // If user already exists but isn't admin, promote them (they're logging in via admin dashboard)
          await setDoc(userRef, {
            role: 'admin',
            updatedAt: serverTimestamp(),
          }, { merge: true });
        }

        let latestSnap = await getDoc(userRef);
        let profileData = latestSnap.exists() ? latestSnap.data() : {};

        const sessionUser = {
          uid: currentUser.uid,
          email: currentUser.email,
          name: profileData.name || currentUser.displayName || 'Admin',
          role: profileData.role || 'employee',
        };

        setProfile(profileData);
        setUser(sessionUser);
        setAuthError('');
      } catch (error) {
        setAuthError(mapAuthError(error));
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    setAuthError('');
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      const message = mapAuthError(error);
      setAuthError(message);
      throw new Error(message);
    }
  };

  const loginWithGoogle = async () => {
    setAuthError('');
    try {
      const provider = new GoogleAuthProvider();
      return await signInWithPopup(auth, provider);
    } catch (error) {
      const message = mapAuthError(error);
      setAuthError(message);
      throw new Error(message);
    }
  };

  const logout = () => signOut(auth);

  const hasAdminAccess = useMemo(() => hasRoleAccess(user?.role), [user?.role]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        authError,
        login,
        loginWithGoogle,
        logout,
        loading,
        hasAdminAccess,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
