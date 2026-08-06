import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import CommandCenter from './pages/CommandCenter';
import WomensHealth from './pages/WomensHealth';
import AppointmentBooking from './pages/AppointmentBooking';
import RecoveryCompanion from './pages/RecoveryCompanion';
import Navbar from './components/Navbar';
import './styles/index.css';

function ProtectedRoute({ children, requiredRole }) {
  const { currentUser, userProfile } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (requiredRole && userProfile?.role !== requiredRole) {
    const roleMap = { doctor: '/doctor', admin: '/command', patient: '/patient' };
    return <Navigate to={roleMap[userProfile?.role] || '/'} replace />;
  }
  return children;
}

function AppRoutes() {
  const { currentUser, userProfile } = useAuth();

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={
          currentUser
            ? <Navigate to={userProfile?.role === 'doctor' ? '/doctor' : userProfile?.role === 'admin' ? '/command' : '/patient'} replace />
            : <Login />
        } />
        <Route path="/patient" element={
          <ProtectedRoute><PatientDashboard /></ProtectedRoute>
        } />
        <Route path="/patient/recovery" element={
          <ProtectedRoute><RecoveryCompanion /></ProtectedRoute>
        } />
        <Route path="/patient/book" element={
          <ProtectedRoute><AppointmentBooking /></ProtectedRoute>
        } />
        <Route path="/patient/womens" element={
          <ProtectedRoute><WomensHealth /></ProtectedRoute>
        } />
        <Route path="/doctor" element={
          <ProtectedRoute requiredRole="doctor"><DoctorDashboard /></ProtectedRoute>
        } />
        <Route path="/command" element={
          <ProtectedRoute requiredRole="admin"><CommandCenter /></ProtectedRoute>
        } />
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
