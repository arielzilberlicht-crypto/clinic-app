import React, { useState } from 'react';
import hubApi from '../hubApi';

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

// Reuses the same live-calendar fetch the feedback screen uses (/feedback/appointments) -
// this screen never sends anything itself, it only tags patients and drafts a message
// the doctor copies into WhatsApp by hand, so no separate Make scenario is needed.
const SOURCE_OPTIONS = [
  { key: 'friend_patient', label: 'המלצה מחברה או מטופלת', messageLabel: 'המלצת מטופלת' },
  { key: 'social', label: 'רשתות חברתיות (אינסטגרם / פייסבוק)', messageLabel: 'רשתות חברתיות' },
  { key: 'website', label: 'האתר שלי', messageLabel: 'האתר' },
  { key: 'medreviews_page', label: 'דף הביקורות MedReviews', messageLabel: 'MedReviews' },
  {
    key: 'professional',
    label: 'רופא/ה, מיילדת, פיזיותרפיסטית',
    hasDetail: true,
    detailKey: 'professionalDetail',
    detailPlaceholder: 'איזה איש מקצוע? (למשל: רופא מטפל, מיילדת X)',
    fallbackLabel: 'המלצת איש מקצוע'
  },
  {
    key: 'other',
    label: 'אחר',
    hasDetail: true,
    detailKey: 'otherDetail',
    detailPlaceholder: 'פרט...',
    fallbackLabel: 'אחר'
  }
];

function sourcePhrase(option, row) {
  if (option.hasDetail) {
    const detail = (row[option.detailKey] || '').trim();
    return detail || option.fallbackLabel;
  }
  return option.messageLabel;
}

function buildSummaryText(rows) {
  return rows
    .map(row => {
      const phrases = SOURCE_OPTIONS.filter(opt => row[opt.key]).map(opt => sourcePhrase(opt, row));
      if (phrases.length === 0) return null;
      return `${row.first_name} - דרך ${phrases.join(', ')}`;
    })
    .filter(Boolean)
    .join('\n');
}

export default function HubReferralSource() {
  const [date, setDate] = useState(getTodayStr());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [summary, setSummary] = useState('');
  const [copied, setCopied] = useState(false);

  const handleLoad = async () => {
    setLoading(true);
    setLoadError('');
    setLoaded(false);
    setSummary('');
    try {
      const res = await hubApi.get('/feedback/appointments', { params: { date } });
      const appts = res.data.appointments || [];
      setRows(appts.map(a => ({
        event_id: a.event_id,
        time: a.time,
        clinic: a.clinic,
        looksLikePatient: a.phone_valid,
        first_name: a.default_first_name || '',
        friend_patient: false,
        social: false,
        website: false,
        medreviews_page: false,
        professional: false,
        professionalDetail: '',
        other: false,
        otherDetail: ''
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
    setSummary('');
  };

  const handleBuildSummary = () => {
    setSummary(buildSummaryText(rows));
    setCopied(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('שגיאה בהעתקה - אפשר לסמן ולהעתיק ידנית מהתיבה');
    }
  };

  const anyMarked = rows.some(r => SOURCE_OPTIONS.some(opt => r[opt.key]));

  return (
    <>
      <div className="page-header">
        <h2>מקור הגעה</h2>
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
        {loadError && <div className="alert alert-error">{loadError}</div>}

        <div className="card">
          {!loaded ? (
            <div className="empty-state">
              <div className="icon">📋</div>
              <h3>בחר תאריך וטען רשימה</h3>
              <p>יוצגו כל האירועים שהיו ביומן בתאריך שנבחר, כדי לסמן מהיכן כל מטופלת הגיעה</p>
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
                    {SOURCE_OPTIONS.map(opt => <th key={opt.key}>{opt.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.event_id} style={{ opacity: r.looksLikePatient ? 1 : 0.5 }}>
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
                          onChange={e => updateRow(r.event_id, { first_name: e.target.value })}
                        />
                      </td>
                      {SOURCE_OPTIONS.map(opt => (
                        <td key={opt.key} style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={r[opt.key]}
                            onChange={e => updateRow(r.event_id, { [opt.key]: e.target.checked })}
                          />
                          {opt.hasDetail && r[opt.key] && (
                            <input
                              className="form-control"
                              style={{ minWidth: 140, marginTop: 4, fontSize: 12 }}
                              placeholder={opt.detailPlaceholder}
                              value={r[opt.detailKey]}
                              onChange={e => updateRow(r.event_id, { [opt.detailKey]: e.target.value })}
                            />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {loaded && rows.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary btn-lg" disabled={!anyMarked} onClick={handleBuildSummary}>
              📝 צור הודעה
            </button>
          </div>
        )}

        {summary && (
          <div className="card" style={{ marginTop: 16 }}>
            <h3>הודעה מוכנה להעתקה</h3>
            <textarea
              className="form-control"
              style={{ width: '100%', minHeight: 120, fontFamily: 'inherit' }}
              readOnly
              value={summary}
            />
            <div style={{ marginTop: 10 }}>
              <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
                {copied ? '✓ הועתק' : '📋 העתק'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
