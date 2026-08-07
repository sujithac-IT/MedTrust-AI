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

  // Demo user catalog supporting all 6 healthcare roles
  const demoUsers = {
    'patient@demo.com': {
      uid: 'demo-patient-001',
      email: 'patient@demo.com',
      displayName: 'Rahul Sharma',
      role: 'patient',
      phone: '+91 98765 43210',
      condition: 'Hypertension',
      recoveryScore: 91,
    },
    'doctor@demo.com': {
      uid: 'demo-doctor-001',
      email: 'doctor@demo.com',
      displayName: 'Dr. Arjun Mehta',
      role: 'doctor',
      specialty: 'Cardiologist',
      hospital: 'Apollo Hospital',
    },
    'nurse@demo.com': {
      uid: 'demo-nurse-001',
      email: 'nurse@demo.com',
      displayName: 'Sister Anitha',
      role: 'nurse',
      ward: 'Ward Station 4B',
      hospital: 'Apollo Hospital',
    },
    'pharmacist@demo.com': {
      uid: 'demo-pharmacist-001',
      email: 'pharmacist@demo.com',
      displayName: 'Rajesh Kannan',
      role: 'pharmacist',
      license: 'PH-2024-912',
      hospital: 'Apollo Hospital',
    },
    'admin@demo.com': {
      uid: 'demo-admin-001',
      email: 'admin@demo.com',
      displayName: 'Command Admin',
      role: 'admin',
      hospital: 'Apollo Hospital Command Center',
    },
    'family@demo.com': {
      uid: 'demo-family-001',
      email: 'family@demo.com',
      displayName: 'Priya Sharma',
      role: 'family',
      relation: 'Spouse',
      patientId: 'demo-patient-001',
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
        role: email.includes('doctor') ? 'doctor' : email.includes('nurse') ? 'nurse' : email.includes('pharmacist') ? 'pharmacist' : email.includes('family') ? 'family' : email.includes('admin') ? 'admin' : 'patient'
      };
      setCurrentUser(demo);
      setUserProfile(demo);
      return demo;
    }
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function switchDemoRole(roleKey) {
    const roleMap = {
      patient: 'patient@demo.com',
      doctor: 'doctor@demo.com',
      nurse: 'nurse@demo.com',
      pharmacist: 'pharmacist@demo.com',
      admin: 'admin@demo.com',
      family: 'family@demo.com',
    };
    const email = roleMap[roleKey] || 'patient@demo.com';
    const demo = demoUsers[email];
    setCurrentUser(demo);
    setUserProfile(demo);
    return demo;
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
        createdAt: serverTimestamp()
      });
      setUserProfile({ role: 'patient' });
    } else {
      setUserProfile(userDoc.data());
    }
    return result;
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
    switchDemoRole,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
