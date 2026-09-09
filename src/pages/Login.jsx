import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [role, setRole] = useState('doctor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDemoLogin = async (demoRole) => {
    setLoading(true);
    setError('');
    try {
      const demoEmail = demoRole === 'doctor' ? 'doctor@demo.com' : 'patient@demo.com';
      await login(demoEmail, 'demo123');
      navigate(demoRole === 'doctor' ? '/doctor' : '/patient');
    } catch (e) {
      setError(e.message || 'Login failed');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isSignup) {
        await signup(email, password, role, name);
      } else {
        await login(email, password);
      }
      navigate(role === 'doctor' ? '/doctor' : '/patient');
    } catch (e) {
      setError(e.message || 'Authentication failed');
    }
    setLoading(false);
  };

  return (
    <div className="page" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: 'calc(100vh - 60px)', background: '#f8fafb', padding: '40px 24px',
    }}>
      <div style={{ maxWidth: 440, width: '100%' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #1a73e8, #0f9d58)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '1.4rem',
          }}>
            <i className="fa-solid fa-notes-medical"></i>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>MediTrust AI</h1>
          <p style={{ fontSize: '.9rem', color: '#5f6368' }}>AI Clinical Consultation Documentation</p>
        </div>

        {/* Quick Demo Login */}
        <div className="card" style={{ marginBottom: 16, padding: 20 }}>
          <div style={{ fontSize: '.8rem', fontWeight: 700, color: '#5f6368', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Quick Demo Login
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              onClick={() => handleDemoLogin('doctor')}
              disabled={loading}
              className="btn"
              style={{
                padding: '14px', border: '2px solid #1a73e8', borderRadius: 12,
                background: '#f0f7ff', color: '#1a73e8', flexDirection: 'column',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <i className="fa-solid fa-user-doctor" style={{ fontSize: '1.2rem' }}></i>
              <span style={{ fontWeight: 700 }}>Doctor</span>
              <span style={{ fontSize: '.7rem', color: '#5f6368', fontWeight: 400 }}>Dr. Arjun Mehta</span>
            </button>
            <button
              onClick={() => handleDemoLogin('patient')}
              disabled={loading}
              className="btn"
              style={{
                padding: '14px', border: '2px solid #0f9d58', borderRadius: 12,
                background: '#f0faf4', color: '#0f9d58', flexDirection: 'column',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <i className="fa-solid fa-user" style={{ fontSize: '1.2rem' }}></i>
              <span style={{ fontWeight: 700 }}>Patient</span>
              <span style={{ fontSize: '.7rem', color: '#5f6368', fontWeight: 400 }}>Rahul Sharma</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: '#e0e3e8' }} />
          <span style={{ fontSize: '.75rem', color: '#9aa0a6', fontWeight: 500 }}>or use credentials</span>
          <div style={{ flex: 1, height: 1, background: '#e0e3e8' }} />
        </div>

        {/* Login/Signup Form */}
        <div className="card" style={{ padding: 24 }}>
          {error && (
            <div style={{
              background: '#fce8e6', color: '#d93025', padding: '10px 14px',
              borderRadius: 8, fontSize: '.82rem', marginBottom: 16,
              border: '1px solid #ffcdd2',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Role Selection */}
            <div className="form-group">
              <label className="form-label">I am a</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {['doctor', 'patient'].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    style={{
                      padding: '10px', border: `2px solid ${role === r ? (r === 'doctor' ? '#1a73e8' : '#0f9d58') : '#e0e3e8'}`,
                      borderRadius: 8, background: role === r ? (r === 'doctor' ? '#f0f7ff' : '#f0faf4') : '#fff',
                      color: role === r ? (r === 'doctor' ? '#1a73e8' : '#0f9d58') : '#5f6368',
                      fontWeight: 600, fontSize: '.85rem', cursor: 'pointer', textTransform: 'capitalize',
                    }}
                  >
                    <i className={`fa-solid ${r === 'doctor' ? 'fa-user-doctor' : 'fa-user'}`} style={{ marginRight: 6 }}></i>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {isSignup && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" required />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}>
              {loading ? 'Please wait...' : (isSignup ? 'Create Account' : 'Login')}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button onClick={() => setIsSignup(!isSignup)} style={{
              background: 'none', border: 'none', color: '#1a73e8',
              fontSize: '.84rem', cursor: 'pointer', fontWeight: 500,
            }}>
              {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
