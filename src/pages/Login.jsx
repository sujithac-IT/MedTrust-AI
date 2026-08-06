import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../components/Toast';
import { ToastContainer } from '../components/Toast';

export default function Login() {
  const [params] = useSearchParams();
  const [isSignup, setIsSignup] = useState(params.get('signup') === '1');
  const [role, setRole] = useState(params.get('role') || 'patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, signup, loginWithGoogle, isDemoMode } = useAuth();
  const navigate = useNavigate();

  const roleRedirect = { patient: '/patient', doctor: '/doctor', admin: '/command' };

  const fillDemo = (r) => {
    setRole(r);
    setEmail(`${r}@demo.com`);
    setPassword('demo1234');
    setName(r === 'patient' ? 'Rahul Sharma' : r === 'doctor' ? 'Dr. Arjun Mehta' : 'Admin');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignup) {
        await signup(email, password, role, name);
      } else {
        const result = await login(email, password);
        const userRole = result?.role || role;
        navigate(roleRedirect[userRole] || '/patient');
        return;
      }
      navigate(roleRedirect[role] || '/patient');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/patient');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <ToastContainer />
      {/* Left Panel */}
      <div className="auth-left">
        <div className="auth-left-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div className="brand-icon"><i className="fa-solid fa-heart-pulse"></i></div>
            <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>MediTrust AI</div>
          </div>
          <h1>Care that never stops.</h1>
          <p>An Agentic AI Healthcare Ecosystem that transforms hospitals into smart, patient-centric institutions.</p>
          {[
            { icon: '💊', text: '24×7 Recovery Companion — medication reminders, daily check-ins, and adaptive care plans.' },
            { icon: '🤖', text: 'AI Medical Scribe — doctors speak naturally, AI extracts prescriptions in under 60 seconds.' },
            { icon: '📊', text: 'Patient Digital Twin — a continuously evolving AI health profile for every patient.' },
            { icon: '🌸', text: "Women's Health Suite — life-stage care from menstrual health to menopause wellness." },
          ].map(f => (
            <div key={f.icon} className="auth-feature">
              <div className="auth-feature-icon">{f.icon}</div>
              <p className="auth-feature-text" style={{ color: 'rgba(255,255,255,.85)', margin: 0 }}>{f.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        <div className="auth-logo">
          <div className="brand-icon"><i className="fa-solid fa-heart-pulse"></i></div>
          <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '1.1rem' }}>MediTrust AI</span>
        </div>
        <h2 className="auth-title">{isSignup ? 'Create your account' : 'Welcome back'}</h2>
        <p className="auth-sub">{isSignup ? 'Join MediTrust AI and experience care that never stops.' : 'Sign in to continue to your healthcare portal.'}</p>

        {/* Demo Hint */}
        {isDemoMode && (
          <div className="demo-hint">
            🚀 <strong>Demo Mode Active</strong><br />
            Quick login — click a role below to auto-fill credentials:
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {['patient', 'doctor', 'admin'].map(r => (
                <button key={r} type="button" onClick={() => fillDemo(r)} style={{ padding: '4px 12px', borderRadius: 99, border: '1px solid rgba(249,171,0,.4)', background: 'rgba(249,171,0,.15)', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}>
                  {r === 'patient' ? '🧑 Patient' : r === 'doctor' ? '👨‍⚕️ Doctor' : '🏥 Admin'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Role Select (signup) */}
        {isSignup && (
          <div style={{ marginBottom: 20 }}>
            <div className="form-label" style={{ marginBottom: 8 }}>I am a...</div>
            <div className="role-cards">
              {[{ id: 'patient', icon: '🧑', name: 'Patient' }, { id: 'doctor', icon: '👨‍⚕️', name: 'Doctor' }, { id: 'admin', icon: '🏥', name: 'Hospital Admin' }].map(r => (
                <div key={r.id} className={`role-card ${role === r.id ? 'sel' : ''}`} onClick={() => setRole(r.id)}>
                  <div className="role-icon">{r.icon}</div>
                  <div className="role-name">{r.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isSignup && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Dr. John Smith" required />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
          </div>
          {error && <div className="form-error" style={{ padding: '8px 12px', background: 'var(--red-light)', borderRadius: 8 }}>{error}</div>}
          <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ justifyContent: 'center', padding: '12px' }}>
            {loading ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> Please wait...</> : isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="divider">or continue with</div>
        <button className="google-btn" onClick={handleGoogle} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        <div className="switch-auth">
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <a href="#" style={{ color: 'var(--primary)', fontWeight: 600 }} onClick={e => { e.preventDefault(); setIsSignup(!isSignup); setError(''); }}>
            {isSignup ? 'Sign In' : 'Sign Up'}
          </a>
        </div>
      </div>
    </div>
  );
}
