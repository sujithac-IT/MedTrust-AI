import { useState, useEffect } from 'react';
import { showToast } from './Toast';

const EMERGENCY_CATEGORIES = [
  { id: 'cardiac', label: 'Chest Pain / Cardiac', icon: 'fa-heart-pulse', color: '#ef4444', desc: 'Crushing chest pressure, left arm pain, severe diaphoresis' },
  { id: 'respiratory', label: 'Respiratory Distress', icon: 'fa-lungs', color: '#38bdf8', desc: 'Severe dyspnea, acute asthma, stridor, asphyxiation' },
  { id: 'stroke', label: 'Stroke & Paralysis', icon: 'fa-brain', color: '#a855f7', desc: 'Facial drooping, slurred speech, acute limb weakness' },
  { id: 'trauma', label: 'Trauma & Hemorrhage', icon: 'fa-droplet', color: '#dc2626', desc: 'Uncontrolled bleeding, fractures, major physical impact' },
  { id: 'allergy', label: 'Anaphylaxis / Allergy', icon: 'fa-shield-halved', color: '#f59e0b', desc: 'Airway swelling, hives, sudden hypotension' },
  { id: 'seizure', label: 'Convulsions / Loss of Consciousness', icon: 'fa-user-ninja', color: '#10b981', desc: 'Seizures, unresponsiveness, syncope' },
  { id: 'obstetric', label: 'Maternal Emergency', icon: 'fa-person-pregnant', color: '#ec4899', desc: 'Acute abdominal pain, preeclampsia, labor' },
  { id: 'poison', label: 'Toxicity / Overdose', icon: 'fa-triangle-exclamation', color: '#f97316', desc: 'Accidental ingestion, chemical exposure' },
];

export default function EmergencySOSModal({ isOpen, onClose }) {
  const [step, setStep] = useState('triage'); // 'triage' | 'tracking'
  const [selectedCat, setSelectedCat] = useState('cardiac');
  const [eta, setEta] = useState(4);
  const [ambulanceProgress, setAmbulanceProgress] = useState(35);

  useEffect(() => {
    let timer;
    if (step === 'tracking') {
      timer = setInterval(() => {
        setAmbulanceProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            showToast('Ambulance #AMB-108 has arrived at patient location.', 'warning');
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
    showToast('Emergency SOS Dispatched. Dispatching Ambulance #AMB-108.', 'danger');
  };

  const selectedCategoryObj = EMERGENCY_CATEGORIES.find(c => c.id === selectedCat) || EMERGENCY_CATEGORIES[0];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 760, width: '94vw', padding: 0, overflow: 'hidden', background: '#0f172a', color: '#fff', border: '1px solid #dc2626', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
        
        {/* Professional Clinical Header */}
        <div style={{ background: 'linear-gradient(90deg, #991b1b, #dc2626)', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="pulse" style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff', display: 'inline-block' }}></span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 800, letterSpacing: '-0.3px' }}>
                <i className="fa-solid fa-truck-medical" style={{ marginRight: 8 }}></i> AI EMERGENCY RESPONSE PROTOCOL
              </h3>
              <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.85)' }}>Emergency Case ID: #EMG-2026-9921 · Direct Hotline 108 Dispatcher</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ✕
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {step === 'triage' && (
            <div>
              <div style={{ fontWeight: 700, fontSize: '.92rem', color: '#cbd5e1', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                Select Emergency Triage Category:
              </div>

              {/* 8 Clinical Emergency Categories Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 10, marginBottom: 20, maxHeight: 340, overflowY: 'auto', paddingRight: 4 }}>
                {EMERGENCY_CATEGORIES.map(cat => (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCat(cat.id)}
                    style={{
                      padding: 12, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12,
                      background: selectedCat === cat.id ? '#1e293b' : '#182238',
                      border: selectedCat === cat.id ? `2px solid ${cat.color}` : '1px solid #334155',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,.06)', color: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                      <i className={`fa-solid ${cat.icon}`}></i>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '.88rem', color: '#fff' }}>{cat.label}</div>
                      <div style={{ fontSize: '.74rem', color: '#94a3b8', marginTop: 2, lineHeight: 1.3 }}>{cat.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Nearest Hospital Telemetry */}
              <div style={{ background: '#1e293b', padding: '14px 18px', borderRadius: 10, border: '1px solid #334155', marginBottom: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: '.82rem' }}>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: '.72rem' }}>NEAREST TRAUMA CENTER</span>
                  <strong style={{ color: '#38bdf8' }}><i className="fa-solid fa-hospital" style={{ marginRight: 6 }}></i> Apollo Emergency Center (1.8 km)</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: '.72rem' }}>ON-DUTY CARDIOLOGIST</span>
                  <strong style={{ color: '#34d399' }}><i className="fa-solid fa-user-doctor" style={{ marginRight: 6 }}></i> Dr. Arjun Mehta (Alerted)</strong>
                </div>
              </div>

              <button className="btn btn-danger btn-lg w-full" onClick={handleDispatch} style={{ background: '#dc2626', justifyContent: 'center', height: 48, fontSize: '.95rem', fontWeight: 800, borderRadius: 10 }}>
                <i className="fa-solid fa-truck-medical"></i> DISPATCH EMERGENCY AMBULANCE FOR {selectedCategoryObj.label.toUpperCase()}
              </button>
            </div>
          )}

          {step === 'tracking' && (
            <div>
              {/* ETA Display */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: '.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>ESTIMATED AMBULANCE ARRIVAL</div>
                <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#ef4444', textShadow: '0 0 20px rgba(239,68,68,.4)' }}>{eta} MINS</div>
                <div style={{ fontSize: '.8rem', color: '#34d399', marginTop: 2 }}>
                  <i className="fa-solid fa-truck-medical" style={{ marginRight: 6 }}></i> Ambulance #AMB-108 · Paramedic Ramesh Kumar (+91 98765-43210)
                </div>
              </div>

              {/* Tracking Progress Bar */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', color: '#94a3b8', marginBottom: 6 }}>
                  <span>Hospital Dispatched</span>
                  <span>En Route ({ambulanceProgress}%)</span>
                  <span>Patient GPS Location</span>
                </div>
                <div style={{ width: '100%', height: 8, background: '#334155', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${ambulanceProgress}%`, height: '100%', background: 'linear-gradient(90deg, #dc2626, #f59e0b)', transition: 'width 1s linear' }}></div>
                </div>
              </div>

              {/* Professional GIS Radar Telemetry Box */}
              <div style={{ height: 140, background: '#1e293b', borderRadius: 10, border: '1px solid #334155', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                <div style={{ color: '#38bdf8', fontSize: '1.6rem', marginBottom: 6 }}>
                  <i className="fa-solid fa-radar fa-spin" style={{ marginRight: 10 }}></i>
                  <i className="fa-solid fa-location-crosshairs"></i>
                </div>
                <div style={{ fontSize: '.84rem', color: '#cbd5e1', fontWeight: 600 }}>GIS Live Telemetry Active · Lat 12.9716 N, Lon 77.5946 E</div>
                <div style={{ fontSize: '.75rem', color: '#94a3b8', marginTop: 4 }}>Family Contact (Priya Sharma) notified via SMS & Call.</div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-outline w-full" onClick={() => showToast('Connecting to Emergency Hotline Dispatcher...', 'info')} style={{ color: '#fff', borderColor: '#475569', justifyContent: 'center', height: 44 }}>
                  <i className="fa-solid fa-phone"></i> Call Dispatcher
                </button>
                <button className="btn btn-danger w-full" onClick={onClose} style={{ background: '#334155', border: 'none', justifyContent: 'center', height: 44 }}>
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
