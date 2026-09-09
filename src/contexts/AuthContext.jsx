import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Only Doctor and Patient roles for this prototype
  const demoUsers = {
    'doctor@demo.com': {
      uid: 'demo-doctor-001',
      email: 'doctor@demo.com',
      displayName: 'Dr. Arjun Mehta',
      role: 'doctor',
      specialty: 'General Medicine',
      hospital: 'MediTrust AI Health Institute',
      licenseNo: 'MCI-2024-4821',
    },
    'patient@demo.com': {
      uid: 'demo-patient-001',
      email: 'patient@demo.com',
      displayName: 'Rahul Sharma',
      role: 'patient',
      age: 42,
      gender: 'Male',
      phone: '+91 98765 43210',
      preferredLanguage: 'English',
    },
  };

  const isDemoMode = !import.meta.env.VITE_FIREBASE_API_KEY || 
    import.meta.env.VITE_FIREBASE_API_KEY === 'demo-api-key';

  async function signup(email, password, role, displayName) {
    if (isDemoMode) {
      const user = { uid: 'new-user-' + Date.now(), email, displayName, role };
      setCurrentUser(user);
      setUserProfile(user);
      return user;
    }
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    const userData = { uid: result.user.uid, email, displayName, role, createdAt: serverTimestamp() };
    await setDoc(doc(db, 'users', result.user.uid), userData);
    return result;
  }

  async function login(email, password) {
    if (isDemoMode) {
      const demo = demoUsers[email] || {
        uid: 'custom-demo-' + Date.now(),
        email,
        displayName: email.split('@')[0],
        role: email.includes('doctor') ? 'doctor' : 'patient'
      };
      setCurrentUser(demo);
      setUserProfile(demo);
      return demo;
    }
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function switchRole(roleKey) {
    const email = roleKey === 'doctor' ? 'doctor@demo.com' : 'patient@demo.com';
    const demo = demoUsers[email];
    setCurrentUser(demo);
    setUserProfile(demo);
    return demo;
  }

  async function logout() {
    setCurrentUser(null);
    setUserProfile(null);
    if (!isDemoMode) {
      await signOut(auth);
    }
  }

  useEffect(() => {
    if (isDemoMode) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          }
        } catch (e) {
          console.warn("User profile fetch notice:", e);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [isDemoMode]);

  const value = {
    currentUser,
    userProfile,
    isDemoMode,
    signup,
    login,
    switchRole,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
