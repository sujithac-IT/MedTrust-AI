// MediTrust AI — 17-Section Clinical Case Sheet Editor
// Full editable case-sheet with AI disclaimer, section editing, medications table,
// multilingual summary, voice playback, and approval actions.

import { useState } from 'react';
import { CASE_SHEET_SECTIONS } from '../types/consultation';
import { generateCaseSheetSummary } from '../services/geminiService';
import {
  SUPPORTED_LANGUAGES, translateSummary, speakText, stopSpeaking,
} from '../utils/gemini';

export default function CaseSheetEditor({
  caseSheet,
  consultation,
  patient,
  doctor,
  onUpdate,
  onApprove,
  onRegenerate,
  onSaveDraft,
  isApproved = false,
}) {
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);

  if (!caseSheet) return null;

  const data = editData || caseSheet;

  // Generate summary for multilingual translation
  const summary = generateCaseSheetSummary(data);

  const startEditing = () => {
    setEditData(JSON.parse(JSON.stringify(caseSheet)));
    setEditMode(true);
  };

  const cancelEditing = () => {
    setEditData(null);
    setEditMode(false);
  };

  const saveEdits = () => {
    onUpdate?.(editData);
    setEditMode(false);
    setEditData(null);
  };

  const updateField = (key, value) => {
    setEditData(prev => ({ ...prev, [key]: value }));
  };

  const updateListItem = (key, index, value) => {
    setEditData(prev => {
      const list = [...(prev[key] || [])];
      list[index] = value;
      return { ...prev, [key]: list };
    });
  };

  const addListItem = (key) => {
    setEditData(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), ''],
    }));
  };

  const removeListItem = (key, index) => {
    setEditData(prev => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));
  };

  const updateMedication = (index, field, value) => {
    setEditData(prev => {
      const meds = [...(prev.medications || [])];
      meds[index] = { ...meds[index], [field]: value };
      return { ...prev, medications: meds };
    });
  };

  const addMedication = () => {
    setEditData(prev => ({
      ...prev,
      medications: [...(prev.medications || []), { medicine: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    }));
  };

  const removeMedication = (index) => {
    setEditData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }));
  };

  // Voice playback
  const handlePlay = () => {
    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      const utt = speakText(summary, selectedLanguage);
      if (utt) utt.onend = () => setIsPlaying(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderSection = (section) => {
    const value = data[section.key];

    // Patient details handled specially
    if (section.key === 'patient_details') {
      const pd = value || {};
      return (
        <div className="cs-section" key={section.key}>
          <div className="cs-section-title">{section.label}</div>
          <div className="cs-patient-grid">
            {[
              ['Name', patient?.name || pd.name || 'Not mentioned'],
              ['Age', patient?.age || pd.age || 'Not mentioned'],
              ['Gender', patient?.gender || pd.gender || 'Not mentioned'],
              ['Patient ID', patient?.id || consultation?.patientId || '—'],
            ].map(([label, val]) => (
              <div key={label} className="cs-patient-item">
                <div className="cs-patient-label">{label}</div>
                <div className="cs-patient-value">{val}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Medications table
    if (section.type === 'medications') {
      const meds = value || [];
      return (
        <div className="cs-section" key={section.key}>
          <div className="cs-section-title">{section.label}</div>
          {meds.length === 0 ? (
            <div className="cs-empty">No medications recorded</div>
          ) : (
            <table className="med-table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                  <th>Instructions</th>
                  {editMode && <th style={{ width: 40 }}></th>}
                </tr>
              </thead>
              <tbody>
                {meds.map((m, i) => (
                  <tr key={i}>
                    {['medicine', 'dosage', 'frequency', 'duration', 'instructions'].map(field => (
                      <td key={field}>
                        {editMode ? (
                          <input value={m[field] || ''} onChange={e => updateMedication(i, field, e.target.value)} />
                        ) : (
                          <span style={{ fontWeight: field === 'medicine' ? 600 : 400 }}>{m[field] || '—'}</span>
                        )}
                      </td>
                    ))}
                    {editMode && (
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => removeMedication(i)} style={{ color: 'var(--red)', padding: 4 }}>
                          <i className="fa-solid fa-xmark" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {editMode && (
            <button className="btn btn-ghost btn-sm" onClick={addMedication} style={{ marginTop: 8 }}>
              <i className="fa-solid fa-plus" /> Add Medication
            </button>
          )}
        </div>
      );
    }

    // List type
    if (section.type === 'list') {
      const items = Array.isArray(value) ? value : [value].filter(Boolean);
      const sectionClass = section.style === 'warning' ? 'cs-section cs-section-warning' :
                          section.style === 'caution' ? 'cs-section cs-section-caution' : 'cs-section';
      return (
        <div className={sectionClass} key={section.key}>
          <div className="cs-section-title">
            {section.style === 'warning' && <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--amber)', marginRight: 6 }} />}
            {section.style === 'caution' && <i className="fa-solid fa-circle-question" style={{ color: 'var(--purple)', marginRight: 6 }} />}
            {section.label}
          </div>
          {items.length === 0 ? (
            <div className="cs-empty">Not mentioned in consultation</div>
          ) : editMode ? (
            <div>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <input
                    className="form-input"
                    value={item}
                    onChange={e => updateListItem(section.key, i, e.target.value)}
                    style={{ flex: 1, padding: '6px 10px', fontSize: '.85rem' }}
                  />
                  <button className="btn btn-ghost btn-sm" onClick={() => removeListItem(section.key, i)} style={{ color: 'var(--red)', padding: 4 }}>
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm" onClick={() => addListItem(section.key)} style={{ marginTop: 4 }}>
                <i className="fa-solid fa-plus" /> Add Item
              </button>
            </div>
          ) : (
            <ul className="cs-list">
              {items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    // Text type
    return (
      <div className="cs-section" key={section.key}>
        <div className="cs-section-title">{section.label}</div>
        {editMode ? (
          <textarea
            className="form-textarea cs-textarea"
            value={value || ''}
            onChange={e => updateField(section.key, e.target.value)}
            rows={3}
          />
        ) : (
          <div className="cs-text">
            {value || <span className="cs-empty">Not mentioned in consultation</span>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`case-sheet-editor ${showPrintView ? 'print-mode' : ''}`}>
      {/* AI Disclaimer */}
      {!isApproved && (
        <div className="ai-disclaimer" style={{ marginBottom: 20 }}>
          <i className="fa-solid fa-triangle-exclamation" />
          <span>AI-generated documentation. Doctor review and approval required.</span>
        </div>
      )}

      {/* Case Sheet Document */}
      <div className="case-sheet" id="printable-case-sheet">
        {/* Header */}
        <div className="case-sheet-header">
          <div style={{ fontSize: '.68rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 4 }}>
            Clinical Case Sheet
          </div>
          <h2 style={{ fontSize: '1.2rem', margin: '4px 0', color: 'var(--text)' }}>
            {doctor?.hospital || 'MediTrust AI Health Institute'}
          </h2>
          <div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>
            {doctor?.name || 'Doctor'} · {doctor?.specialty || 'General Medicine'} · {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          {consultation?.id && (
            <div style={{ fontSize: '.72rem', color: 'var(--text3)', marginTop: 4 }}>
              Consultation ID: {consultation.id}
            </div>
          )}
          {isApproved && (
            <div className="cs-approved-badge">
              <i className="fa-solid fa-check-double" /> Doctor Approved
            </div>
          )}
        </div>

        {/* All 17 Sections */}
        {CASE_SHEET_SECTIONS.map(section => renderSection(section))}

        {/* Source Attribution */}
        <div className="cs-footer">
          <div>Generated by MediTrust AI Clinical Documentation System</div>
          <div>AI-generated content requires physician review and approval</div>
          <div style={{ fontSize: '.7rem', marginTop: 4, color: 'var(--text3)' }}>
            {new Date().toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Multilingual Summary & Voice */}
      {!showPrintView && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>
            <i className="fa-solid fa-language" style={{ color: 'var(--primary)', marginRight: 8 }} />
            Summary & Voice
          </div>

          <div className="lang-selector" style={{ marginBottom: 12 }}>
            {SUPPORTED_LANGUAGES.map(lang => (
              <button
                key={lang.code}
                className={`lang-option ${selectedLanguage === lang.code ? 'active' : ''}`}
                onClick={() => setSelectedLanguage(lang.code)}
              >
                {lang.nativeLabel}
              </button>
            ))}
          </div>

          <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 14, fontSize: '.88rem', lineHeight: 1.7, marginBottom: 12 }}>
            {summary}
          </div>

          <div className="audio-player">
            <button className="audio-player-btn" onClick={handlePlay}>
              <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`} />
            </button>
            <div>
              <div style={{ fontSize: '.82rem', fontWeight: 600 }}>Voice Summary</div>
              <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>
                {selectedLanguage} · Click to {isPlaying ? 'pause' : 'play'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Bar */}
      {!showPrintView && (
        <div className="cs-actions">
          {!isApproved ? (
            <>
              {editMode ? (
                <>
                  <button className="btn btn-outline" onClick={cancelEditing}>
                    <i className="fa-solid fa-xmark" /> Cancel
                  </button>
                  <button className="btn btn-primary" onClick={saveEdits}>
                    <i className="fa-solid fa-check" /> Save Changes
                  </button>
                </>
              ) : (
                <button className="btn btn-outline" onClick={startEditing}>
                  <i className="fa-solid fa-pen" /> Edit
                </button>
              )}
              <button className="btn btn-outline" onClick={onSaveDraft}>
                <i className="fa-solid fa-floppy-disk" /> Save Draft
              </button>
              <button className="btn btn-outline" onClick={onRegenerate}>
                <i className="fa-solid fa-rotate" /> Regenerate
              </button>
              <button className="btn btn-outline" onClick={handlePrint}>
                <i className="fa-solid fa-print" /> Print
              </button>
              <button className="btn btn-secondary btn-lg" onClick={onApprove} style={{ marginLeft: 'auto' }}>
                <i className="fa-solid fa-check-double" /> Approve Case Sheet
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-outline" onClick={handlePrint}>
                <i className="fa-solid fa-print" /> Print
              </button>
              <span className="badge badge-green" style={{ padding: '8px 16px', fontSize: '.85rem' }}>
                <i className="fa-solid fa-check" /> Approved & Saved
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
