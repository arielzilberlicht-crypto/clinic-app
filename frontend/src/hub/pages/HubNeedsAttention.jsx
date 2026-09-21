import React, { useState, useEffect, useCallback } from 'react';
import hubApi from '../hubApi';

function formatDateTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });
  } catch {
    return iso;
  }
}

export default function HubNeedsAttention() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await hubApi.get('/needs-attention');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div className="page-header">
        <h2>דורש טיפול</h2>
        <button className="btn btn-secondary btn-sm" onClick={load}>🔄 רענן</button>
      </div>

      <div className="page-body">
        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading-center"><div className="spinner" /><span>טוען...</span></div>
        ) : data && (
          <>
            <div className="card">
              <div className="card-header">
                <span>⏳ ממתינים לתעודת זהות מעל 3 שעות</span>
                <span className="badge badge-pending">{data.idMissing.length}</span>
              </div>
              {data.idMissing.length === 0 ? (
                <div className="empty-state"><div className="icon">✅</div><p>אין תורים הממתינים לתעודת זהות</p></div>
              ) : (
                <div>
                  {data.idMissing.map((item, i) => (
                    <div key={i} className="appt-row" style={{ cursor: 'default' }}>
                      <div className="appt-info">
                        <div className="appt-name">{item.name || item.patientId || 'לא ידוע'}</div>
                        <div className="appt-phone">{item.phone} · תור: {formatDateTime(item.appointmentStart)}</div>
                      </div>
                      <span className="badge badge-pending">{item.hoursWaiting} שעות</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card" style={{ marginTop: 20 }}>
              <div className="card-header">
                <span>🚨 התראות פתוחות</span>
                {data.alertsAvailable && <span className="badge badge-pending">{data.openAlerts.length}</span>}
              </div>
              {!data.alertsAvailable ? (
                <div className="alert alert-info" style={{ margin: 16 }}>{data.note}</div>
              ) : data.openAlerts.length === 0 ? (
                <div className="empty-state"><div className="icon">✅</div><p>אין התראות פתוחות</p></div>
              ) : (
                <div className="table-wrapper" style={{ border: 'none' }}>
                  <table>
                    <thead>
                      <tr><th>זמן</th><th>סוג</th><th>מטופלת/טלפון</th><th>פירוט</th></tr>
                    </thead>
                    <tbody>
                      {data.openAlerts.map((a, i) => (
                        <tr key={i}>
                          <td>{formatDateTime(a.timestamp)}</td>
                          <td>{a.type}</td>
                          <td>{a.patientRef}</td>
                          <td>{a.text}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
