import { Link } from 'react-router-dom';
import MedicalCanvas from '../components/MedicalCanvas';

export default function Landing() {
  return (
    <div className="page" style={{ background: '#fff', padding: 0 }}>

      {/* Hero Section */}
      <div style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '60px 24px',
        background: 'linear-gradient(180deg, #f8fafb 0%, #ffffff 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Interactive 3D Medical Canvas Background */}
        <MedicalCanvas />
        {/* Subtle background pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'radial-gradient(circle, #1a73e8 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#fff', border: '1px solid #e0e3e8', padding: '6px 16px',
            borderRadius: 30, fontSize: '.82rem', color: '#1a73e8', fontWeight: 600,
            marginBottom: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            AI-Powered Clinical Documentation
          </div>

          {/* Main Heading */}
          <h1 style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
            fontWeight: 900, lineHeight: 1.15, letterSpacing: '-1px',
            color: '#1a1a2e', marginBottom: 20,
          }}>
            Turn Consultations Into{' '}
            <span style={{
              background: 'linear-gradient(135deg, #1a73e8, #0f9d58)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Structured Clinical Records
            </span>
          </h1>

          {/* Subheading */}
          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            color: '#5f6368', maxWidth: 600, margin: '0 auto 36px',
            lineHeight: 1.7, fontWeight: 400,
          }}>
            MediTrust AI listens to doctor-patient conversations, extracts medical information, 
            generates case sheets, translates into regional languages, and posts directly to 
            the hospital management system.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginBottom: 48 }}>
            <Link to="/login" className="btn btn-primary btn-lg" style={{
              background: 'linear-gradient(135deg, #1a73e8, #1557b0)',
              boxShadow: '0 4px 16px rgba(26,115,232,0.3)',
            }}>
              <i className="fa-solid fa-right-to-bracket"></i> Login
            </Link>
            <Link to="/login?start=1" className="btn btn-outline btn-lg" style={{
              borderColor: '#1a73e8', color: '#1a73e8',
            }}>
              <i className="fa-solid fa-play"></i> Start Consultation
            </Link>
          </div>

          {/* Workflow Steps */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
            gap: 8, maxWidth: 700, margin: '0 auto',
          }}>
            {[
              { icon: 'fa-microphone', label: 'Voice Recording' },
              { icon: 'fa-arrow-right', label: '', isArrow: true },
              { icon: 'fa-language', label: 'Transcription' },
              { icon: 'fa-arrow-right', label: '', isArrow: true },
              { icon: 'fa-brain', label: 'AI Extraction' },
              { icon: 'fa-arrow-right', label: '', isArrow: true },
              { icon: 'fa-file-medical', label: 'Case Sheet' },
              { icon: 'fa-arrow-right', label: '', isArrow: true },
              { icon: 'fa-hospital', label: 'HMS Post' },
            ].map((step, i) => (
              step.isArrow ? (
                <div key={i} style={{ display: 'flex', alignItems: 'center', color: '#9aa0a6', fontSize: '.7rem' }}>
                  <i className="fa-solid fa-chevron-right"></i>
                </div>
              ) : (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', background: '#fff', border: '1px solid #e0e3e8',
                  borderRadius: 8, fontSize: '.78rem', fontWeight: 600, color: '#1a1a2e',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}>
                  <i className={`fa-solid ${step.icon}`} style={{ color: '#1a73e8', fontSize: '.75rem' }}></i>
                  {step.label}
                </div>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Disclaimer Footer */}
      <div style={{
        textAlign: 'center', padding: '20px 24px',
        fontSize: '.75rem', color: '#9aa0a6', borderTop: '1px solid #f0f2f5',
      }}>
        <i className="fa-solid fa-shield-halved" style={{ marginRight: 6 }}></i>
        AI-generated information must be reviewed and approved by the healthcare professional before becoming an official medical record.
      </div>
    </div>
  );
}
