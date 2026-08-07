import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar({ onOpenSos }) {
  const { currentUser, userProfile, logout, switchDemoRole } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const navigate = useNavigate();

  const profile = userProfile || currentUser || {};
  const currentRole = profile.role || 'patient';

  const handleRoleSwitch = async (roleKey) => {
    setRoleMenuOpen(false);
    await switchDemoRole(roleKey);
    const roleRoutes = {
      doctor: '/doctor',
      nurse: '/nurse',
      pharmacist: '/pharmacist',
      admin: '/command',
      family: '/family',
      patient: '/patient'
    };
    navigate(roleRoutes[roleKey] || '/patient');
  };

  return (
    <nav className="navbar" style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', color: '#fff', sticky: 'top', zIndex: 1000 }}>
      <div className="nav-inner" style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
        
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#fff' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 800 }}>
            🏥
          </div>
          <div>
            <span style={{ fontWeight: 900, fontSize: '1.2rem', letterSpacing: '-0.5px', color: '#fff' }}>MediTrust <span style={{ color: '#5dade2' }}>AI</span></span>
            <div style={{ fontSize: '.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Agentic Hospital OS</div>
          </div>
        </Link>

        {/* Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '.84rem' }}>
          <Link to="/" className="nav-link" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Home</Link>
          
          {currentUser && (
            <>
              <Link to="/patient" className="nav-link" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Patient Hub</Link>
              <Link to="/doctor" className="nav-link" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Doctor</Link>
              <Link to="/nurse" className="nav-link" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Nurse</Link>
              <Link to="/pharmacist" className="nav-link" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Pharmacy</Link>
              <Link to="/family" className="nav-link" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Family</Link>
              <Link to="/command" className="nav-link" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Command</Link>
              <Link to="/patient/womens" className="nav-link" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Women's</Link>
              <Link to="/calendar" className="nav-link" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Calendar</Link>
              <Link to="/whatsapp" className="nav-link" style={{ color: '#cbd5e1', textDecoration: 'none' }}>WhatsApp</Link>
            </>
          )}
        </div>

        {/* Right Actions: Universal Red Emergency SOS Button & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          
          {/* Global Universal Emergency SOS Button */}
          <button
            onClick={onOpenSos}
            className="btn btn-danger pulse"
            style={{ background: '#ef4444', border: 'none', color: '#fff', fontWeight: 800, padding: '8px 16px', borderRadius: 20, boxShadow: '0 0 16px rgba(239,68,68,.6)', fontSize: '.82rem' }}
          >
            🚨 108 SOS
          </button>

          {currentUser ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '6px 14px', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: '.8rem', fontWeight: 600 }}
              >
                <span className="avatar avatar-xs" style={{ background: 'var(--primary)', width: 24, height: 24, fontSize: '.7rem' }}>
                  {profile.displayName?.[0] || 'U'}
                </span>
                <span>{profile.displayName || 'User'} ({currentRole})</span>
                <i className="fa-solid fa-chevron-down" style={{ fontSize: '.65rem' }}></i>
              </button>

              {/* Role Switcher Dropdown */}
              {roleMenuOpen && (
                <div style={{ position: 'absolute', right: 0, top: '120%', background: '#1e293b', border: '1px solid #334155', borderRadius: 12, width: 220, padding: 8, boxShadow: '0 10px 30px rgba(0,0,0,.5)', zIndex: 1001 }}>
                  <div style={{ fontSize: '.7rem', color: '#94a3b8', padding: '6px 10px', textTransform: 'uppercase', fontWeight: 700 }}>Switch Role Demo</div>
                  {[
                    { id: 'patient', label: '👤 Patient Hub', path: '/patient' },
                    { id: 'doctor', label: '👨‍⚕️ Doctor Portal', path: '/doctor' },
                    { id: 'nurse', label: '🩺 Nurse Station', path: '/nurse' },
                    { id: 'pharmacist', label: '💊 Pharmacist Desk', path: '/pharmacist' },
                    { id: 'admin', label: '🏥 Command Center', path: '/command' },
                    { id: 'family', label: '👨‍👩‍👧 Family Portal', path: '/family' },
                  ].map(r => (
                    <button
                      key={r.id}
                      onClick={() => handleRoleSwitch(r.id)}
                      style={{ width: '100%', textTransform: 'none', justifyContent: 'flex-start', background: currentRole === r.id ? '#334155' : 'transparent', border: 'none', color: '#fff', padding: '8px 10px', borderRadius: 8, fontSize: '.8rem', cursor: 'pointer', textAlign: 'left', display: 'block', marginBottom: 2 }}
                    >
                      {r.label}
                    </button>
                  ))}
                  <div style={{ borderTop: '1px solid #334155', marginTop: 6, paddingTop: 6 }}>
                    <button
                      onClick={() => { setRoleMenuOpen(false); logout(); navigate('/login'); }}
                      style={{ width: '100%', background: 'none', border: 'none', color: '#ef4444', padding: '6px 10px', borderRadius: 6, fontSize: '.8rem', cursor: 'pointer', textAlign: 'left' }}
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              Login / Register
            </Link>
          )}

        </div>

      </div>
    </nav>
  );
}
