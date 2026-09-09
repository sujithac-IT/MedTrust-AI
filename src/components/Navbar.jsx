import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="navbar-brand-icon">
            <i className="fa-solid fa-notes-medical"></i>
          </div>
          <div>
            <div className="navbar-brand-text">MediTrust <span>AI</span></div>
            <div className="navbar-brand-sub">Clinical Documentation</div>
          </div>
        </Link>

        <div className="navbar-actions">
          {currentUser ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="avatar avatar-sm" style={{ background: userProfile?.role === 'doctor' ? 'var(--primary)' : 'var(--secondary)' }}>
                  {userProfile?.displayName?.[0] || 'U'}
                </div>
                <div>
                  <div style={{ fontSize: '.82rem', fontWeight: 600 }}>{userProfile?.displayName || 'User'}</div>
                  <div style={{ fontSize: '.68rem', color: 'var(--text3)', textTransform: 'capitalize' }}>{userProfile?.role}</div>
                </div>
              </div>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }}>
                <i className="fa-solid fa-right-from-bracket"></i> Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
