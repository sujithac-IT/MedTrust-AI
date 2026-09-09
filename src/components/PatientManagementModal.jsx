// MediTrust AI — Patient Management Modal
// Create new patients with validated demographic, contact, and medical fields.

import { useState } from 'react';
import { validatePatientInput } from '../types/consultation';

export default function PatientManagementModal({ onSave, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    dateOfBirth: '',
    age: '',
    gender: '',
    phone: '',
    email: '',
    allergies: '',
    medicalConditions: '',
  });
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  // Auto-calculate age from DOB
  const handleDobChange = (dob) => {
    update('dateOfBirth', dob);
    if (dob) {
      const birth = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
      update('age', age >= 0 ? String(age) : '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validatePatientInput(form);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setSaving(true);

    const patientData = {
      ...form,
      age: form.age ? Number(form.age) : '',
      allergies: form.allergies
        ? form.allergies.split(',').map(a => a.trim()).filter(Boolean)
        : [],
      medicalConditions: form.medicalConditions
        ? form.medicalConditions.split(',').map(c => c.trim()).filter(Boolean)
        : [],
    };

    try {
      await onSave?.(patientData);
    } catch (err) {
      setErrors([err.message || 'Failed to save patient']);
    }
    setSaving(false);
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}>
      <div className="modal-content" style={{ maxWidth: 520, padding: 0 }}>
        {/* Header */}
        <div style={{
          padding: '24px 28px 20px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'var(--primary-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="fa-solid fa-user-plus" style={{ color: 'var(--primary)', fontSize: '1.1rem' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>New Patient</h3>
            <div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>Enter patient demographics and medical baseline</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onCancel} style={{ marginLeft: 'auto', padding: 6 }}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 28px 24px' }}>
          {errors.length > 0 && (
            <div style={{
              background: 'var(--red-light)', border: '1px solid #ffcdd2',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              fontSize: '.82rem', color: 'var(--red)',
            }}>
              {errors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              className="form-input"
              type="text"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="Enter patient's full name"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input
                className="form-input"
                type="date"
                value={form.dateOfBirth}
                onChange={e => handleDobChange(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Age</label>
              <input
                className="form-input"
                type="number"
                value={form.age}
                onChange={e => update('age', e.target.value)}
                placeholder="Years"
                min="0"
                max="150"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Gender *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {['Male', 'Female', 'Other'].map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => update('gender', g)}
                  className="btn"
                  style={{
                    padding: '10px',
                    border: `2px solid ${form.gender === g ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 8,
                    background: form.gender === g ? 'var(--primary-light)' : 'var(--white)',
                    color: form.gender === g ? 'var(--primary)' : 'var(--text2)',
                    fontWeight: 600, fontSize: '.85rem', justifyContent: 'center',
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                className="form-input"
                type="tel"
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                placeholder="patient@email.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Known Allergies</label>
            <input
              className="form-input"
              type="text"
              value={form.allergies}
              onChange={e => update('allergies', e.target.value)}
              placeholder="e.g. Penicillin, Sulfa drugs (comma-separated)"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Existing Medical Conditions</label>
            <input
              className="form-input"
              type="text"
              value={form.medicalConditions}
              onChange={e => update('medicalConditions', e.target.value)}
              placeholder="e.g. Hypertension, Type 2 Diabetes (comma-separated)"
            />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-outline" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: 140 }}>
              {saving ? 'Saving...' : <><i className="fa-solid fa-check" /> Create Patient</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
