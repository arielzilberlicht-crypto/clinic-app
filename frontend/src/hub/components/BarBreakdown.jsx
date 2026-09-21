import React from 'react';

// A breakdown table (category, totals, cancellation rate) with an inline
// proportional bar so it reads as both a table and a chart at a glance.
export default function BarBreakdown({ title, rows }) {
  const max = Math.max(1, ...rows.map(r => r.total));

  return (
    <div className="card">
      <div className="card-header"><span>{title}</span></div>
      {rows.length === 0 ? (
        <div className="empty-state" style={{ padding: 24 }}><p>אין נתונים</p></div>
      ) : (
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>קטגוריה</th>
                <th>סה"כ</th>
                <th>בוטלו</th>
                <th>אחוז ביטולים</th>
                <th style={{ width: '35%' }} />
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.key}>
                  <td>{row.key}</td>
                  <td>{row.total}</td>
                  <td>{row.cancelled}</td>
                  <td>{row.cancellationRate}%</td>
                  <td>
                    <div className="hub-bar-track">
                      <div className="hub-bar-fill" style={{ width: `${(row.total / max) * 100}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
