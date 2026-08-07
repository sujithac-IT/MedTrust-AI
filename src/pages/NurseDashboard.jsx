import { useState } from 'react';
import { ToastContainer, showToast } from '../components/Toast';

const WARD_BEDS = [
  { id: 'BED-101', patient: 'Rahul Sharma', age: 42, condition: 'Post-Cardiac Angioplasty', status: 'Occupied', doctor: 'Dr. Arjun Mehta', vitals: 'BP: 138/88 · HR: 78 · SpO2: 98%', color: 'var(--primary)' },
  { id: 'BED-102', patient: 'Ravi Kumar', age: 54, condition: 'Diabetic Ketoacidosis', status: 'ICU Critical', doctor: 'Dr. Priya Nair', vitals: 'BP: 152/96 · HR: 104 · SpO2: 94%', color: 'var(--red)' },
  { id: 'BED-103', patient: 'Meena Patel', age: 38, condition: 'Post-Appendectomy Day 2', status: 'Stable', doctor: 'Dr. Rajesh Verma', vitals: 'BP: 120/80 · HR: 72 · SpO2: 99%', color: 'var(--secondary)' },
  { id: 'BED-104', patient: 'Empty Bed', age: '-', condition: 'Sanitized & Ready', status: 'Available', doctor: 'Unassigned', vitals: 'N/A', color: 'var(--teal)' },
  { id: 'BED-105', patient: 'Sanjay Rao', age: 45, condition: 'Hypertensive Crisis', status: 'Occupied', doctor: 'Dr. Arjun Mehta', vitals: 'BP: 160/100 · HR: 92 · SpO2: 96%', color: 'var(--amber)' },
];

export default function NurseDashboard() {
  const [beds, setBeds] = useState(WARD_BEDS);
  const [selectedBed, setSelectedBed] = useState(WARD_BEDS[0]);
  const [bp, setBp] = useState('120/80');
  const [hr, setHr] = useState('75');
  const [spo2, setSpo2] = useState('98');

  const [orders, setOrders] = useState([
    { id: 1, text: 'Administer IV Inj Pantoprazole 40mg', time: '8:00 AM', done: true },
    { id: 2, text: 'Check Post-op Wound Dressing & Sterility', time: '11:00 AM', done: false },
    { id: 3, text: 'Monitor Blood Glucose Post-Lunch', time: '2:00 PM', done: false },
    { id: 4, text: 'Nebulization with Duolin (If dyspneic)', time: 'PRN', done: false },
  ]);

  const toggleOrder = (id) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, done: !o.done } : o));
    showToast('Nurse task status updated & logged in EMR.', 'success');
  };

  const handleUpdateVitals = () => {
    const updatedVitals = `BP: ${bp} · HR: ${hr} · SpO2: ${spo2}%`;
    setBeds(prev => prev.map(b => b.id === selectedBed.id ? { ...b, vitals: updatedVitals } : b));
    setSelectedBed(prev => ({ ...prev, vitals: updatedVitals }));
    showToast(`✅ Vitals recorded for ${selectedBed.patient}!`, 'success');
  };

  return (
    <div className="page" style={{ background: 'var(--bg)' }}>
      <ToastContainer />
      <div className="content-grid">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: '.84rem', color: 'var(--text2)' }}>Ward Station 4B · Shift: Morning (7:00 AM – 3:00 PM)</div>
            <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Nurse Station Dashboard 🩺</h1>
            <div style={{ fontSize: '.84rem', color: 'var(--text2)', marginTop: 4 }}>Head Nurse Sister Anitha · Apollo Cardiac Ward</div>
          </div>
          <span className="badge badge-green" style={{ fontSize: '.9rem', padding: '8px 14px' }}>
            <i className="fa-solid fa-circle" style={{ fontSize: '.6rem', marginRight: 6 }}></i> 5 Beds Active
          </span>
        </div>

        <div className="dash-grid">
          {/* Main Bed Grid */}
          <div className="dash-main">
            <div className="card">
              <h3 style={{ marginTop: 0, fontSize: '1.05rem', marginBottom: 16 }}>🛏️ In-Patient Ward Beds Overview</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                {beds.map(b => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBed(b)}
                    style={{
                      padding: 16, borderRadius: 12, border: selectedBed.id === b.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: selectedBed.id === b.id ? 'var(--primary-light)' : '#fff', cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <strong style={{ fontSize: '.9rem', color: b.color }}>{b.id}</strong>
                      <span className={`badge badge-${b.status.includes('ICU') ? 'red' : b.status === 'Available' ? 'green' : 'blue'}`}>
                        {b.status}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{b.patient}</div>
                    <div style={{ fontSize: '.78rem', color: 'var(--text2)', margin: '4px 0 8px' }}>{b.condition}</div>
                    <div style={{ fontSize: '.72rem', background: 'rgba(0,0,0,.04)', padding: '4px 8px', borderRadius: 6 }}>
                      {b.vitals}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Doctor Orders Execution */}
            <div className="card">
              <h3 style={{ marginTop: 0, fontSize: '1.05rem', marginBottom: 14 }}>📝 Doctor Treatment Orders for {selectedBed.patient}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {orders.map(o => (
                  <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    <input type="checkbox" checked={o.done} onChange={() => toggleOrder(o.id)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '.88rem', fontWeight: 600, textDecoration: o.done ? 'line-through' : 'none' }}>{o.text}</div>
                      <div style={{ fontSize: '.75rem', color: 'var(--text2)' }}>Scheduled: {o.time} · Ordered by {selectedBed.doctor}</div>
                    </div>
                    <span className={`badge badge-${o.done ? 'green' : 'amber'}`}>{o.done ? 'Executed' : 'Pending'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar: Log Patient Vitals */}
          <div className="dash-sidebar">
            <div className="card">
              <h3 style={{ marginTop: 0, fontSize: '1rem', marginBottom: 12 }}>🌡️ Record Vitals ({selectedBed.id})</h3>
              <div style={{ fontSize: '.82rem', color: 'var(--text2)', marginBottom: 14 }}>Patient: <strong>{selectedBed.patient}</strong></div>
              
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Blood Pressure (mmHg)</label>
                <input className="input-field" value={bp} onChange={e => setBp(e.target.value)} placeholder="120/80" />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Heart Rate (bpm)</label>
                <input className="input-field" value={hr} onChange={e => setHr(e.target.value)} placeholder="75" />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: '.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Oxygen Saturation SpO2 (%)</label>
                <input className="input-field" value={spo2} onChange={e => setSpo2(e.target.value)} placeholder="98" />
              </div>

              <button className="btn btn-primary w-full" onClick={handleUpdateVitals} style={{ justifyContent: 'center' }}>
                <i className="fa-solid fa-save"></i> Save & Sync Vitals to EMR
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
