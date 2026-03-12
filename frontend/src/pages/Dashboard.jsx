import React, { useState, useEffect, useCallback } from 'react';
import { appointmentsApi } from '../services/api';
import AppointmentPanel from '../components/AppointmentPanel';

function formatDateHebrew(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function getTodayHebrew() {
  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  const now = new Date();
  return `יום ${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

export default function Dashboard({ onAddAppointment }) {
  const [stats, setStats] = useState({ todayCount: 0, totalActive: 0, pendingReminders: 0 });
  const [todayAppts, setTodayAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppt, setSelectedAppt] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, apptRes] = await Promise.all([
        appointmentsApi.getStats(),
        appointmentsApi.getToday()
      ]);
      setStats(statsRes.data);
      setTodayAppts(apptRes.data);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCancelAppt = async (id) => {
    if (!confirm('לבטל את התור?')) return;
    await appointmentsApi.cancel(id);
    setSelectedAppt(null);
    load();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>לוח בקרה</h2>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {getTodayHebrew()}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={onAddAppointment}>
            ➕ הוסף תור
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-label">תורים היום</div>
            <div className="stat-value">{stats.todayCount}</div>
            <div className="stat-sub">{formatDateHebrew(new Date().toISOString().split('T')[0])}</div>
          </div>
          <div className="stat-card green">
            <div className="stat-label">סה"כ תורים פעילים</div>
            <div className="stat-value">{stats.totalActive}</div>
            <div className="stat-sub">במערכת</div>
          </div>
          <div className="stat-card orange">
            <div className="stat-label">תזכורות ממתינות</div>
            <div className="stat-value">{stats.pendingReminders}</div>
            <div className="stat-sub">לשליחה היום</div>
          </div>
        </div>

        {/* Today's appointments */}
        <div className="card">
          <div className="card-header">
            <span>📋 תורים היום</span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={load}
              style={{ fontSize: 12 }}
            >
              🔄 רענן
            </button>
          </div>

          {loading ? (
            <div className="loading-center">
              <div className="spinner" />
              <span>טוען...</span>
            </div>
          ) : todayAppts.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📭</div>
              <h3>אין תורים היום</h3>
              <p>לחץ על "הוסף תור" להוספת תור חדש</p>
            </div>
          ) : (
            <div>
              {todayAppts.map(appt => (
                <div
                  key={appt.id}
                  className="appt-row"
                  onClick={() => setSelectedAppt(appt)}
                >
                  <div className="appt-time">{appt.appointment_time}</div>
                  <div className="appt-info">
                    <div className="appt-name">{appt.full_name}</div>
                    <div className="appt-phone" style={{ direction: 'ltr' }}>{appt.phone}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {appt.confirmation_sent ? (
                      <span className="badge badge-sent" title="אישור נשלח">✓ אישור נשלח</span>
                    ) : (
                      <span className="badge badge-pending">ממתין</span>
                    )}
                    <div className={`appt-status-dot ${appt.status}`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming reminders */}
        <RemindersWidget />
      </div>

      {selectedAppt && (
        <AppointmentPanel
          appointment={selectedAppt}
          onClose={() => setSelectedAppt(null)}
          onCancel={() => handleCancelAppt(selectedAppt.id)}
          onUpdate={load}
        />
      )}
    </>
  );
}

function RemindersWidget() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get appointments in next 4 days that need reminders
    const today = new Date();
    const from = today.toISOString().split('T')[0];
    const to4 = new Date(today.getTime() + 4 * 86400000).toISOString().split('T')[0];

    appointmentsApi.getAll({ from, to: to4 })
      .then(r => {
        const pending = r.data.filter(a =>
          a.status === 'active' && (!a.reminder_4days_sent || !a.reminder_2days_sent)
        );
        setReminders(pending);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || reminders.length === 0) return null;

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="card-header">
        <span>⏰ תזכורות קרובות</span>
        <span className="badge badge-pending">{reminders.length}</span>
      </div>
      <div>
        {reminders.map(appt => (
          <div key={appt.id} className="appt-row">
            <div className="appt-time" style={{ fontSize: 14 }}>
              {formatDateHebrew(appt.appointment_date)}
            </div>
            <div className="appt-info">
              <div className="appt-name">{appt.full_name}</div>
              <div className="appt-phone">{appt.appointment_time} • {appt.phone}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexDirection: 'column', alignItems: 'flex-end' }}>
              {!appt.reminder_4days_sent && (
                <span className="badge badge-pending" style={{ fontSize: 11 }}>תזכורת 4 ימים</span>
              )}
              {!appt.reminder_2days_sent && (
                <span className="badge badge-pending" style={{ fontSize: 11 }}>תזכורת יומיים</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
