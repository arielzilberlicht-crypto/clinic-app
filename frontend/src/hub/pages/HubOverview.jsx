import React, { useState, useEffect, useCallback } from 'react';
import hubApi from '../hubApi';
import BarBreakdown from '../components/BarBreakdown';
import DailyTrend from '../components/DailyTrend';

const INSURERS = ['מכבי', 'כללית', 'לאומית', 'מאוחדת', 'פרטי'];
const CLINICS = ['חיפה', 'תל אביב'];
const SOURCES = [
  { value: 'SHIDURIT', label: 'שידורית' },
  { value: 'MANUAL_CALENDAR', label: 'יומן ידני' }
];

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function HubOverview() {
  const [month, setMonth] = useState(currentMonthValue());
  const [insurer, setInsurer] = useState('');
  const [clinic, setClinic] = useState('');
  const [source, setSource] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await hubApi.get('/overview', { params: { month, insurer, clinic, source } });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  }, [month, insurer, clinic, source]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div className="page-header">
        <h2>סקירה כללית</h2>
      </div>

      <div className="page-body">
        <div className="hub-filter-bar">
          <label className="hub-filter">
            <span>חודש</span>
            <input type="month" className="form-control" value={month} onChange={e => setMonth(e.target.value)} />
          </label>
          <label className="hub-filter">
            <span>קופת חולים</span>
            <select className="form-control" value={insurer} onChange={e => setInsurer(e.target.value)}>
              <option value="">הכל</option>
              {INSURERS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </label>
          <label className="hub-filter">
            <span>מרפאה</span>
            <select className="form-control" value={clinic} onChange={e => setClinic(e.target.value)}>
              <option value="">הכל</option>
              {CLINICS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="hub-filter">
            <span>מקור</span>
            <select className="form-control" value={source} onChange={e => setSource(e.target.value)}>
              <option value="">הכל</option>
              {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading-center"><div className="spinner" /><span>טוען...</span></div>
        ) : data && (
          <>
            <div className="stats-grid">
              <div className="stat-card blue">
                <div className="stat-label">תורים נקבעו</div>
                <div className="stat-value">{data.totals.total}</div>
                <div className="stat-sub">{data.month}</div>
              </div>
              <div className="stat-card orange">
                <div className="stat-label">ביטולים</div>
                <div className="stat-value">{data.totals.cancelled}</div>
                <div className="stat-sub">מתוך {data.totals.total}</div>
              </div>
              <div className="stat-card purple">
                <div className="stat-label">אחוז ביטולים</div>
                <div className="stat-value">{data.totals.cancellationRate}%</div>
              </div>
            </div>

            <DailyTrend data={data.byDay} />

            <div className="hub-grid-2" style={{ marginTop: 20 }}>
              <BarBreakdown title="לפי קופת חולים" rows={data.byInsurer} />
              <BarBreakdown title="לפי מרפאה" rows={data.byClinic} />
            </div>
            <div style={{ marginTop: 20 }}>
              <BarBreakdown title="לפי מקור" rows={data.bySource} />
            </div>
          </>
        )}
      </div>
    </>
  );
}
