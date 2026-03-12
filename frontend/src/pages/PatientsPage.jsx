import React, { useState, useEffect, useCallback } from 'react';
import { patientsApi } from '../services/api';

function formatDateHebrew(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientAppts, setPatientAppts] = useState([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editData, setEditData] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await patientsApi.getAll(search || undefined);
      setPatients(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    const res = await patientsApi.getAppointments(patient.id);
    setPatientAppts(res.data);
  };

  const handleSaveEdit = async () => {
    await patientsApi.update(editData.id, editData);
    setShowEditForm(false);
    load();
    if (selectedPatient?.id === editData.id) {
      setSelectedPatient(editData);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>מטופלות</h2>
        <div className="search-bar">
          <span>🔍</span>
          <input
            type="text"
            placeholder="חיפוש לפי שם, טלפון, ת.ז."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="page-body" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Patient list */}
        <div className="card" style={{ flex: 1 }}>
          {loading ? (
            <div className="loading-center"><div className="spinner" /><span>טוען...</span></div>
          ) : patients.length === 0 ? (
            <div className="empty-state">
              <div className="icon">👩‍⚕️</div>
              <h3>אין מטופלות</h3>
              <p>מטופלות נוספות אוטומטית עם קביעת תור</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>שם מלא</th>
                    <th>טלפון</th>
                    <th>ת.ז.</th>
                    <th>קופת חולים</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map(p => (
                    <tr
                      key={p.id}
                      style={{
                        cursor: 'pointer',
                        background: selectedPatient?.id === p.id ? 'var(--primary-light)' : ''
                      }}
                      onClick={() => handleSelectPatient(p)}
                    >
                      <td style={{ fontWeight: 600 }}>{p.full_name}</td>
                      <td style={{ direction: 'ltr', textAlign: 'right' }}>{p.phone}</td>
                      <td>{p.id_number || '-'}</td>
                      <td>{p.hmo || '-'}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => { setEditData({ ...p }); setShowEditForm(true); }}
                        >
                          ✏️ עריכה
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Patient detail panel */}
        {selectedPatient && (
          <div className="card" style={{ width: 360, flexShrink: 0 }}>
            <div className="card-header">
              <span>👤 {selectedPatient.full_name}</span>
              <button className="btn-close" onClick={() => setSelectedPatient(null)}>×</button>
            </div>
            <div className="card-body">
              <table style={{ width: '100%', fontSize: 14 }}>
                <tbody>
                  {[
                    ['שם פרטי', selectedPatient.first_name],
                    ['טלפון', selectedPatient.phone],
                    ['ת.ז.', selectedPatient.id_number],
                    ['קופת חולים', selectedPatient.hmo],
                    ['אימייל', selectedPatient.email],
                    ['הערות', selectedPatient.notes]
                  ].filter(([, v]) => v).map(([k, v]) => (
                    <tr key={k}>
                      <td style={{ fontWeight: 600, paddingBottom: 8, color: 'var(--text-muted)', width: 120 }}>{k}</td>
                      <td style={{ paddingBottom: 8 }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {patientAppts.length > 0 && (
                <>
                  <div style={{ fontWeight: 700, margin: '16px 0 8px', fontSize: 13, color: 'var(--text-muted)' }}>
                    היסטוריית תורים
                  </div>
                  {patientAppts.slice(0, 5).map(a => (
                    <div key={a.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '6px 0',
                      borderBottom: '1px solid var(--border)',
                      fontSize: 13
                    }}>
                      <span>{formatDateHebrew(a.appointment_date)} {a.appointment_time}</span>
                      <span className={`badge badge-${a.status}`}>
                        {a.status === 'active' ? 'פעיל' : 'בוטל'}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {showEditForm && editData && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>עריכת פרטי מטופלת</h3>
              <button className="btn-close" onClick={() => setShowEditForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">שם מלא <span className="required">*</span></label>
                  <input className="form-control" value={editData.full_name}
                    onChange={e => setEditData(p => ({ ...p, full_name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">שם פרטי <span className="required">*</span></label>
                  <input className="form-control" value={editData.first_name}
                    onChange={e => setEditData(p => ({ ...p, first_name: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">טלפון <span className="required">*</span></label>
                  <input className="form-control" value={editData.phone}
                    onChange={e => setEditData(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">ת.ז.</label>
                  <input className="form-control" value={editData.id_number || ''}
                    onChange={e => setEditData(p => ({ ...p, id_number: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">קופת חולים</label>
                  <select className="form-control" value={editData.hmo || ''}
                    onChange={e => setEditData(p => ({ ...p, hmo: e.target.value }))}>
                    <option value="">בחר...</option>
                    <option>מכבי</option>
                    <option>מאוחדת</option>
                    <option>כללית</option>
                    <option>לאומית</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">אימייל</label>
                  <input className="form-control" value={editData.email || ''}
                    onChange={e => setEditData(p => ({ ...p, email: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">הערות</label>
                <textarea className="form-control" rows={3} value={editData.notes || ''}
                  onChange={e => setEditData(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleSaveEdit}>שמור</button>
              <button className="btn btn-secondary" onClick={() => setShowEditForm(false)}>ביטול</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
