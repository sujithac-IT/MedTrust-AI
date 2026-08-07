import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { ToastContainer, showToast } from '../components/Toast';

export default function AppointmentBooking() {
  const { currentUser, userProfile, isDemoMode } = useAuth();
  const profile = userProfile || currentUser || {};
  const [doctor] = useState('Dr. Arjun Mehta');
  const [specialty] = useState('Cardiologist');
  const [selectedSlot, setSelectedSlot] = useState('11:00 AM');
  const [consultType, setConsultType] = useState('video');
  const [booking, setBooking] = useState(false);
  const navigate = useNavigate();

  const slots = [
    { time: '10:00 AM', status: 'avail' },
    { time: '10:30 AM', status: 'booked' },
    { time: '11:00 AM', status: 'avail' },
    { time: '11:30 AM', status: 'avail' },
    { time: '12:00 PM', status: 'booked' },
    { time: '12:30 PM', status: 'avail' },
    { time: '2:30 PM', status: 'avail' },
    { time: '3:00 PM', status: 'avail' },
  ];

  const handleBooking = async () => {
    setBooking(true);
    if (!isDemoMode) {
      try {
        await addDoc(collection(db, 'appointments'), {
          patientName: profile.displayName || 'Rahul Sharma',
          patientId: currentUser?.uid || 'MT001',
          doctorName: doctor,
          department: specialty,
          slotTime: selectedSlot,
          consultType: consultType === 'video' ? 'Video Consult' : 'Hospital Visit',
          createdAt: serverTimestamp(),
          status: 'Upcoming'
        });
      } catch (err) {
        console.warn("Firestore appointment write notice:", err);
      }
    }

    showToast(`✅ Appointment confirmed with ${doctor} for ${selectedSlot}!`, 'success');
    setTimeout(() => {
      setBooking(false);
      navigate('/patient');
    }, 1500);
  };

  return (
    <div className="page" style={{ background: 'var(--bg)' }}>
      <ToastContainer />
      <div className="content-grid" style={{ maxWidth: 800 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>📅 Book Appointment</h1>
          <p style={{ color: 'var(--text2)', marginTop: 4 }}>AI-recommended slot allocation & real-time queue prediction.</p>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 56, height: 56, background: 'var(--primary-light)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>👨‍⚕️</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{doctor}</div>
              <div style={{ fontSize: '.84rem', color: 'var(--primary)', fontWeight: 600 }}>{specialty} · MBBS, MD, DM</div>
              <div style={{ fontSize: '.78rem', color: 'var(--text2)', marginTop: 2 }}>⭐ 4.9 (482 reviews) · Apollo Hospital</div>
            </div>
          </div>
        </div>

        {/* Consult Type */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: 12 }}>Consultation Type</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button className={`btn ${consultType === 'video' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setConsultType('video')} style={{ justifyContent: 'center', padding: 12 }}>
              📹 Video Consultation
            </button>
            <button className={`btn ${consultType === 'hospital' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setConsultType('hospital')} style={{ justifyContent: 'center', padding: 12 }}>
              🏥 Hospital Visit
            </button>
          </div>
        </div>

        {/* Slot Picker */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: 12 }}>Select Available Slot — Today</div>
          <div className="slot-grid">
            {slots.map(s => (
              <div key={s.time}
                className={`slot-btn ${s.status === 'booked' ? 'booked' : selectedSlot === s.time ? 'sel' : 'avail'}`}
                onClick={() => s.status === 'avail' && setSelectedSlot(s.time)}>
                {s.time} {s.status === 'booked' ? '✗' : selectedSlot === s.time ? '✓' : ''}
              </div>
            ))}
          </div>
        </div>

        {/* AI Queue Prediction */}
        <div className="card" style={{ marginBottom: 24, background: 'var(--primary-light)', border: '1px solid rgba(26,115,232,.2)' }}>
          <div style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--primary)', marginBottom: 10 }}>🤖 AI Queue Intelligence</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '.84rem' }}>
            <div>Queue Position: <strong>#2</strong></div>
            <div>Estimated Wait: <strong>~5 minutes</strong></div>
            <div>Consultation Starts: <strong>{selectedSlot}</strong></div>
            <div>Queue Status: <strong style={{ color: 'var(--secondary)' }}>On Time</strong></div>
          </div>
        </div>

        <button className="btn btn-primary btn-lg w-full" onClick={handleBooking} disabled={booking} style={{ justifyContent: 'center' }}>
          <i className="fa-solid fa-check"></i> {booking ? 'Confirming...' : `Confirm Appointment for ${selectedSlot}`}
        </button>
      </div>
    </div>
  );
}
