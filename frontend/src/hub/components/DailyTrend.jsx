import React from 'react';

// Dependency-free column chart: total bookings per day, with the cancelled
// share overlaid in a darker shade of the same bar.
export default function DailyTrend({ data }) {
  const max = Math.max(1, ...data.map(d => d.total));

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="card-header"><span>תורים לפי יום</span></div>
      <div className="card-body">
        {data.length === 0 ? (
          <div className="empty-state" style={{ padding: 24 }}><p>אין נתונים לחודש זה</p></div>
        ) : (
          <>
            <div className="hub-trend-chart">
              {data.map(d => {
                const totalHeightPct = (d.total / max) * 100;
                const cancelledHeightPct = d.total ? (d.cancelled / d.total) * totalHeightPct : 0;
                return (
                  <div
                    key={d.date}
                    className="hub-trend-col"
                    title={`${d.date}: ${d.total} תורים, ${d.cancelled} בוטלו`}
                  >
                    <div className="hub-trend-bar" style={{ height: `${totalHeightPct}%` }}>
                      {cancelledHeightPct > 0 && (
                        <div className="hub-trend-bar-cancelled" style={{ height: `${cancelledHeightPct}%` }} />
                      )}
                    </div>
                    <div className="hub-trend-day">{d.date.slice(-2)}</div>
                  </div>
                );
              })}
            </div>
            <div className="hub-legend">
              <span><i className="hub-legend-swatch total" /> נקבעו</span>
              <span><i className="hub-legend-swatch cancelled" /> בוטלו</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
