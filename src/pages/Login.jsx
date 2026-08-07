import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ToastContainer, showToast } from '../components/Toast';

export default function Login() {
  const [searchParams] = useSearchParams();
  const isSignUpInitial = searchParams.get('signup') === '1';

  const [isSignUp, setIsSignUp] = useState(isSignUpInitial);
  const [role, setRole] = useState(searchParams.get('role') || 'patient');
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' | 'otp' | 'face'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [faceScanning, setFaceScanning] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, signup, loginWithGoogle, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const handleRedirect = (userRole) => {
    const roleRoutes = {
      doctor: '/doctor',
      nurse: '/nurse',
      pharmacist: '/pharmacist',
      admin: '/command',
      family: '/family',
      patient: '/patient'
    };
    navigate(roleRoutes[userRole] || '/patient');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        await signup(email, password, role, name);
        showToast(`Account created successfully as ${role.toUpperCase()}!`, 'success');
      } else {
        await login(email, password);
        showToast(`Logged in successfully! Redirecting...`, 'success');
      }
      handleRedirect(role);
    } catch (err) {
      showToast(err.message || 'Authentication error', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoRole = async (targetRole) => {
    setLoading(true);
    await switchDemoRole(targetRole);
    showToast(`Logged in as Demo ${targetRole.toUpperCase()}!`, 'success');
    handleRedirect(targetRole);
    setLoading(false);
  };

  const handleSendOtp = () => {
    if (!phone) {
      showToast('Please enter your mobile phone number.', 'warning');
      return;
    }
    setOtpSent(true);
    showToast(`📱 OTP code [9821] sent to ${phone}!`, 'info');
  };

  const handleVerifyOtp = async () => {
    if (otp !== '9821' && otp !== '1234') {
      showToast('Invalid OTP. Use demo code 9821.', 'danger');
      return;
    }
    await handleQuickDemoRole(role);
  };

  const handleFaceLogin = () => {
    setFaceScanning(true);
    showToast('📸 Face ID Scanner active... Align your face in camera.', 'info');
    setTimeout(async () => {
      setFaceScanning(false);
      showToast('✅ Face Authenticated! Biometric Hash verified.', 'success');
      await handleQuickDemoRole(role);
    }, 2500);
  };

  return (
    <div className="page" style={{ background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)', padding: '30px 16px' }}>
      <ToastContainer />
      <div style={{ maxWidth: 500, width: '100%' }}>
        
        {/* Quick Demo Switcher */}
        <div style={{ background: '#1e293b', color: '#fff', borderRadius: 16, padding: '14px 18px', marginBottom: 20, border: '1px solid #334155' }}>
          <div style={{ fontSize: '.75rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
            ⚡ Fast 1-Click Role Login
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { id: 'patient', label: '👤 Patient' },
              { id: 'doctor', label: '👨‍⚕️ Doctor' },
              { id: 'nurse', label: '🩺 Nurse' },
              { id: 'pharmacist', label: '💊 Pharmacist' },
              { id: 'admin', label: '🏥 Admin' },
              { id: 'family', label: '👨‍👩‍👧 Family' },
            ].map(r => (
              <button
                key={r.id}
                onClick={() => handleQuickDemoRole(r.id)}
                style={{ background: '#334155', border: '1px solid #475569', color: '#fff', padding: '8px 6px', borderRadius: 8, fontSize: '.78rem', cursor: 'pointer', fontWeight: 600 }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Auth Card */}
        <div className="card" style={{ padding: '32px 28px' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 6 }}>🏥</div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{isSignUp ? 'Create MediTrust Account' : 'Welcome to MediTrust AI'}</h2>
            <p style={{ color: 'var(--text2)', fontSize: '.84rem', marginTop: 4 }}>Select your healthcare role to continue</p>
          </div>

          {/* Role Selector Pills */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 20 }}>
            {['patient', 'doctor', 'nurse', 'pharmacist', 'admin', 'family'].map(r => (
              <button
                key={r}
                type="button"
                className={`btn btn-sm ${role === r ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setRole(r)}
                style={{ textTransform: 'capitalize', fontSize: '.75rem', padding: '6px 4px', justifyContent: 'center' }}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Login Method Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
            {[
              { id: 'email', label: 'Email' },
              { id: 'otp', label: 'Mobile OTP' },
              { id: 'face', label: 'Face ID' },
            ].map(m => (
              <button
                key={m.id}
                type="button"
                className={`btn btn-sm ${loginMethod === m.id ? 'btn-secondary' : 'btn-outline'}`}
                onClick={() => setLoginMethod(m.id)}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Login Method 1: Email & Password */}
          {loginMethod === 'email' && (
            <form onSubmit={handleSubmit}>
              {isSignUp && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: '.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Full Name</label>
                  <input className="input-field" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Rahul Sharma" />
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: '.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Email Address</label>
                <input className="input-field" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder={`${role}@demo.com`} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: '.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Password</label>
                <input className="input-field" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
              </div>

              <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading} style={{ justifyContent: 'center', height: 46 }}>
                {loading ? 'Authenticating...' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Login Method 2: Mobile OTP */}
          {loginMethod === 'otp' && (
            <div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: '.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Mobile Number</label>
                <input className="input-field" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
              </div>

              {!otpSent ? (
                <button className="btn btn-primary w-full" onClick={handleSendOtp} style={{ justifyContent: 'center', height: 44 }}>
                  📱 Send OTP Code
                </button>
              ) : (
                <div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: '.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Enter 4-Digit OTP (Demo Code: 9821)</label>
                    <input className="input-field" value={otp} onChange={e => setOtp(e.target.value)} placeholder="9821" style={{ letterSpacing: 4, textAlign: 'center', fontSize: '1.2rem', fontWeight: 800 }} />
                  </div>
                  <button className="btn btn-primary w-full" onClick={handleVerifyOtp} style={{ justifyContent: 'center', height: 44 }}>
                    Verify & Login
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Login Method 3: Face ID Placeholder */}
          {loginMethod === 'face' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: 160, background: '#1e293b', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: '3rem', marginBottom: 4 }}>{faceScanning ? '📸 ⚡' : '👤'}</div>
                <div style={{ fontSize: '.84rem', color: '#38bdf8' }}>{faceScanning ? 'Scanning Biometrics...' : 'Click below to start camera scan'}</div>
              </div>
              <button className="btn btn-primary w-full" onClick={handleFaceLogin} disabled={faceScanning} style={{ justifyContent: 'center', height: 44 }}>
                <i className="fa-solid fa-camera"></i> {faceScanning ? 'Scanning...' : 'Authenticate with Face ID'}
              </button>
            </div>
          )}

          {/* Google Sign In */}
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <div style={{ fontSize: '.75rem', color: 'var(--text2)', marginBottom: 12 }}>OR CONTINUE WITH</div>
            <button className="btn btn-outline w-full" onClick={async () => { await loginWithGoogle(); handleRedirect(role); }} style={{ justifyContent: 'center', height: 44 }}>
              <i className="fa-brands fa-google" style={{ color: '#db4437' }}></i> Sign in with Google
            </button>
          </div>

          {/* Toggle Sign Up / Sign In */}
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: '.84rem' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => setIsSignUp(!isSignUp)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
