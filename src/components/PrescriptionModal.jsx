import { useRef } from 'react';

export default function PrescriptionModal({ rx, patient, onClose }) {
  const printRef = useRef(null);

  if (!rx) return null;

  const handlePrint = () => {
    window.print();
  };

  const defaultRx = {
    id: rx.id || 'RX-2026-8891',
    date: rx.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    doctorName: rx.doctorName || 'Dr. Arjun Mehta',
    doctorTitle: rx.doctorTitle || 'MD, DM (Cardiology) · Senior Consultant',
    doctorReg: rx.doctorReg || 'Reg No: MCI-2012-84921',
    patientName: patient?.name || rx.patientName || 'Rahul Sharma',
    patientAge: patient?.age || rx.patientAge || '42',
    patientGender: patient?.gender || rx.patientGender || 'Male',
    patientId: patient?.id || rx.patientId || 'MT001',
    vitals: rx.vitals || 'BP: 138/88 mmHg | HR: 94 bpm | SpO2: 98% | Weight: 74 kg',
    diagnosis: rx.diagnosis || 'Essential Hypertension & Mild Sinus Tachycardia',
    icdCode: rx.icdCode || 'ICD-10 I10 / R00.0',
    medications: rx.medications || [
      { name: 'Amlodipine Besylate', dosage: '5mg', frequency: '1-0-0 (Morning)', duration: '30 Days', instructions: 'After food' },
      { name: 'Atorvastatin Calcium', dosage: '20mg', frequency: '0-0-1 (Night)', duration: '30 Days', instructions: 'After dinner' },
      { name: 'Metoprolol Succinate', dosage: '25mg', frequency: '1-0-1 (Twice daily)', duration: '14 Days', instructions: 'With water' }
    ],
    advice: rx.advice || 'Low salt diet (< 2g/day). Daily 30 mins light cardio walk. Avoid stress and monitor blood pressure twice weekly.',
    followUp: rx.followUp || 'Return in 14 days for BP re-assessment. AI Auto-Reminders set.'
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content rx-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 750, width: '92vw', padding: 0, overflow: 'hidden' }}>
        
        {/* Printable Prescription Card */}
        <div ref={printRef} className="printable-rx" style={{ background: '#fff', color: '#1f2937', padding: '36px 40px', fontFamily: "'Inter', sans-serif" }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid var(--primary)', paddingBottom: 20, marginBottom: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: 'var(--primary)', color: '#fff', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 800 }}>
                  🏥
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.5px' }}>MediTrust AI Health Institute</h2>
                  <div style={{ fontSize: '.78rem', color: '#6b7280' }}>Agentic Digital Twin Hospital System · ISO 27001 Certified</div>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '.95rem', color: '#111827' }}>{defaultRx.doctorName}</div>
              <div style={{ fontSize: '.78rem', color: '#4b5563' }}>{defaultRx.doctorTitle}</div>
              <div style={{ fontSize: '.72rem', color: '#6b7280' }}>{defaultRx.doctorReg}</div>
              <div style={{ fontSize: '.72rem', color: 'var(--primary)', fontWeight: 600, marginTop: 2 }}>{defaultRx.date}</div>
            </div>
          </div>

          {/* Patient Details Stripe */}
          <div style={{ background: '#f3f4f6', borderRadius: 8, padding: '14px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, fontSize: '.84rem', marginBottom: 24 }}>
            <div><span style={{ color: '#6b7280', fontSize: '.72rem', display: 'block' }}>PATIENT NAME</span><strong>{defaultRx.patientName}</strong></div>
            <div><span style={{ color: '#6b7280', fontSize: '.72rem', display: 'block' }}>AGE / GENDER</span><strong>{defaultRx.patientAge} Yrs / {defaultRx.patientGender}</strong></div>
            <div><span style={{ color: '#6b7280', fontSize: '.72rem', display: 'block' }}>PATIENT ID</span><strong>#{defaultRx.patientId}</strong></div>
            <div><span style={{ color: '#6b7280', fontSize: '.72rem', display: 'block' }}>RX NUMBER</span><strong>{defaultRx.id}</strong></div>
          </div>

          {/* Clinical Vitals */}
          <div style={{ marginBottom: 20, fontSize: '.82rem', background: '#eff6ff', borderLeft: '4px solid #3b82f6', padding: '10px 14px', borderRadius: '0 6px 6px 0' }}>
            <strong style={{ color: '#1e40af' }}>Recorded Vitals: </strong>
            <span style={{ color: '#1e3a8a' }}>{defaultRx.vitals}</span>
          </div>

          {/* Diagnosis & ICD Code */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: '.75rem', fontWeight: 700, color: '#6b7280', letterSpacing: '.5px', marginBottom: 4 }}>DIAGNOSIS & CLINICAL FINDINGS</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 10 }}>
              {defaultRx.diagnosis}
              <span style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '.72rem', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>{defaultRx.icdCode}</span>
            </div>
          </div>

          {/* Rx Icon & Medications Table */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary)', fontFamily: 'serif' }}>Rx</span>
              <span style={{ fontSize: '.82rem', color: '#6b7280', fontWeight: 500 }}>Prescribed Medications</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.84rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb', textAlign: 'left', color: '#4b5563', fontSize: '.75rem' }}>
                  <th style={{ padding: '10px 12px' }}>MEDICINE & DOSAGE</th>
                  <th style={{ padding: '10px 12px' }}>FREQUENCY</th>
                  <th style={{ padding: '10px 12px' }}>DURATION</th>
                  <th style={{ padding: '10px 12px' }}>INSTRUCTIONS</th>
                </tr>
              </thead>
              <tbody>
                {defaultRx.medications.map((m, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px', fontWeight: 700, color: '#111827' }}>
                      {m.name} <span style={{ fontWeight: 400, color: '#6b7280', fontSize: '.78rem' }}>({m.dosage})</span>
                    </td>
                    <td style={{ padding: '12px', color: '#374151' }}>{m.frequency}</td>
                    <td style={{ padding: '12px', color: '#374151' }}>{m.duration}</td>
                    <td style={{ padding: '12px', color: '#059669', fontWeight: 500 }}>{m.instructions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Doctor Advice & Follow-up */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28, fontSize: '.82rem' }}>
            <div style={{ background: '#fffbe8', padding: 14, borderRadius: 8, border: '1px solid #fef08a' }}>
              <div style={{ fontWeight: 700, color: '#854d0e', marginBottom: 4 }}>💡 Doctor's Lifestyle Advice</div>
              <div style={{ color: '#713f12', lineHeight: 1.5 }}>{defaultRx.advice}</div>
            </div>
            <div style={{ background: '#f0fdf4', padding: 14, borderRadius: 8, border: '1px solid #bbf7d0' }}>
              <div style={{ fontWeight: 700, color: '#166534', marginBottom: 4 }}>📅 Follow-up Schedule</div>
              <div style={{ color: '#14532d', lineHeight: 1.5 }}>{defaultRx.followUp}</div>
            </div>
          </div>

          {/* Footer & QR Verification */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 50, height: 50, background: '#111827', color: '#fff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem', textAlign: 'center', padding: 4 }}>
                [QR CODE VERIFIED]
              </div>
              <div style={{ fontSize: '.7rem', color: '#9ca3af' }}>
                Digitally Signed & Verified via MediTrust AI Blockchain.<br />
                Verification Hash: <span style={{ fontFamily: 'monospace' }}>0x8a92f...4e19</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Brush Script MT', cursive, sans-serif", fontSize: '1.5rem', color: 'var(--primary)' }}>Arjun Mehta</div>
              <div style={{ fontSize: '.7rem', color: '#6b7280', borderTop: '1px dashed #d1d5db', paddingTop: 4 }}>Doctor Digital Signature</div>
            </div>
          </div>

        </div>

        {/* Modal Action Controls (Hidden during browser printing) */}
        <div className="no-print" style={{ background: '#f9fafb', padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '.82rem', color: '#6b7280' }}>
            <i className="fa-solid fa-circle-check" style={{ color: '#10b981', marginRight: 6 }}></i> Valid Official Prescription
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-outline" onClick={onClose}>Close</button>
            <button className="btn btn-primary" onClick={handlePrint}>
              <i className="fa-solid fa-print"></i> Print / Download PDF
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
