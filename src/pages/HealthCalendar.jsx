import { useState } from 'react';
import { ToastContainer, showToast } from '../components/Toast';

const CALENDAR_EVENTS = [
  { id: 1, date: 'Today', time: '7:00 AM', category: 'Medicine', title: 'Amlodipine 5mg', detail: 'BP Medication · After breakfast', icon: '💊', color: 'var(--primary)', done: true },
  { id: 2, date: 'Today', time: '9:00 AM', category: 'Exercise', title: 'Morning Cardio Walk', detail: '20 mins · Light pace', icon: '🏃', color: 'var(--secondary)', done: false },
  { id: 3, date: 'Today', time: '1:00 PM', category: 'Medicine', title: 'Amoxicillin 500mg', detail: 'Antibiotic · Post lunch', icon: '💊', color: 'var(--red)', done: false },
  { id: 4, date: 'Tomorrow', time: '8:30 AM', category: 'Lab Test', title: 'Fasting Lipid Profile', detail: 'Apollo Diagnostics · Fasting required', icon: '🩸', color: 'var(--amber)', done: false },
  { id: 5, date: 'Aug 10', time: '10:30 AM', category: 'Appointment', title: 'Video Consult with Dr. Arjun Mehta', detail: 'Cardiology Review', icon: '📹', color: 'var(--teal)', done: false },
  { id: 6, date: 'Aug 15', time: '11:00 AM', category: 'Vaccination', title: 'Flu & Pneumococcal Booster', detail: 'Preventative Vaccine', icon: '💉', color: 'var(--purple)', done: false },
];

export default function HealthCalendar() {
  const [events, setEvents] = useState(CALENDAR_EVENTS);
  const [filter, setFilter] = useState('All');

  const toggleDone = (id) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, done: !e.done } : e));
    showToast('Health Calendar event updated.', 'success');
  };

  const filteredEvents = filter === 'All' ? events : events.filter(e => e.category === filter);

  return (
    <div className="page" style={{ background: 'var(--bg)' }}>
      <ToastContainer />
      <div className="content-grid">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: '.84rem', color: 'var(--text2)' }}>Patient Digital Twin Calendar</div>
            <h1 style={{ fontSize: '1.8rem', margin: 0 }}>📅 AI Integrated Health Calendar</h1>
            <div style={{ fontSize: '.84rem', color: 'var(--text2)', marginTop: 4 }}>Auto-populated from doctor treatments, prescriptions, and recovery plans.</div>
          </div>
          <button className="btn btn-primary" onClick={() => showToast('📅 Added custom health reminder to calendar.', 'info')}>
            <i className="fa-solid fa-plus"></i> Add Personal Event
          </button>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {['All', 'Medicine', 'Appointment', 'Lab Test', 'Exercise', 'Vaccination'].map(cat => (
            <button
              key={cat}
              className={`btn ${filter === cat ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter(cat)}
              style={{ fontSize: '.82rem' }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Timeline Event Cards */}
        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredEvents.map(evt => (
              <div key={evt.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 12, border: '1px solid var(--border)', background: evt.done ? 'var(--bg)' : '#fff', opacity: evt.done ? 0.75 : 1 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: evt.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                  {evt.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="badge badge-blue">{evt.date} · {evt.time}</span>
                    <span style={{ fontSize: '.75rem', fontWeight: 700, color: evt.color }}>{evt.category}</span>
                  </div>
                  <h4 style={{ margin: '4px 0 2px', fontSize: '1rem', textDecoration: evt.done ? 'line-through' : 'none' }}>{evt.title}</h4>
                  <div style={{ fontSize: '.8rem', color: 'var(--text2)' }}>{evt.detail}</div>
                </div>
                <button className={`btn btn-sm ${evt.done ? 'btn-outline' : 'btn-primary'}`} onClick={() => toggleDone(evt.id)}>
                  {evt.done ? '✓ Done' : 'Mark Complete'}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
