import { Link } from 'react-router-dom';

const FEATURES = [
  { icon: '🤖', color: 'var(--primary-light)', label: 'AI Symptom Intelligence', desc: 'Clinical AI interview before your consultation. Structured report sent to your doctor.' },
  { icon: '📅', color: 'var(--secondary-light)', label: 'Smart Appointment Booking', desc: 'Real-time slot booking with AI queue prediction — see your wait time before you leave home.' },
  { icon: '📹', color: 'var(--teal-light)', label: 'AI Video Consultation', desc: 'Secure video calls with live AI Medical Scribe — automatic prescription & follow-up.' },
  { icon: '💊', color: 'var(--purple-light)', label: '24×7 Recovery Companion', desc: 'Medication reminders, daily check-ins, recovery scoring — care continues after discharge.' },
  { icon: '👥', color: 'var(--red-light)', label: 'Patient Digital Twin', desc: 'A continuously evolving AI model of each patient capturing history, labs & lifestyle.' },
  { icon: '🏥', color: 'var(--amber-light)', label: 'Hospital Command Center', desc: 'Real-time monitoring of beds, ICU, doctors, queues, pharmacy and patient flow.' },
  { icon: '🌸', color: 'var(--pink-light)', label: "Women's Health Suite", desc: 'Life-stage care from menstrual health and pregnancy companion to menopause wellness.' },
  { icon: '🛡️', color: 'var(--primary-light)', label: 'AI Trust Engine', desc: 'Measures & improves doctor-patient trust using communication and adherence metrics.' },
  { icon: '🌐', color: 'var(--teal-light)', label: 'AI Medical Translator', desc: 'Real-time multilingual translation — zero language barriers in healthcare.' },
];

const JOURNEY = [
  'Register & Login', 'AI Symptom Assessment', 'Specialist Recommendation',
  'Smart Slot Booking', 'Video Consultation', 'AI Medical Scribe',
  'Digital Prescription', 'Recovery Schedule', 'Medication Reminders',
  'Daily Health Check-in', 'Auto Follow-up', '24×7 AI Care'
];

const IMPACT = [
  ['Registration Time', '~15 minutes', '< 2 minutes'],
  ['Consultation Docs', '10–15 minutes', '< 1 min (AI Scribe)'],
  ['Waiting Time', '2–4 hours', '20–40 minutes'],
  ['Medication Adherence', '~50–60%', '> 90%'],
  ['Missed Follow-ups', 'Very Common', 'Significantly Reduced'],
  ['Language Barriers', 'Frequent', 'Eliminated'],
  ['Emergency Response', 'Manual & Delayed', 'AI-Assisted & Immediate'],
  ['Post-Discharge Care', 'None', '24×7 AI Recovery Companion'],
];

export default function Landing() {
  return (
    <div className="page" style={{ background: 'var(--bg)' }}>
      {/* Hero */}
      <div className="page-hero">
        <div className="page-hero-inner">
          <div className="eyebrow">
            <i className="fa-solid fa-star"></i>
            World's First Agentic AI Hospital Operating System
          </div>
          <h1 className="hero-title">
            <span className="hl">MediTrust AI</span> — The Future of<br />
            <span className="hlt">Continuous Healthcare</span>
          </h1>
          <p className="hero-subtitle">
            An Agentic AI Healthcare Ecosystem with Digital Twin Intelligence that transforms hospitals into smart, connected, patient-centric institutions — caring beyond every consultation.
          </p>
          <p className="hero-tagline">"We don't just treat patients — we stay with them until they recover, and beyond."</p>
          <div className="hero-actions">
            <Link to="/login?signup=1" className="btn btn-primary btn-lg" style={{ boxShadow: '0 4px 16px rgba(26,115,232,.35)' }}>
              <i className="fa-solid fa-mobile-screen"></i> Try Patient App
            </Link>
            <Link to="/login?role=doctor" className="btn btn-outline btn-lg">
              <i className="fa-solid fa-stethoscope"></i> Doctor Dashboard
            </Link>
            <Link to="/login?role=admin" className="btn btn-outline btn-lg">
              <i className="fa-solid fa-tower-broadcast"></i> Command Center
            </Link>
          </div>
          <div className="metrics-row">
            {[['< 2 min','Registration'],['> 90%','Med Adherence'],['24×7','AI Recovery'],['Zero','Language Barriers'],['91/100','Avg Score']].map(([v,l]) => (
              <div key={l} className="metric-cell"><span className="metric-val">{v}</span><span className="metric-lbl">{l}</span></div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '60px 24px' }}>
        <div className="section-head text-center">
          <div className="section-label"><i className="fa-solid fa-sparkles"></i> Core Modules</div>
          <h2 className="section-title">25 AI-Powered Modules</h2>
          <p className="section-desc" style={{ margin: '0 auto' }}>Every feature is designed to bring intelligence, trust, and continuity to healthcare.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16, marginTop: 36 }}>
          {FEATURES.map(f => (
            <div key={f.label} className="card card-hover" style={{ cursor: 'default', position: 'relative', overflow: 'hidden' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: 12 }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '.92rem', marginBottom: 6 }}>{f.label}</h3>
              <p style={{ fontSize: '.82rem', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Patient Journey */}
      <div style={{ background: 'linear-gradient(135deg, #1a1f2e, #162032)', padding: '72px 24px', color: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="text-center" style={{ marginBottom: 44 }}>
            <div className="section-label" style={{ color: '#6cb4ff', justifyContent: 'center' }}><i className="fa-solid fa-route"></i> End-to-End Journey</div>
            <h2 className="section-title" style={{ color: '#fff' }}>From First Visit to Complete Recovery</h2>
            <p style={{ color: 'rgba(255,255,255,.6)', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
              MediTrust AI accompanies every patient through every stage — before, during, and after treatment.
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 0 }}>
            {JOURNEY.map((step, i) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', padding: '0 8px' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(26,115,232,.2)', border: '2px solid rgba(26,115,232,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.78rem', color: '#6cb4ff', margin: '0 auto 8px', transition: 'all .2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(26,115,232,.2)'; e.currentTarget.style.color = '#6cb4ff'; }}>
                    {i + 1}
                  </div>
                  <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.6)', fontWeight: 500, maxWidth: 76, lineHeight: 1.4 }}>{step}</div>
                </div>
                {i < JOURNEY.length - 1 && <div style={{ width: 22, height: 2, background: 'rgba(26,115,232,.3)', flexShrink: 0, marginBottom: 32 }} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Impact */}
      <div style={{ background: '#fff', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px' }}>
          <div className="section-head text-center">
            <div className="section-label" style={{ justifyContent: 'center' }}><i className="fa-solid fa-chart-bar"></i> Measurable Impact</div>
            <h2 className="section-title">Before vs. After MediTrust AI</h2>
          </div>
          <table className="data-table" style={{ borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--s1)', border: '1px solid var(--border)', marginTop: 28 }}>
            <thead>
              <tr><th style={{ background: 'var(--primary)', color: '#fff' }}>Metric</th><th style={{ background: 'var(--primary)', color: '#fff' }}>Before</th><th style={{ background: 'var(--primary)', color: '#fff' }}>After MediTrust AI</th></tr>
            </thead>
            <tbody>
              {IMPACT.map(([m, b, a]) => (
                <tr key={m}>
                  <td style={{ fontWeight: 600 }}>{m}</td>
                  <td style={{ color: 'var(--red)', fontWeight: 500 }}>{b}</td>
                  <td style={{ color: 'var(--secondary)', fontWeight: 600 }}>{a}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--teal))', padding: '60px 24px', textAlign: 'center', color: '#fff' }}>
        <h2 style={{ color: '#fff', fontSize: '2rem', marginBottom: 12 }}>Ready to Transform Healthcare?</h2>
        <p style={{ color: 'rgba(255,255,255,.8)', marginBottom: 28, fontSize: '1rem' }}>
          Join MediTrust AI today and experience care that never stops.
        </p>
        <Link to="/login?signup=1" className="btn btn-lg" style={{ background: '#fff', color: 'var(--primary)', fontWeight: 700, boxShadow: '0 4px 20px rgba(0,0,0,.2)' }}>
          <i className="fa-solid fa-rocket"></i> Get Started — It's Free
        </Link>
      </div>
    </div>
  );
}
