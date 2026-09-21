import React, { useState, useEffect, useCallback } from 'react';
import hubApi from '../hubApi';

function formatTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString('he-IL', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

const STATUS_LABEL = { SCHEDULED: 'מתוכנן', CANCELLED: 'בוטל' };

export default function HubToday() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await hubApi.get('/today');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const clinics = data ? Object.entries(data.byClinic) : [];

  return (
    <>
      <div className="page-header">
        <h2>תורים היום{data ? ` · ${data.date}` : ''}</h2>
        <button className="btn btn-secondary btn-sm" onClick={load}>🔄 רענן</button>
      </div>

      <div className="page-body">
        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading-center"><div className="spinner" /><span>טוען...</span></div>
        ) : clinics.length === 0 ? (
          <div className="empty-state"><div className="icon">📭</div><h3>אין תורים היום</h3></div>
        ) : (
          clinics.map(([clinicName, appts]) => (
            <div key={clinicName} className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <span>{clinicName}</span>
                <span className="badge badge-sent">{appts.length}</span>
              </div>
              <div>
                {appts.map((a, i) => (
                  <div key={i} className="appt-row" style={{ cursor: 'default' }}>
                    <div className="appt-time">{formatTime(a.appointmentStart)}</div>
                    <div className="appt-info">
                      <div className="appt-name">{a.name || a.patientId}</div>
                      <div className="appt-phone">{a.phone} · {a.insurer}</div>
                    </div>
                    <span className={`badge ${a.status === 'CANCELLED' ? 'badge-cancelled' : 'badge-active'}`}>
                      {STATUS_LABEL[a.status] || a.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
