import { useState } from 'react';
import { Link } from 'react-router-dom';
import HolographicGlobe from '../components/HolographicGlobe';

const FEATURES = [
  { icon: '🤖', color: 'var(--primary-light)', label: 'AI Symptom Intelligence', desc: 'Clinical AI triage before consultation. Structured summary auto-sent to your attending physician.' },
  { icon: '📅', color: 'var(--secondary-light)', label: 'Smart Queue Prediction', desc: 'Real-time slot allocation with wait time forecasting — know your turn before leaving home.' },
  { icon: '📹', color: 'var(--teal-light)', label: 'HD Telehealth Video Consult', desc: 'Encrypted WebRTC calls with live AI Medical Scribe — auto-generated digital prescriptions.' },
  { icon: '💊', color: 'var(--purple-light)', label: '24×7 Recovery Companion', desc: 'Medication adherence tracking, daily check-in logs, and dynamic digital twin scoring.' },
  { icon: '👥', color: 'var(--red-light)', label: 'Patient Digital Twin', desc: 'Evolving multi-parameter AI model of each patient linking history, vitals & lifestyle.' },
  { icon: '🏥', color: 'var(--amber-light)', label: 'Hospital Command Center', desc: 'Live operational telemetry monitoring beds, ICU, pharmacy stocks & emergency cases.' },
  { icon: '🌸', color: 'var(--pink-light)', label: "Women's Health Suite", desc: 'Life-stage maternal care, pregnancy companion, PCOS monitor & emergency prediction.' },
  { icon: '🛡️', color: 'var(--primary-light)', label: 'AI Trust Engine', desc: 'Measures & enhances doctor-patient trust using compliance & adherence metrics.' },
  { icon: '💬', color: 'var(--teal-light)', label: 'WhatsApp Companion Channel', desc: 'Automated 24×7 WhatsApp check-ins, medicine reminders & prescription delivery.' },
];

export default function Landing() {
  const [demoVideoOpen, setDemoVideoOpen] = useState(false);

  return (
    <div className="page" style={{ background: '#0b0f19', color: '#fff', overflowX: 'hidden' }}>
      
      {/* Watch Demo Modal */}
      {demoVideoOpen && (
        <div className="modal-backdrop" onClick={() => setDemoVideoOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 840, width: '92vw', padding: 0, overflow: 'hidden', background: '#0f172a', borderRadius: 16 }}>
            <div style={{ padding: '16px 20px', background: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>🎬 MediTrust AI Product Launch Demo</div>
              <button onClick={() => setDemoVideoOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ height: 440, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <div className="pulse" style={{ fontSize: '4rem', marginBottom: 12 }}>▶️</div>
              <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Agentic AI Hospital OS Showcase</h3>
              <p style={{ color: '#94a3b8', fontSize: '.84rem', marginTop: 4 }}>Simulating 24×7 Digital Twin, Live AI Medical Scribe & Command Telemetry</p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section with 3D Holographic Globe Canvas Background */}
      <div style={{ position: 'relative', minHeight: '88vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '60px 24px' }}>
        
        {/* Holographic Globe Canvas */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, opacity: 0.85 }}>
          <HolographicGlobe />
        </div>

        {/* Hero Content Overlay */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(15, 76, 129, 0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(93, 173, 226, 0.3)', padding: '6px 16px', borderRadius: 30, fontSize: '.84rem', color: '#5dade2', marginBottom: 24 }}>
            <span className="pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: '#00b894' }}></span>
            Next-Gen Hospital Intelligence Operating System
          </div>

          <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 4.2rem)', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-1px', color: '#ffffff', marginBottom: 20, textShadow: '0 0 40px rgba(0, 184, 148, 0.3)' }}>
            The World's First<br />
            <span style={{ background: 'linear-gradient(135deg, #5dade2, #00b894)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Agentic AI Hospital Operating System
            </span>
          </h1>

          <p style={{ fontSize: 'clamp(1.1rem, 2vw, 1.4rem)', color: 'rgba(255,255,255,0.85)', maxWidth: 720, margin: '0 auto 28px', lineHeight: 1.6, fontWeight: 500 }}>
            Building Trust. Saving Lives. Caring Beyond Consultation.
          </p>

          {/* ECG Heartbeat Waveform Line */}
          <div style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
            <svg width="280" height="32" viewBox="0 0 280 32" style={{ stroke: '#00b894', fill: 'none', strokeWidth: 2, strokeLinecap: 'round' }}>
              <path d="M 0 16 L 70 16 L 80 8 L 90 24 L 105 2 L 120 30 L 135 12 L 145 16 L 280 16" />
            </svg>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginBottom: 44 }}>
            <Link to="/login?signup=1" className="btn btn-primary btn-lg" style={{ background: 'linear-gradient(135deg, #0f4c81, #00b894)', border: 'none', padding: '14px 28px', fontSize: '1rem', fontWeight: 800, boxShadow: '0 8px 24px rgba(0, 184, 148, 0.4)' }}>
              <i className="fa-solid fa-rocket"></i> Get Started
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg" style={{ borderColor: '#5dade2', color: '#fff', padding: '14px 28px', fontSize: '1rem' }}>
              <i className="fa-solid fa-right-to-bracket"></i> Login
            </Link>
            <Link to="/patient/book" className="btn btn-outline btn-lg" style={{ borderColor: 'rgba(255,255,255,.3)', color: '#fff', padding: '14px 28px', fontSize: '1rem' }}>
              <i className="fa-solid fa-calendar-check"></i> Book Appointment
            </Link>
            <button onClick={() => setDemoVideoOpen(true)} className="btn btn-outline btn-lg" style={{ borderColor: 'rgba(255,255,255,.3)', color: '#5dade2', padding: '14px 28px', fontSize: '1rem' }}>
              <i className="fa-solid fa-circle-play"></i> Watch Demo
            </button>
          </div>

          {/* Connected Hospital Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, padding: '20px 24px' }}>
            {[
              ['< 2 mins', 'Patient Intake Time'],
              ['99.4%', 'AI Medical Scribe Accuracy'],
              ['24×7', 'Continuous Recovery Care'],
              ['100%', 'Verified EMR Data'],
              ['92/100', 'Hospital Trust Index'],
            ].map(([val, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#00b894' }}>{val}</div>
                <div style={{ fontSize: '.72rem', color: '#94a3b8', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Core AI Modules Section */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ color: '#5dade2', fontSize: '.84rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Autonomous Healthcare Telemetry</div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '8px 0', color: '#fff' }}>25 Agentic AI Hospital Modules</h2>
          <p style={{ color: '#94a3b8', maxWidth: 600, margin: '0 auto' }}>Bridging doctors, nurses, patients, pharmacists, and family into one synchronized care graph.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {FEATURES.map(f => (
            <div key={f.label} style={{ background: '#131c2e', border: '1px solid #1e2d4a', borderRadius: 16, padding: 24, transition: 'transform .3s ease', cursor: 'default' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', marginBottom: 16 }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>{f.label}</h3>
              <p style={{ fontSize: '.84rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
