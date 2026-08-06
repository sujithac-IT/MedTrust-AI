import { useState } from 'react';
import { ToastContainer, showToast } from '../components/Toast';

export default function RecoveryCompanion() {
  const [mood, setMood] = useState('🙂');
  const [pain, setPain] = useState(2);
  const [fever, setFever] = useState(false);
  const [medsTaken, setMedsTaken] = useState(true);
  const [water, setWater] = useState(1.5);

  const handleLog = () => {
    showToast('✅ Daily recovery log submitted! Doctor notified.', 'success');
  };

  return (
    <div className="page" style={{ background: 'var(--bg)' }}>
      <ToastContainer />
      <div className="content-grid" style={{ maxWidth: 900 }}>
        <div style={{ marginBottom: 24, background: 'linear-gradient(135deg, var(--secondary), #0b7040)', padding: 24, borderRadius: 20, color: '#fff' }}>
          <div style={{ fontSize: '.8rem', opacity: .8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>MediTrust AI ⭐⭐⭐⭐⭐</div>
          <h1 style={{ color: '#fff', fontSize: '1.8rem', margin: '4px 0 8px' }}>24×7 Recovery Companion</h1>
          <p style={{ color: 'rgba(255,255,255,.85)', fontSize: '.92rem', margin: 0 }}>
            "The consultation ends, but the care never stops." Continuous monitoring until complete recovery.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {/* Daily Health Check-in */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: 16 }}>📊 Daily Health Check-in</div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '.84rem', color: 'var(--text2)', marginBottom: 8 }}>How are you feeling today?</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {['😣', '😐', '🙂', '😁'].map(m => (
                  <button key={m} onClick={() => setMood(m)} style={{ fontSize: '1.6rem', padding: 8, borderRadius: 12, border: mood === m ? '2px solid var(--secondary)' : '1px solid var(--border)', background: mood === m ? 'var(--secondary-light)' : '#fff', cursor: 'pointer' }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '.84rem', color: 'var(--text2)', marginBottom: 8 }}>Pain level (1 to 5): <strong>{pain}</strong></div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(p => (
                  <button key={p} onClick={() => setPain(p)} style={{ flex: 1, padding: 8, borderRadius: 8, border: pain === p ? '2px solid var(--secondary)' : '1px solid var(--border)', background: pain === p ? 'var(--secondary-light)' : '#fff', fontWeight: 700, cursor: 'pointer' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '.84rem', color: 'var(--text2)', marginBottom: 8 }}>Any fever today?</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className={`btn btn-sm ${!fever ? 'btn-secondary' : 'btn-outline'}`} onClick={() => setFever(false)}>✅ No Fever</button>
                <button className={`btn btn-sm ${fever ? 'btn-danger' : 'btn-outline'}`} onClick={() => { setFever(true); showToast('🌡️ Fever Alert logged! Care plan updated & doctor notified.', 'warning'); }}>
                  ⚠️ Fever Detected
                </button>
              </div>
            </div>

            <button className="btn btn-secondary w-full" onClick={handleLog} style={{ justifyContent: 'center' }}>
              Submit Daily Log
            </button>
          </div>

          {/* Lifestyle & Goals */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: 16 }}>🏃 Lifestyle & Goals Today</div>
            {[
              { icon: '🚶', name: 'Morning Walk', detail: '22 / 20 mins completed', val: 100, color: 'progress-green' },
              { icon: '💧', name: 'Water Intake', detail: `${water}L / 2.0L target`, val: (water / 2) * 100, color: 'progress-blue' },
              { icon: '🧘', name: 'Physiotherapy', detail: '9 / 15 exercises done', val: 60, color: 'progress-gradient' },
              { icon: '😴', name: 'Sleep Quality', detail: '6.8 hrs · Restful', val: 85, color: 'progress-green' },
            ].map(g => (
              <div key={g.name} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.84rem', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{g.icon} {g.name}</span>
                  <span style={{ fontSize: '.78rem', color: 'var(--text2)' }}>{g.detail}</span>
                </div>
                <div className="progress-track"><div className={`progress-fill ${g.color}`} style={{ width: `${g.val}%` }}></div></div>
              </div>
            ))}
            <button className="btn btn-outline btn-sm w-full" onClick={() => { setWater(w => Math.min(2, w + 0.25)); showToast('💧 250ml water added!', 'info'); }} style={{ justifyContent: 'center', marginTop: 8 }}>
              + Log Water (+250ml)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
