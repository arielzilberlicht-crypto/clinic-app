import React, { useState, useEffect } from 'react';
import { feedbackApi } from '../services/api';

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function FeedbackPage() {
  const [date, setDate] = useState(getTodayStr());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [testMode, setTestMode] = useState(true);
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    feedbackApi.getSettings()
      .then(r => setTestMode(r.data.testMode))
      .catch(() => {});
  }, []);

  const handleLoad = async () => {
    setLoading(true);
    setLoadError('');
    setLoaded(false);
    try {
      const res = await feedbackApi.getAppointments(date);
      const appts = res.data.appointments || [];
      setRows(appts.map(a => ({
        event_id: a.event_id,
        time: a.time,
        clinic: a.clinic,
        phone: a.phone,
        phone_valid: a.phone_valid,
        first_name: a.default_first_name || '',
        medreviews: false,
        google_haifa: false,
        google_tlv: false,
        status: null,
        statusReason: null
      })));
      setLoaded(true);
    } catch (err) {
      setLoadError(err.response?.data?.error || 'שגיאה בטעינת הרשימה');
    } finally {
      setLoading(false);
    }
  };

  const updateRow = (eventId, patch) => {
    setRows(prev => prev.map(r => r.event_id === eventId ? { ...r, ...patch } : r));
  };

  const toggleTestMode = async () => {
    if (testMode && !confirm('לכבות את מצב הבדיקה? מעכשיו ההודעות יישלחו למספרים האמיתיים של המטופלות.')) {
      return;
    }
    try {
      const res = await feedbackApi.updateSettings({ testMode: !testMode });
      setTestMode(res.data.testMode);
    } catch {
      alert('שגיאה בעדכון מצב הבדיקה');
    }
  };

  const selectedRows = rows.filter(r => r.medreviews || r.google_haifa || r.google_tlv);
  const summary = selectedRows.reduce((acc, r) => {
    if (r.medreviews) acc.medreviews++;
    if (r.google_haifa) acc.googleHaifa++;
    if (r.google_tlv) acc.googleTlv++;
    return acc;
  }, { medreviews: 0, googleHaifa: 0, googleTlv: 0 });

  const canSend = selectedRows.length > 0 && !sending;

  const handleSend = async () => {
    setSending(true);
    setShowConfirm(false);
    try {
      const items = selectedRows.map(r => ({
        event_id: r.event_id,
        first_name: r.first_name,
        phone: r.phone,
        medreviews: r.medreviews,
        google_haifa: r.google_haifa,
        google_tlv: r.google_tlv
      }));
      const res = await feedbackApi.send({ date, items });
      const statusById = {};
      for (const result of res.data.results || []) statusById[result.event_id] = result;

      setRows(prev => prev.map(row => statusById[row.event_id]
        ? { ...row, status: statusById[row.event_id].status, statusReason: statusById[row.event_id].reason }
        : row));
    } catch (err) {
      alert(err.response?.data?.error || 'שגיאה בשליחה');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>שליחת משובים</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="date"
            className="form-control"
            style={{ width: 160 }}
            value={date}
            onChange={e => setDate(e.target.value)}
          />
          <button className="btn btn-primary btn-sm" onClick={handleLoad} disabled={loading}>
            {loading ? '⏳ טוען...' : '📋 טען רשימה'}
          </button>
        </div>
      </div>

      <div className="page-body">
        {testMode ? (
          <div className="alert alert-warning">
            <span>⚠️</span>
            <div style={{ flex: 1 }}>מצב בדיקה פעיל - כל ההודעות נשלחות למספר הבדיקה בלבד.</div>
            <button className="btn btn-secondary btn-sm" onClick={toggleTestMode}>כבה מצב בדיקה</button>
          </div>
        ) : (
          <div className="alert alert-error">
            <span>🔴</span>
            <div style={{ flex: 1 }}>מצב בדיקה כבוי - הודעות נשלחות למספרים האמיתיים של המטופלות.</div>
            <button className="btn btn-secondary btn-sm" onClick={toggleTestMode}>הפעל מצב בדיקה</button>
          </div>
        )}

        {loadError && <div className="alert alert-error">{loadError}</div>}

        <div className="card">
          {!loaded ? (
            <div className="empty-state">
              <div className="icon">📋</div>
              <h3>בחר תאריך וטען רשימה</h3>
              <p>יוצגו כל האירועים שהיו ביומן בתאריך שנבחר</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📭</div>
              <h3>אין תורים בתאריך זה</h3>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>שעה</th>
                    <th>מרפאה</th>
                    <th>שם פרטי</th>
                    <th>טלפון</th>
                    <th>MedReviews</th>
                    <th>ביקורת חיפה</th>
                    <th>ביקורת ת״א</th>
                    <th>סטטוס</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.event_id} style={{ opacity: r.phone_valid ? 1 : 0.5 }}>
                      <td style={{ fontVariantNumeric: 'tabular-nums' }}>{r.time}</td>
                      <td>
                        {r.clinic === '?'
                          ? <span className="badge badge-pending" title="לא ברור מהשעה לאיזו מרפאה">?</span>
                          : r.clinic}
                      </td>
                      <td>
                        <input
                          className="form-control"
                          style={{ minWidth: 100 }}
                          value={r.first_name}
                          disabled={!r.phone_valid}
                          onChange={e => updateRow(r.event_id, { first_name: e.target.value })}
                        />
                      </td>
                      <td style={{ direction: 'ltr', textAlign: 'right', fontSize: 13 }}>
                        {r.phone_valid ? r.phone : 'אין נייד בכותרת האירוע'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          disabled={!r.phone_valid}
                          checked={r.medreviews}
                          onChange={e => updateRow(r.event_id, { medreviews: e.target.checked })}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          disabled={!r.phone_valid}
                          checked={r.google_haifa}
                          onChange={e => updateRow(r.event_id, { google_haifa: e.target.checked })}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          disabled={!r.phone_valid}
                          checked={r.google_tlv}
                          onChange={e => updateRow(r.event_id, { google_tlv: e.target.checked })}
                        />
                      </td>
                      <td>
                        {r.status === 'sent' && <span className="badge badge-active">✓ נשלח</span>}
                        {r.status === 'failed' && (
                          <span className="badge badge-cancelled" title={r.statusReason || ''}>✗ נכשל</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {loaded && rows.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <button
              className="btn btn-primary btn-lg"
              disabled={!canSend}
              onClick={() => setShowConfirm(true)}
            >
              {sending ? '⏳ שולח...' : '📤 שלח'}
            </button>
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>אישור שליחה</h3>
              <button className="btn-close" onClick={() => setShowConfirm(false)}>×</button>
            </div>
            <div className="modal-body">
              {testMode && (
                <div className="alert alert-warning">
                  מצב בדיקה פעיל - כל ההודעות יישלחו למספר הבדיקה בלבד, לא למטופלות עצמן.
                </div>
              )}
              <p>
                {summary.medreviews} הודעות ל-MedReviews, {summary.googleHaifa} ביקורות חיפה, {summary.googleTlv} ביקורות תל אביב.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleSend}>אשר ושלח</button>
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>ביטול</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
