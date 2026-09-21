import React, { useState, useEffect, useCallback, useMemo } from 'react';
import hubApi from '../hubApi';

export default function HubLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await hubApi.get('/leads');
      setLeads(res.data.leads);
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const statuses = useMemo(() => [...new Set(leads.map(l => l.status).filter(Boolean))], [leads]);
  const filtered = statusFilter ? leads.filter(l => l.status === statusFilter) : leads;

  return (
    <>
      <div className="page-header">
        <h2>לידים</h2>
        <button className="btn btn-secondary btn-sm" onClick={load}>🔄 רענן</button>
      </div>

      <div className="page-body">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="hub-filter-bar">
          <label className="hub-filter">
            <span>סטטוס</span>
            <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">הכל</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /><span>טוען...</span></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><div className="icon">📭</div><p>אין לידים</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>תאריך</th><th>שם</th><th>טלפון</th><th>סטטוס</th><th>נושא/מקור</th><th>הפך לתור</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead, i) => (
                  <tr key={i}>
                    <td>{lead.date}</td>
                    <td>{lead.name}</td>
                    <td style={{ direction: 'ltr', textAlign: 'right' }}>{lead.phone}</td>
                    <td>{lead.status}</td>
                    <td>{lead.subjectSource}</td>
                    <td>
                      {lead.booked ? (
                        <span className="badge badge-active">✓ נקבע תור</span>
                      ) : (
                        <span className="badge badge-pending">טרם</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
