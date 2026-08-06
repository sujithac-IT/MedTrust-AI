import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { currentUser, userProfile, logout, isDemoMode } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const role = userProfile?.role || currentUser?.role;

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = {
    patient: [
      { to: '/patient', label: 'Dashboard', icon: 'fa-house' },
      { to: '/patient/recovery', label: 'Recovery', icon: 'fa-heart-pulse' },
      { to: '/patient/book', label: 'Book Appointment', icon: 'fa-calendar-check' },
      { to: '/patient/womens', label: "Women's Health", icon: 'fa-venus' },
    ],
    doctor: [
      { to: '/doctor', label: 'Dashboard', icon: 'fa-stethoscope' },
    ],
    admin: [
      { to: '/command', label: 'Command Center', icon: 'fa-tower-broadcast' },
    ],
  };

  const links = navLinks[role] || [];

  return (
    <>
      {isDemoMode && (
        <div className="demo-banner">
          🚀 Demo Mode — Use patient@demo.com / doctor@demo.com / admin@demo.com with password: demo1234 · Add your Firebase config to enable real data
        </div>
      )}
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand">
            <div className="brand-icon"><i className="fa-solid fa-heart-pulse"></i></div>
            <div>
              <div className="brand-text">Medi<span>Trust</span> AI</div>
            </div>
            <div className="brand-pill">Agentic AI</div>
          </Link>

          <div className="navbar-nav">
            {!currentUser && (
              <>
                <Link to="/" className={`nav-link ${isActive('/') && location.pathname === '/' ? 'active' : ''}`}>
                  <i className="fa-solid fa-house"></i> Home
                </Link>
              </>
            )}
            {links.map(link => (
              <Link key={link.to} to={link.to} className={`nav-link ${isActive(link.to) ? 'active' : ''}`}>
                <i className={`fa-solid ${link.icon}`}></i> {link.label}
              </Link>
            ))}
          </div>

          <div className="navbar-actions">
            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="user-menu">
                  <div className="avatar avatar-sm" style={{ background: role === 'doctor' ? '#1a73e8' : role === 'admin' ? '#7c4dff' : '#0f9d58' }}>
                    {(userProfile?.displayName || currentUser?.displayName || 'U')[0]}
                  </div>
                  <div>
                    <div className="user-name">{userProfile?.displayName || currentUser?.displayName}</div>
                    <div className="user-role">{role === 'doctor' ? userProfile?.specialty : role === 'admin' ? 'Admin' : 'Patient'}</div>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                  <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline btn-sm">Sign In</Link>
                <Link to="/login?signup=1" className="btn btn-primary btn-sm">
                  <i className="fa-solid fa-user-plus"></i> Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
