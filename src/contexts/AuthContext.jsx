import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
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

  // Demo user for when Firebase is not configured
  const demoUsers = {
    'patient@demo.com': {
      uid: 'demo-patient-001',
      email: 'patient@demo.com',
      displayName: 'Rahul Sharma',
      role: 'patient',
      phone: '+91 98765 43210',
      condition: 'Hypertension',
      doctorId: 'demo-doctor-001',
      recoveryDay: 4,
      recoveryTotal: 14,
      recoveryScore: 91,
    },
    'doctor@demo.com': {
      uid: 'demo-doctor-001',
      email: 'doctor@demo.com',
      displayName: 'Dr. Arjun Mehta',
      role: 'doctor',
      specialty: 'Cardiologist',
      hospital: 'Apollo Hospital',
      experience: '12 years',
    },
    'admin@demo.com': {
      uid: 'demo-admin-001',
      email: 'admin@demo.com',
      displayName: 'Admin',
      role: 'admin',
      hospital: 'Apollo Hospital',
    },
  };

  const isDemoMode = !import.meta.env.VITE_FIREBASE_API_KEY || 
    import.meta.env.VITE_FIREBASE_API_KEY === 'your-api-key-here';

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
      const demo = demoUsers[email];
      if (demo && password === 'demo1234') {
        setCurrentUser(demo);
        setUserProfile(demo);
        return demo;
      }
      throw new Error('Invalid credentials. Use demo@medtrust.ai / demo1234');
    }
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    if (isDemoMode) {
      const demo = demoUsers['patient@demo.com'];
      setCurrentUser(demo);
      setUserProfile(demo);
      return demo;
    }
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        role: 'patient',
        createdAt: serverTimestamp(),
      });
    }
    return result;
  }

  async function logout() {
    if (isDemoMode) {
      setCurrentUser(null);
      setUserProfile(null);
      return;
    }
    return signOut(auth);
  }

  async function fetchUserProfile(user) {
    if (isDemoMode) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserProfile(docSnap.data());
      }
    } catch (e) {
      console.warn('Could not fetch user profile:', e.message);
    }
  }

  useEffect(() => {
    if (isDemoMode) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) await fetchUserProfile(user);
      else setUserProfile(null);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    loginWithGoogle,
    logout,
    isDemoMode,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
