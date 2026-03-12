import React, { useState, useEffect, useCallback } from 'react';
import { appointmentsApi } from '../services/api';
import AppointmentPanel from '../components/AppointmentPanel';
import AppointmentForm from '../components/AppointmentForm';

function formatDateHebrew(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appointmentsApi.getAll();
      setAppointments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = appointments.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.full_name?.toLowerCase().includes(q) ||
        a.phone?.includes(q) ||
        a.appointment_date?.includes(q)
      );
    }
    return true;
  });

  return (
    <>
      <div className="page-header">
        <h2>תורים</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="search-bar">
            <span>🔍</span>
            <input
              type="text"
              placeholder="חיפוש לפי שם, טלפון, תאריך..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-control"
            style={{ width: 140 }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="active">פעילים</option>
            <option value="cancelled">מבוטלים</option>
            <option value="all">הכל</option>
          </select>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            ➕ תור חדש
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="card">
          {loading ? (
            <div className="loading-center"><div className="spinner" /><span>טוען...</span></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🗓️</div>
              <h3>אין תורים</h3>
              <p>{search ? 'לא נמצאו תורים לפי החיפוש' : 'לחץ "+ תור חדש" להוספה'}</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>תאריך</th>
                    <th>שעה</th>
                    <th>שם מלא</th>
                    <th>טלפון</th>
                    <th>סטטוס</th>
                    <th>אישור נשלח</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(appt => (
                    <tr key={appt.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedAppt(appt)}>
                      <td>{formatDateHebrew(appt.appointment_date)}</td>
                      <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                        {appt.appointment_time}
                      </td>
                      <td style={{ fontWeight: 600 }}>{appt.full_name}</td>
                      <td style={{ direction: 'ltr', textAlign: 'right' }}>{appt.phone}</td>
                      <td>
                        <span className={`badge badge-${appt.status}`}>
                          {appt.status === 'active' ? 'פעיל' : 'בוטל'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${appt.confirmation_sent ? 'badge-sent' : 'badge-pending'}`}>
                          {appt.confirmation_sent ? '✓ נשלח' : 'טרם נשלח'}
                        </span>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedAppt(appt)}
                          >
                            פרטים
                          </button>
                          {appt.status === 'active' && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={async () => {
                                if (!confirm('לבטל את התור?')) return;
                                await appointmentsApi.cancel(appt.id);
                                load();
                              }}
                            >
                              ביטול
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedAppt && (
        <AppointmentPanel
          appointment={selectedAppt}
          onClose={() => setSelectedAppt(null)}
          onCancel={async () => {
            await appointmentsApi.cancel(selectedAppt.id);
            setSelectedAppt(null);
            load();
          }}
          onUpdate={load}
        />
      )}

      {showForm && (
        <AppointmentForm
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); load(); }}
        />
      )}
    </>
  );
}
