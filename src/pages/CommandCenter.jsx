import { useState, useEffect } from 'react';
import { ToastContainer, showToast } from '../components/Toast';

export default function CommandCenter() {
  const [beds, setBeds] = useState(148);
  const [queue, setQueue] = useState(37);
  const [icu, setIcu] = useState(18);
  const [doctors, setDoctors] = useState(24);

  // Live simulation tick
  useEffect(() => {
    const interval = setInterval(() => {
      const delta = Math.random() > 0.5 ? 1 : -1;
      setQueue(prev => Math.max(10, Math.min(60, prev + delta)));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const bedGrid = Array.from({ length: 30 }, (_, i) => {
    const bedId = i + 1;
    if ([3, 7, 14].includes(bedId)) return { id: bedId, type: 'ic', label: 'ICU' };
    if ([6, 8, 11, 15, 18, 22, 26, 29].includes(bedId)) return { id: bedId, type: 'fr', label: 'Free' };
    if ([10, 20].includes(bedId)) return { id: bedId, type: 'rs', label: 'Reserved' };
    return { id: bedId, type: 'oc', label: 'Occupied' };
  });

  const doctorList = [
    { name: 'Dr. Arjun Mehta', spec: 'Cardiology', status: 'av', initials: 'AM', bg: 'rgba(26,115,232,.3)' },
    { name: 'Dr. Priya Nair', spec: 'Cardiology', status: 'av', initials: 'PN', bg: 'rgba(0,191,165,.3)' },
    { name: 'Dr. Ranjit Gupta', spec: 'Neurology', status: 'bu', initials: 'RG', bg: 'rgba(124,77,255,.3)' },
    { name: 'Dr. Sunita Kulkarni', spec: 'Obstetrics', status: 'av', initials: 'SK', bg: 'rgba(249,171,0,.3)' },
    { name: 'Dr. Vikram Reddy', spec: 'Emergency', status: 'bu', initials: 'VR', bg: 'rgba(217,48,37,.3)' },
    { name: 'Dr. Asha Menon', spec: 'Pediatrics', status: 'av', initials: 'AM', bg: 'rgba(15,157,88,.3)' },
  ];

  const queueList = [
    { pos: 1, name: 'Deepa Verma', wait: '5 min', priority: 'URGENT', color: '#f28b82' },
    { pos: 2, name: 'Arjun Pillai', wait: '12 min', priority: 'NORMAL', color: '#6cb4ff' },
    { pos: 3, name: 'Kavya Singh', wait: '18 min', priority: 'NORMAL', color: '#6cb4ff' },
    { pos: 4, name: 'Mohan Das', wait: '24 min', priority: 'FOLLOW-UP', color: '#fdd663' },
    { pos: 5, name: 'Preethi Raj', wait: '31 min', priority: 'NORMAL', color: '#6cb4ff' },
  ];

  return (
    <div className="cmd-bg">
      <ToastContainer />
      <div className="cmd-inner">
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: '1.6rem', margin: 0 }}>🏥 Hospital Command Center</h1>
            <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.5)', marginTop: 2 }}>Apollo Hospitals · Main Campus · Real-time AI Monitoring</div>
          </div>
          <div className="live-ind">
            <div className="live-dot"></div> Live · System Operational
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="cmd-grid-4">
          <div className="cmd-stat">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(26,115,232,.2)', color: '#6cb4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🛏️</div>
              <span className="badge badge-blue">82%</span>
            </div>
            <div className="cmd-val">{beds}</div>
            <div className="cmd-lbl">Occupied Beds / 180 Total</div>
            <div className="progress-track" style={{ marginTop: 10, background: 'rgba(255,255,255,.1)' }}><div className="progress-fill progress-blue" style={{ width: '82%' }}></div></div>
          </div>

          <div className="cmd-stat">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(217,48,37,.2)', color: '#f28b82', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🚨</div>
              <span className="badge badge-red">90% HIGH</span>
            </div>
            <div className="cmd-val">{icu}</div>
            <div className="cmd-lbl">ICU Beds Occupied / 20</div>
            <div className="progress-track" style={{ marginTop: 10, background: 'rgba(255,255,255,.1)' }}><div className="progress-fill progress-red" style={{ width: '90%' }}></div></div>
          </div>

          <div className="cmd-stat">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(15,157,88,.2)', color: '#34e873', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👨‍⚕️</div>
              <span className="badge badge-green">Active</span>
            </div>
            <div className="cmd-val">{doctors}</div>
            <div className="cmd-lbl">Doctors on Duty</div>
            <div className="progress-track" style={{ marginTop: 10, background: 'rgba(255,255,255,.1)' }}><div className="progress-fill progress-green" style={{ width: '80%' }}></div></div>
          </div>

          <div className="cmd-stat">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(249,171,0,.2)', color: '#fdd663', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👥</div>
              <span className="badge badge-amber">Normal</span>
            </div>
            <div className="cmd-val">{queue}</div>
            <div className="cmd-lbl">Patients in Live Queue</div>
            <div className="progress-track" style={{ marginTop: 10, background: 'rgba(255,255,255,.1)' }}><div className="progress-fill progress-amber" style={{ width: `${(queue / 60) * 100}%` }}></div></div>
          </div>
        </div>

        {/* Panels */}
        <div className="cmd-panels">
          {/* Bed Map */}
          <div className="cmd-card">
            <div className="cmd-card-header">
              <span>🛏️ Bed Map — General Ward</span>
              <span style={{ fontSize: '.72rem', color: '#6cb4ff' }}>148/180</span>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: '.68rem', color: 'rgba(255,255,255,.5)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, background: '#6cb4ff', borderRadius: 2 }}></span>Occupied</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, background: '#34e873', borderRadius: 2 }}></span>Free</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, background: '#f28b82', borderRadius: 2 }}></span>ICU</span>
              </div>
              <div className="bed-grid">
                {bedGrid.map(b => (
                  <div key={b.id} className={`bed ${b.type}`} title={`Bed ${b.id} - ${b.label}`} onClick={() => showToast(`Bed ${b.id} selected: ${b.label}`, 'info')}>
                    {b.id}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Doctors */}
          <div className="cmd-card">
            <div className="cmd-card-header">
              <span>👨‍⚕️ Staff Availability</span>
              <span style={{ fontSize: '.72rem', color: '#34e873' }}>24 Active</span>
            </div>
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {doctorList.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, borderRadius: 8, background: 'rgba(255,255,255,.03)' }}>
                  <div className="avatar avatar-sm" style={{ background: d.bg, color: '#fff' }}>{d.initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '.82rem', fontWeight: 600, color: 'rgba(255,255,255,.9)' }}>{d.name}</div>
                    <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.45)' }}>{d.spec}</div>
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.status === 'av' ? '#34e873' : 'var(--amber)' }}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Queue */}
          <div className="cmd-card">
            <div className="cmd-card-header">
              <span>👥 Patient Queue</span>
              <span style={{ fontSize: '.72rem', color: '#fdd663' }}>{queue} Waiting</span>
            </div>
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {queueList.map(q => (
                <div key={q.pos} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, borderRadius: 8, background: 'rgba(255,255,255,.03)' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(26,115,232,.25)', color: '#6cb4ff', fontSize: '.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {q.pos}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '.82rem', fontWeight: 600, color: 'rgba(255,255,255,.9)' }}>{q.name}</div>
                    <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.45)' }}>Est. wait: {q.wait}</div>
                  </div>
                  <span style={{ fontSize: '.62rem', fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: 'rgba(255,255,255,.08)', color: q.color }}>{q.priority}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
