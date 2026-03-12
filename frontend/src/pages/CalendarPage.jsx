import React, { useState, useEffect, useCallback } from 'react';
import { appointmentsApi, calendarApi } from '../services/api';
import AppointmentPanel from '../components/AppointmentPanel';
import AppointmentForm from '../components/AppointmentForm';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 07:00 - 19:00
const SLOT_HEIGHT = 48; // px per hour

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

function getWeekDays(referenceDate) {
  const date = new Date(referenceDate);
  const day = date.getDay(); // 0=Sun
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - day);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

function toDateStr(date) {
  return date.toISOString().split('T')[0];
}

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [newApptSlot, setNewApptSlot] = useState(null); // { date, time }
  const [syncing, setSyncing] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);

  const weekDays = getWeekDays(currentDate);
  const from = toDateStr(weekDays[0]);
  const to = toDateStr(weekDays[6]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appointmentsApi.getAll({ from, to });
      setAppointments(res.data);
    } catch (err) {
      console.error('Calendar load error:', err);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
    calendarApi.getStatus()
      .then(r => setCalendarConnected(r.data.authenticated))
      .catch(() => {});
  }, [load]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await calendarApi.sync({ from, to });
      alert(`סנכרון הושלם: ${res.data.created} חדשים, ${res.data.updated} עודכנו`);
      load();
    } catch (err) {
      alert('שגיאה בסנכרון: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleSlotClick = (date, hour) => {
    const time = `${String(hour).padStart(2, '0')}:00`;
    setNewApptSlot({ date: toDateStr(date), time });
  };

  const goToPrevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const goToNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const goToToday = () => setCurrentDate(new Date());

  const today = toDateStr(new Date());

  // Group appointments by date
  const apptsByDate = {};
  for (const appt of appointments) {
    if (!apptsByDate[appt.appointment_date]) apptsByDate[appt.appointment_date] = [];
    apptsByDate[appt.appointment_date].push(appt);
  }

  const weekLabel = `${weekDays[0].getDate()} ${MONTHS[weekDays[0].getMonth()]} – ${weekDays[6].getDate()} ${MONTHS[weekDays[6].getMonth()]} ${weekDays[6].getFullYear()}`;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>יומן</h2>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{weekLabel}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {calendarConnected && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? '⏳ מסנכרן...' : '🔄 סנכרן עם Google'}
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={goToPrevWeek}>‹ שבוע קודם</button>
          <button className="btn btn-secondary btn-sm" onClick={goToToday}>היום</button>
          <button className="btn btn-secondary btn-sm" onClick={goToNextWeek}>שבוע הבא ›</button>
        </div>
      </div>

      <div className="page-body" style={{ padding: '16px 24px', overflow: 'auto' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: '50px repeat(7, 1fr)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          minWidth: 700
        }}>
          {/* Header row */}
          <div style={{
            background: '#f8fafc',
            borderBottom: '2px solid var(--border)',
            borderLeft: '1px solid var(--border)'
          }} />
          {weekDays.map((day, i) => {
            const isToday = toDateStr(day) === today;
            return (
              <div key={i} style={{
                background: '#f8fafc',
                borderBottom: '2px solid var(--border)',
                borderLeft: '1px solid var(--border)',
                padding: '10px 8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                  {DAY_NAMES[day.getDay()]}
                </div>
                <div style={{
                  fontSize: 22,
                  fontWeight: 700,
                  lineHeight: 1,
                  marginTop: 4,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '4px auto 0',
                  background: isToday ? 'var(--primary)' : 'transparent',
                  color: isToday ? '#fff' : 'var(--text)'
                }}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}

          {/* Time rows */}
          {HOURS.map(hour => (
            <React.Fragment key={hour}>
              {/* Time label */}
              <div style={{
                height: SLOT_HEIGHT,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: 4,
                fontSize: 11,
                color: 'var(--text-muted)',
                borderBottom: '1px solid #f1f5f9',
                borderLeft: '1px solid var(--border)',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {String(hour).padStart(2, '0')}:00
              </div>

              {/* Day slots */}
              {weekDays.map((day, di) => {
                const dateStr = toDateStr(day);
                const slotAppts = (apptsByDate[dateStr] || []).filter(a => {
                  const apptHour = parseInt(a.appointment_time.split(':')[0]);
                  return apptHour === hour;
                });

                return (
                  <div
                    key={di}
                    style={{
                      height: SLOT_HEIGHT,
                      borderBottom: '1px solid #f1f5f9',
                      borderLeft: '1px solid var(--border)',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background 0.1s'
                    }}
                    onClick={() => handleSlotClick(day, hour)}
                    onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                  >
                    {slotAppts.map(appt => (
                      <CalendarEvent
                        key={appt.id}
                        appt={appt}
                        onClick={(e) => { e.stopPropagation(); setSelectedAppt(appt); }}
                      />
                    ))}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
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

      {newApptSlot && (
        <AppointmentForm
          defaultDate={newApptSlot.date}
          defaultTime={newApptSlot.time}
          onClose={() => setNewApptSlot(null)}
          onSuccess={() => { setNewApptSlot(null); load(); }}
        />
      )}
    </>
  );
}

function CalendarEvent({ appt, onClick }) {
  const [h, m] = appt.appointment_time.split(':').map(Number);
  const minutesFromHour = m;
  const top = (minutesFromHour / 60) * SLOT_HEIGHT;

  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        top: top,
        left: 2,
        right: 2,
        height: SLOT_HEIGHT - top - 2,
        background: appt.status === 'cancelled' ? '#94a3b8' : 'var(--primary)',
        color: '#fff',
        borderRadius: 6,
        padding: '2px 6px',
        fontSize: 12,
        fontWeight: 600,
        overflow: 'hidden',
        cursor: 'pointer',
        zIndex: 10,
        boxShadow: '0 1px 3px rgba(37,99,235,0.3)',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis'
      }}
      title={`${appt.full_name} - ${appt.appointment_time}`}
    >
      {appt.appointment_time} {appt.full_name}
    </div>
  );
}
