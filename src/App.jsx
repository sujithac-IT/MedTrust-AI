import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import NurseDashboard from './pages/NurseDashboard';
import PharmacistDashboard from './pages/PharmacistDashboard';
import FamilyDashboard from './pages/FamilyDashboard';
import CommandCenter from './pages/CommandCenter';
import WomensHealth from './pages/WomensHealth';
import AppointmentBooking from './pages/AppointmentBooking';
import RecoveryCompanion from './pages/RecoveryCompanion';
import HealthCalendar from './pages/HealthCalendar';
import WhatsAppCompanion from './pages/WhatsAppCompanion';
import Navbar from './components/Navbar';
import EmergencySOSModal from './components/EmergencySOSModal';
import './styles/index.css';

function ProtectedRoute({ children, requiredRole }) {
  const { currentUser, userProfile } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (requiredRole && userProfile?.role !== requiredRole) {
    const roleMap = {
      doctor: '/doctor',
      nurse: '/nurse',
      pharmacist: '/pharmacist',
      admin: '/command',
      family: '/family',
      patient: '/patient'
    };
    return <Navigate to={roleMap[userProfile?.role] || '/'} replace />;
  }
  return children;
}

function AppRoutes({ onOpenSos }) {
  const { currentUser, userProfile } = useAuth();

  const getHomeRedirect = () => {
    const r = userProfile?.role;
    if (r === 'doctor') return '/doctor';
    if (r === 'nurse') return '/nurse';
    if (r === 'pharmacist') return '/pharmacist';
    if (r === 'admin') return '/command';
    if (r === 'family') return '/family';
    return '/patient';
  };

  return (
    <>
      <Navbar onOpenSos={onOpenSos} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={currentUser ? <Navigate to={getHomeRedirect()} replace /> : <Login />} />
        
        {/* Protected Healthcare Role Routes */}
        <Route path="/patient" element={<ProtectedRoute><PatientDashboard /></ProtectedRoute>} />
        <Route path="/patient/recovery" element={<ProtectedRoute><RecoveryCompanion /></ProtectedRoute>} />
        <Route path="/patient/book" element={<ProtectedRoute><AppointmentBooking /></ProtectedRoute>} />
        <Route path="/patient/womens" element={<ProtectedRoute><WomensHealth /></ProtectedRoute>} />
        
        <Route path="/doctor" element={<ProtectedRoute><DoctorDashboard /></ProtectedRoute>} />
        <Route path="/nurse" element={<ProtectedRoute><NurseDashboard /></ProtectedRoute>} />
        <Route path="/pharmacist" element={<ProtectedRoute><PharmacistDashboard /></ProtectedRoute>} />
        <Route path="/family" element={<ProtectedRoute><FamilyDashboard /></ProtectedRoute>} />
        <Route path="/command" element={<ProtectedRoute><CommandCenter /></ProtectedRoute>} />
        
        <Route path="/calendar" element={<ProtectedRoute><HealthCalendar /></ProtectedRoute>} />
        <Route path="/whatsapp" element={<ProtectedRoute><WhatsAppCompanion /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  const [sosOpen, setSosOpen] = useState(false);

  return (
    <AuthProvider>
      <Router>
        {/* Universal Emergency SOS Modal mounted globally */}
        <EmergencySOSModal isOpen={sosOpen} onClose={() => setSosOpen(false)} />
        <AppRoutes onOpenSos={() => setSosOpen(true)} />
      </Router>
    </AuthProvider>
  );
}
