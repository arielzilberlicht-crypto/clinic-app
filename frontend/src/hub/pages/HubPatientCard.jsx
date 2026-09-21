import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import hubApi from '../hubApi';
import { useHubAuth } from '../HubAuthContext';

function formatDateTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });
  } catch {
    return iso;
  }
}

export default function HubPatientCard() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useHubAuth();
  const [searchValue, setSearchValue] = useState(patientId || '');
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [revealedId, setRevealedId] = useState(null);
  const [revealing, setRevealing] = useState(false);

  const load = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    setError('');
    setCard(null);
    setRevealedId(null);
    try {
      const res = await hubApi.get(`/patients/${encodeURIComponent(id)}`);
      setCard(res.data);
    } catch (err) {
      setError(err.response?.status === 404 ? 'מטופלת לא נמצאה' : (err.response?.data?.error || 'שגיאה בטעינת הנתונים'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (patientId) load(patientId); }, [patientId, load]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchValue.trim()) navigate(`/hub/patients/${encodeURIComponent(searchValue.trim())}`);
  };

  const handleReveal = async () => {
    setRevealing(true);
    setError('');
    try {
      const res = await hubApi.post(`/patients/${encodeURIComponent(patientId)}/reveal-id`);
      setRevealedId(res.data.idNumber);
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה בחשיפת תעודת זהות');
    } finally {
      setRevealing(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>כרטיס מטופלת</h2>
      </div>

      <div className="page-body">
        <form onSubmit={handleSearch} className="search-bar" style={{ marginBottom: 20, maxWidth: 360 }}>
          <input
            placeholder="מזהה מטופלת (PAT-...)"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
          />
          <button className="btn btn-primary btn-sm" type="submit">חיפוש</button>
        </form>

        {error && <div className="alert alert-error">{error}</div>}
        {loading && <div className="loading-center"><div className="spinner" /><span>טוען...</span></div>}

        {card && (
          <>
            <div className="card">
              <div className="card-header"><span>פרטי מטופלת</span></div>
              <div className="card-body">
                <p><strong>שם:</strong> {card.name || '-'}</p>
                <p><strong>מזהה:</strong> {card.patientId}</p>
                <p style={{ direction: 'ltr', textAlign: 'right' }}><strong>טלפון:</strong> {card.phone || '-'}</p>
                <p>
                  <strong>תעודת זהות:</strong>{' '}
                  <span style={{ fontFamily: 'monospace', direction: 'ltr', display: 'inline-block' }}>
                    {revealedId || card.idNumberMasked || '-'}
                  </span>
                  {card.idNumberValid === false && (
                    <span className="badge badge-cancelled" style={{ marginRight: 8 }}>ספרת ביקורת לא תקינה</span>
                  )}
                  {user?.role === 'DOCTOR' && !revealedId && card.idNumberMasked && (
                    <button className="btn btn-secondary btn-sm" style={{ marginRight: 8 }} onClick={handleReveal} disabled={revealing}>
                      {revealing ? 'חושף...' : '👁️ חשיפה'}
                    </button>
                  )}
                </p>
              </div>
            </div>

            <div className="card" style={{ marginTop: 20 }}>
              <div className="card-header"><span>היסטוריית תורים</span></div>
              {card.appointments.length === 0 ? (
                <div className="empty-state"><p>אין תורים</p></div>
              ) : (
                <div className="table-wrapper" style={{ border: 'none' }}>
                  <table>
                    <thead><tr><th>תאריך</th><th>מרפאה</th><th>קופת חולים</th><th>מקור</th><th>סטטוס</th></tr></thead>
                    <tbody>
                      {card.appointments.map((a, i) => (
                        <tr key={i}>
                          <td>{formatDateTime(a.appointmentStart)}</td>
                          <td>{a.clinic || '-'}</td>
                          <td>{a.insurer}</td>
                          <td>{a.source}</td>
                          <td>{a.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card" style={{ marginTop: 20 }}>
              <div className="card-header"><span>יומן תקשורת</span></div>
              {card.communications.length === 0 ? (
                <div className="empty-state"><p>אין הודעות</p></div>
              ) : (
                <div className="table-wrapper" style={{ border: 'none' }}>
                  <table>
                    <thead><tr><th>זמן</th><th>כיוון</th><th>סוג</th><th>סטטוס</th></tr></thead>
                    <tbody>
                      {card.communications.map((c, i) => (
                        <tr key={i}>
                          <td>{formatDateTime(c.time)}</td>
                          <td>{c.direction}</td>
                          <td>{c.type}</td>
                          <td>{c.status}</td>
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
