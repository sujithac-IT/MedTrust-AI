import { useState } from 'react';
import { ToastContainer, showToast } from '../components/Toast';

const DEMO_RX_QUEUE = [
  { id: 'RX-8891', patient: 'Rahul Sharma', doctor: 'Dr. Arjun Mehta', items: ['Amlodipine 5mg x 30', 'Atorvastatin 20mg x 30'], status: 'Ready to Dispense', urgent: false },
  { id: 'RX-8892', patient: 'Ravi Kumar', doctor: 'Dr. Priya Nair', items: ['Metformin 500mg x 60', 'Insulin Glargine Pen x 2'], status: 'Processing', urgent: true },
  { id: 'RX-8893', patient: 'Meena Patel', doctor: 'Dr. Rajesh Verma', items: ['Amoxicillin 500mg x 15', 'Paracetamol 650mg x 10'], status: 'Pending Verification', urgent: false },
];

const INVENTORY = [
  { name: 'Amlodipine Besylate 5mg', category: 'Cardiovascular', stock: 450, unit: 'Tablets', status: 'In Stock', color: 'green' },
  { name: 'Atorvastatin Calcium 20mg', category: 'Statin', stock: 120, unit: 'Tablets', status: 'Low Stock', color: 'amber' },
  { name: 'Metformin HCl 500mg', category: 'Antidiabetic', stock: 800, unit: 'Tablets', status: 'In Stock', color: 'green' },
  { name: 'Amoxicillin 500mg', category: 'Antibiotic', stock: 45, unit: 'Capsules', status: 'Reorder Now', color: 'red' },
];

export default function PharmacistDashboard() {
  const [rxQueue, setRxQueue] = useState(DEMO_RX_QUEUE);
  const [drugA, setDrugA] = useState('Warfarin');
  const [drugB, setDrugB] = useState('Aspirin');
  const [interactionResult, setInteractionResult] = useState(null);

  const handleDispense = (id) => {
    setRxQueue(prev => prev.map(r => r.id === id ? { ...r, status: 'Dispensed ✅' } : r));
    showToast(`💊 Prescription ${id} scanned & dispensed to patient!`, 'success');
  };

  const checkInteractions = () => {
    if ((drugA.toLowerCase().includes('warfarin') && drugB.toLowerCase().includes('aspirin')) ||
        (drugB.toLowerCase().includes('warfarin') && drugA.toLowerCase().includes('aspirin'))) {
      setInteractionResult({
        severity: 'High Warning ⚠️',
        desc: 'Concomitant use of Warfarin and Aspirin significantly increases risk of major gastrointestinal and systemic bleeding.',
        advice: 'Avoid combination unless specifically requested by Cardiologist with INR monitoring.'
      });
    } else {
      setInteractionResult({
        severity: 'Safe / Low Interaction ✓',
        desc: `No severe clinical contraindications found between ${drugA} and ${drugB}.`,
        advice: 'Standard dosage instructions apply.'
      });
    }
    showToast('AI Drug Interaction check complete.', 'info');
  };

  return (
    <div className="page" style={{ background: 'var(--bg)' }}>
      <ToastContainer />
      <div className="content-grid">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: '.84rem', color: 'var(--text2)' }}>Hospital Central Pharmacy · License #PH-2024-912</div>
            <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Pharmacy Command & Dispensing 💊</h1>
            <div style={{ fontSize: '.84rem', color: 'var(--text2)', marginTop: 4 }}>Chief Pharmacist Rajesh Kannan · Apollo Hospital</div>
          </div>
          <span className="badge badge-blue" style={{ fontSize: '.9rem', padding: '8px 14px' }}>
            {rxQueue.filter(r => r.status !== 'Dispensed ✅').length} Prescriptions Pending
          </span>
        </div>

        <div className="dash-grid">
          {/* Main Dispense Queue */}
          <div className="dash-main">
            <div className="card">
              <h3 style={{ marginTop: 0, fontSize: '1.05rem', marginBottom: 16 }}>📋 Digital Prescription Dispense Queue</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {rxQueue.map(rx => (
                  <div key={rx.id} style={{ padding: 14, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <strong style={{ fontSize: '.95rem' }}>{rx.id}</strong>
                        {rx.urgent && <span className="badge badge-red pulse">Urgent</span>}
                        <span className={`badge badge-${rx.status.includes('Dispensed') ? 'green' : 'blue'}`}>{rx.status}</span>
                      </div>
                      <div style={{ fontSize: '.85rem', fontWeight: 600, marginTop: 4 }}>Patient: {rx.patient} · Prescribed by {rx.doctor}</div>
                      <div style={{ fontSize: '.78rem', color: 'var(--text2)', marginTop: 4 }}>Items: {rx.items.join(' | ')}</div>
                    </div>
                    <button
                      className={`btn ${rx.status.includes('Dispensed') ? 'btn-outline' : 'btn-primary'}`}
                      onClick={() => handleDispense(rx.id)}
                      disabled={rx.status.includes('Dispensed')}
                    >
                      <i className="fa-solid fa-barcode"></i> {rx.status.includes('Dispensed') ? 'Dispensed' : 'Scan & Dispense'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Inventory Tracker */}
            <div className="card">
              <h3 style={{ marginTop: 0, fontSize: '1.05rem', marginBottom: 14 }}>📦 Drug Stock & Inventory Management</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Medication Name</th>
                    <th>Category</th>
                    <th>Stock Quantity</th>
                    <th>Stock Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {INVENTORY.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700 }}>{item.name}</td>
                      <td>{item.category}</td>
                      <td>{item.stock} {item.unit}</td>
                      <td><span className={`badge badge-${item.color}`}>{item.status}</span></td>
                      <td>
                        <button className="btn btn-sm btn-outline" onClick={() => showToast(`Reorder request sent for ${item.name}`, 'info')}>
                          Reorder
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar: AI Drug Interaction Checker */}
          <div className="dash-sidebar">
            <div className="card">
              <h3 style={{ marginTop: 0, fontSize: '1rem', marginBottom: 12 }}>🤖 AI Drug Interaction Checker</h3>
              <p style={{ fontSize: '.78rem', color: 'var(--text2)', marginBottom: 14 }}>Check contraindications between co-prescribed drugs.</p>

              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: '.75rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Drug 1</label>
                <input className="input-field" value={drugA} onChange={e => setDrugA(e.target.value)} placeholder="e.g. Warfarin" />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: '.75rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Drug 2</label>
                <input className="input-field" value={drugB} onChange={e => setDrugB(e.target.value)} placeholder="e.g. Aspirin" />
              </div>

              <button className="btn btn-primary w-full" onClick={checkInteractions} style={{ justifyContent: 'center', marginBottom: 14 }}>
                <i className="fa-solid fa-flask"></i> Run AI Check
              </button>

              {interactionResult && (
                <div style={{ padding: 12, borderRadius: 8, background: interactionResult.severity.includes('Warning') ? '#fef2f2' : '#f0fdf4', border: '1px solid ' + (interactionResult.severity.includes('Warning') ? '#fecaca' : '#bbf7d0') }}>
                  <div style={{ fontWeight: 700, fontSize: '.84rem', color: interactionResult.severity.includes('Warning') ? '#991b1b' : '#166534', marginBottom: 4 }}>
                    {interactionResult.severity}
                  </div>
                  <div style={{ fontSize: '.78rem', color: '#374151', lineHeight: 1.4, marginBottom: 6 }}>{interactionResult.desc}</div>
                  <div style={{ fontSize: '.72rem', color: '#6b7280' }}><strong>Pharmacist Note:</strong> {interactionResult.advice}</div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
