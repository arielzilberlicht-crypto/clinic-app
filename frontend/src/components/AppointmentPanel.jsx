import React, { useState } from 'react';
import { appointmentsApi } from '../services/api';

function formatDateHebrew(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

const REMINDER_TYPES = [
  { value: 'confirmation', label: '✅ שלח אישור תור' },
  { value: 'reminder_4days', label: '📅 שלח תזכורת 4 ימים' },
  { value: 'reminder_2days', label: '⏰ שלח תזכורת יומיים' }
];

export default function AppointmentPanel({ appointment: appt, onClose, onCancel, onUpdate }) {
  const [sendingType, setSendingType] = useState(null);
  const [sendResult, setSendResult] = useState('');

  const handleSendMessage = async (type) => {
    setSendingType(type);
    setSendResult('');
    try {
      const res = await appointmentsApi.sendReminder(appt.id, type);
      setSendResult('✅ הודעה נשלחה בהצלחה');
      setTimeout(() => setSendResult(''), 3000);
      onUpdate?.();
    } catch (err) {
      setSendResult('❌ שגיאה בשליחה: ' + (err.response?.data?.error || err.message));
    } finally {
      setSendingType(null);
    }
  };

  return (
    <>
      <div
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
          zIndex: 140, cursor: 'pointer'
        }}
        onClick={onClose}
      />
      <div className="side-panel">
        <div className="side-panel-header">
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>{appt.full_name}</h3>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              📅 {formatDateHebrew(appt.appointment_date)} בשעה {appt.appointment_time}
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="side-panel-body">
          {/* Status */}
          <div style={{ marginBottom: 20 }}>
            <span className={`badge badge-${appt.status}`} style={{ fontSize: 13 }}>
              {appt.status === 'active' ? '● פעיל' : '✗ בוטל'}
            </span>
            {appt.confirmation_sent === 1 && (
              <span className="badge badge-sent" style={{ marginRight: 8, fontSize: 13 }}>
                ✓ אישור נשלח
              </span>
            )}
          </div>

          {/* Patient details */}
          <div style={{
            background: '#f8fafc',
            borderRadius: 10,
            padding: '16px',
            marginBottom: 20
          }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>
              פרטי מטופלת
            </div>
            {[
              ['📱 טלפון', appt.phone],
              ['📅 תאריך', formatDateHebrew(appt.appointment_date)],
              ['🕒 שעה', appt.appointment_time],
              ['📝 הערות', appt.notes]
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingBottom: 8,
                marginBottom: 8,
                borderBottom: '1px solid var(--border)',
                fontSize: 14
              }}>
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontWeight: 500, direction: k.includes('טלפון') ? 'ltr' : 'rtl' }}>
                  {v}
                </span>
              </div>
            ))}
          </div>

          {/* Send messages */}
          {appt.status === 'active' && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>
                שליחת הודעות WhatsApp
              </div>

              {sendResult && (
                <div className={`alert ${sendResult.startsWith('✅') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 12 }}>
                  {sendResult}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {REMINDER_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    className="btn btn-secondary"
                    style={{ justifyContent: 'flex-start', fontSize: 13 }}
                    disabled={sendingType === value}
                    onClick={() => handleSendMessage(value)}
                  >
                    {sendingType === value ? '⏳ שולח...' : label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Calendar event info */}
          {appt.calendar_event_id && (
            <div style={{
              background: '#eff6ff',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 12,
              color: '#1e40af',
              marginBottom: 16
            }}>
              📅 מסונכרן עם Google Calendar
            </div>
          )}
        </div>

        {/* Footer actions */}
        {appt.status === 'active' && (
          <div className="side-panel-footer">
            <button
              className="btn btn-danger"
              style={{ width: '100%' }}
              onClick={onCancel}
            >
              🗑️ ביטול תור
            </button>
          </div>
        )}
      </div>
    </>
  );
}
