import { useState, useEffect } from 'react';
import { showToast } from './Toast';

export default function EmergencySOSModal({ isOpen, onClose }) {
  const [step, setStep] = useState('triage'); // 'triage' | 'dispatch' | 'tracking'
  const [emergencyType, setEmergencyType] = useState('Chest Pain / Cardiac');
  const [eta, setEta] = useState(6);
  const [ambulanceProgress, setAmbulanceProgress] = useState(25);

  useEffect(() => {
    let timer;
    if (step === 'tracking') {
      timer = setInterval(() => {
        setAmbulanceProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            showToast('🚨 Ambulance has arrived at location!', 'warning');
            return 100;
          }
          return prev + 5;
        });
        setEta(prev => Math.max(1, prev - 1));
      }, 2500);
    }
    return () => clearInterval(timer);
  }, [step]);

  if (!isOpen) return null;

  const handleDispatch = () => {
    setStep('tracking');
    showToast('🚨 Emergency SOS Dispatched! Ambulance #AMB-108 on the way.', 'danger');
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal-content sos-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 680, width: '92vw', padding: 0, overflow: 'hidden', background: '#0f172a', color: '#fff', borderRadius: 20, border: '2px solid #ef4444', boxShadow: '0 0 40px rgba(239,68,68,.4)' }}>
        
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="pulse" style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', display: 'inline-block' }}></span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: 800 }}>🚨 AI EMERGENCY RESPONSE PROTOCOL</h3>
              <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.85)' }}>Case ID: #EMG-2026-9921 · Direct 108 Hotline Sync</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>

        <div style={{ padding: 24 }}>
          {step === 'triage' && (
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 14 }}>Select Emergency Symptom Category:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Chest Pain / Cardiac', icon: '🫀', desc: 'Severe pressure, arm pain, sweating' },
                  { label: 'Breathing Difficulty', icon: '🫁', desc: 'Severe asthma, dyspnea, choking' },
                  { label: 'Unconsciousness / Stroke', icon: '🧠', desc: 'Fainting, numbness, slurred speech' },
                  { label: 'Accident / Trauma', icon: '🩸', desc: 'Severe bleeding, fractures, injury' },
                ].map(item => (
                  <div
                    key={item.label}
                    onClick={() => setEmergencyType(item.label)}
                    style={{
                      padding: 14, borderRadius: 12, cursor: 'pointer',
                      background: emergencyType === item.label ? '#1e293b' : '#182238',
                      border: emergencyType === item.label ? '2px solid #ef4444' : '1px solid #334155'
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{item.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#fff' }}>{item.label}</div>
                    <div style={{ fontSize: '.75rem', color: '#94a3b8', marginTop: 2 }}>{item.desc}</div>
                  </div>
                ))}
              </div>

              {/* Immediate Location & Hospital Preview */}
              <div style={{ background: '#1e293b', padding: 14, borderRadius: 12, border: '1px solid #334155', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.84rem', marginBottom: 6 }}>
                  <span style={{ color: '#94a3b8' }}>Nearest ER Facility:</span>
                  <strong style={{ color: '#38bdf8' }}>Apollo Trauma Center (1.8 km)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.84rem' }}>
                  <span style={{ color: '#94a3b8' }}>On-Duty ER Cardiologist:</span>
                  <strong style={{ color: '#34d399' }}>Dr. Arjun Mehta (Notified)</strong>
                </div>
              </div>

              <button className="btn btn-danger btn-lg w-full" onClick={handleDispatch} style={{ background: '#ef4444', justifyContent: 'center', height: 50, fontSize: '1rem', fontWeight: 800 }}>
                🚨 DISPATCH EMERGENCY AMBULANCE NOW
              </button>
            </div>
          )}

          {step === 'tracking' && (
            <div>
              {/* ETA Display */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: '.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>ESTIMATED AMBULANCE ARRIVAL</div>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: '#ef4444', textShadow: '0 0 20px rgba(239,68,68,.5)' }}>{eta} MINS</div>
                <div style={{ fontSize: '.82rem', color: '#34d399' }}>Ambulance #AMB-108 · Driver: Ramesh Kumar (+91 98765-43210)</div>
              </div>

              {/* Tracking Progress Bar */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', color: '#94a3b8', marginBottom: 6 }}>
                  <span>Hospital Dispatched</span>
                  <span>En Route ({ambulanceProgress}%)</span>
                  <span>Your Location</span>
                </div>
                <div style={{ width: '100%', height: 10, background: '#334155', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ width: `${ambulanceProgress}%`, height: '100%', background: 'linear-gradient(90deg, #ef4444, #f59e0b)', transition: 'width 1s linear' }}></div>
                </div>
              </div>

              {/* Simulated Map Graphic */}
              <div style={{ height: 160, background: '#1e293b', borderRadius: 12, border: '1px solid #334155', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                <div style={{ fontSize: '2.4rem', marginBottom: 6 }}>🚑 💨 📍</div>
                <div style={{ fontSize: '.84rem', color: '#cbd5e1', fontWeight: 600 }}>GPS Live Radar Active · Tracking Lat 12.9716 N, Lon 77.5946 E</div>
                <div style={{ fontSize: '.75rem', color: '#94a3b8', marginTop: 4 }}>Family emergency contact (Priya Sharma) notified via SMS & Call.</div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-outline w-full" onClick={() => { showToast('📞 Connected to 108 Dispatcher.', 'info'); }} style={{ color: '#fff', borderColor: '#475569', justifyContent: 'center' }}>
                  📞 Call Dispatcher
                </button>
                <button className="btn btn-danger w-full" onClick={onClose} style={{ background: '#334155', border: 'none', justifyContent: 'center' }}>
                  Close Protocol View
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
