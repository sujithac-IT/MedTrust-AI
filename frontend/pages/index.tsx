import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // If running on the Python backend (port 8000), we're already on it.
    // If running via Next.js dev server, it means the backend is separate.
    // Just show the backend app directly.
    const backendPort = 8000;
    const currentPort = parseInt(window.location.port, 10);
    if (currentPort !== backendPort) {
      // Redirect to the Python FastAPI backend which serves index.html
      window.location.href = `${window.location.protocol}//${window.location.hostname}:${backendPort}`;
    }
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #134e4a 50%, #0f172a 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Plus Jakarta Sans', Inter, -apple-system, sans-serif",
        color: '#f1f5f9',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          boxShadow: '0 0 40px rgba(20,184,166,0.4)',
          fontSize: 36,
        }}
      >
        🏥
      </div>

      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
        MedTrust<span style={{ color: '#14b8a6' }}>.ai</span>
      </h1>

      <p
        style={{
          color: '#94a3b8',
          marginTop: 12,
          fontSize: '1rem',
          maxWidth: 480,
          lineHeight: 1.6,
        }}
      >
        Apollo MedTrust University Teaching Hospital — Clinical Telehealth &amp; 17-Section AI Case Sheet Platform
      </p>

      <div
        style={{
          marginTop: 40,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <a
          href="/"
          style={{
            padding: '12px 28px',
            borderRadius: 12,
            background: '#14b8a6',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.875rem',
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(20,184,166,0.4)',
            transition: 'all 0.2s',
          }}
        >
          Launch Clinical Studio →
        </a>
        <a
          href="/docs"
          style={{
            padding: '12px 28px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.08)',
            color: '#cbd5e1',
            fontWeight: 600,
            fontSize: '0.875rem',
            textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          API Docs
        </a>
      </div>

      <div
        style={{
          marginTop: 60,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 16,
          maxWidth: 640,
          width: '100%',
        }}
      >
        {[
          { icon: '🎙️', label: 'Live Speech Diarization' },
          { icon: '🤖', label: 'Dual-Engine AI (Gemini + NLP)' },
          { icon: '📋', label: '17-Section Clinical Sheet' },
          { icon: '🔐', label: 'Doctor Audit-Lock Sign-off' },
          { icon: '🌐', label: '6 Indian Languages TTS' },
          { icon: '🏥', label: 'NABH & HIPAA Compliant' },
        ].map((feature) => (
          <div
            key={feature.label}
            style={{
              padding: '14px 16px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: '0.75rem',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>{feature.icon}</span>
            <span>{feature.label}</span>
          </div>
        ))}
      </div>

      <p style={{ color: '#475569', fontSize: '0.75rem', marginTop: 48 }}>
        © 2026 Apollo MedTrust University Teaching Hospital • Powered by FastAPI + Gemini AI
      </p>
    </div>
  );
}
