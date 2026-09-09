import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import DoctorWorkspace from './pages/DoctorWorkspace';
import PatientView from './pages/PatientView';
import Navbar from './components/Navbar';
import InteractiveBackground from './components/InteractiveBackground';
import './styles/index.css';

function ProtectedRoute({ children, requiredRole }) {
  const { currentUser, userProfile } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (requiredRole && userProfile?.role !== requiredRole) {
    return <Navigate to={userProfile?.role === 'doctor' ? '/doctor' : '/patient'} replace />;
  }
  return children;
}

function AppRoutes() {
  const { currentUser, userProfile } = useAuth();

  const getHomeRedirect = () => {
    if (userProfile?.role === 'doctor') return '/doctor';
    return '/patient';
  };

  return (
    <>
      <InteractiveBackground />
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={currentUser ? <Navigate to={getHomeRedirect()} replace /> : <Login />} />
        <Route path="/doctor" element={<ProtectedRoute requiredRole="doctor"><DoctorWorkspace /></ProtectedRoute>} />
        <Route path="/patient" element={<ProtectedRoute requiredRole="patient"><PatientView /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
