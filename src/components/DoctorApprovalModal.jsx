// MediTrust AI — Doctor Approval Modal
// Clinical verification dialog before finalizing a case sheet.

import { useState } from 'react';

export default function DoctorApprovalModal({ caseSheet, doctor, onConfirm, onCancel }) {
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const assessment = caseSheet?.assessment || 'Assessment not available';
  const medications = caseSheet?.medications || [];
  const complaints = caseSheet?.chief_complaint || [];

  const handleApprove = async () => {
    if (!confirmed) return;
    setSubmitting(true);
    try {
      await onConfirm?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}>
      <div className="modal-content" style={{ maxWidth: 560, padding: 0 }}>
        {/* Header */}
        <div style={{
          padding: '24px 28px 20px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'var(--secondary-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="fa-solid fa-clipboard-check" style={{ color: 'var(--secondary)', fontSize: '1.2rem' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Approve Clinical Record</h3>
            <div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>Final verification before saving</div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onCancel}
            style={{ marginLeft: 'auto', padding: 6 }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Summary */}
        <div style={{ padding: '20px 28px' }}>
          <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
            Record Summary
          </div>

          <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            {[
              ['Assessment', assessment],
              ['Chief Complaint', complaints.filter(c => c !== 'Not mentioned in consultation').join(', ') || '—'],
              ['Medications', medications.map(m => `${m.medicine} ${m.dosage}`).join(', ') || 'None prescribed'],
              ['Follow-up', caseSheet?.follow_up || '—'],
            ].map(([label, value]) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '8px 0', borderBottom: '1px solid var(--border-light)',
                fontSize: '.85rem',
              }}>
                <span style={{ color: 'var(--text2)', fontWeight: 500 }}>{label}</span>
                <span style={{ fontWeight: 600, color: 'var(--text)', maxWidth: '60%', textAlign: 'right' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Doctor Credentials */}
          <div style={{ background: 'var(--primary-light)', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: '.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="avatar avatar-sm" style={{ background: 'var(--primary)' }}>
                {doctor?.name?.[0] || 'D'}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text)' }}>{doctor?.name || 'Doctor'}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--text2)' }}>
                  {doctor?.specialty || 'General Medicine'} · {doctor?.licenseNo || 'License on file'}
                </div>
              </div>
            </div>
          </div>

          {/* Timestamp */}
          <div style={{ fontSize: '.78rem', color: 'var(--text3)', marginBottom: 16 }}>
            <i className="fa-solid fa-clock" style={{ marginRight: 6 }} />
            Approval Timestamp: {new Date().toLocaleString('en-IN')}
          </div>

          {/* Confirmation Checkbox */}
          <label style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '14px 16px', borderRadius: 10,
            border: `2px solid ${confirmed ? 'var(--secondary)' : 'var(--border)'}`,
            background: confirmed ? 'var(--secondary-light)' : 'transparent',
            cursor: 'pointer', transition: 'all 0.2s ease',
            marginBottom: 8,
          }}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              style={{ marginTop: 2, width: 18, height: 18, accentColor: 'var(--secondary)' }}
            />
            <div style={{ fontSize: '.85rem', lineHeight: 1.6, color: 'var(--text)' }}>
              I have reviewed the AI-generated clinical documentation, verified it against the consultation, and confirm that the information is accurate and complete for this patient record.
            </div>
          </label>
        </div>

        {/* Actions */}
        <div style={{
          padding: '16px 28px 24px',
          display: 'flex', gap: 12, justifyContent: 'flex-end',
        }}>
          <button className="btn btn-outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button
            className="btn btn-secondary btn-lg"
            onClick={handleApprove}
            disabled={!confirmed || submitting}
            style={{ minWidth: 180 }}
          >
            {submitting ? (
              <>
                <div className="processing-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Saving...
              </>
            ) : (
              <>
                <i className="fa-solid fa-check-double" /> Approve & Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
