import React, { useState } from 'react';
import { appointmentsApi } from '../services/api';

const HMO_OPTIONS = ['מכבי', 'מאוחדת', 'כללית', 'לאומית'];
const TIME_OPTIONS = [
  '07:00','07:30','08:00','08:30','09:00','09:30','10:00','10:30',
  '11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30',
  '15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30'
];

export default function AppointmentForm({ onClose, onSuccess, defaultDate, defaultTime }) {
  const [form, setForm] = useState({
    full_name: '',
    first_name: '',
    phone: '',
    id_number: '',
    hmo: '',
    email: '',
    appointment_date: defaultDate || '',
    appointment_time: defaultTime || '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.phone || !form.appointment_date || !form.appointment_time) {
      setError('יש למלא שדות חובה: שם מלא, טלפון, תאריך ושעה');
      return;
    }

    // Auto-fill first_name if empty
    if (!form.first_name) {
      form.first_name = form.full_name.split(' ')[0];
    }

    setLoading(true);
    setError('');
    try {
      const res = await appointmentsApi.create(form);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה בשמירה');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onSuccess()}>
        <div className="modal">
          <div className="modal-header">
            <h3>✅ תור נקבע בהצלחה</h3>
            <button className="btn-close" onClick={onSuccess}>×</button>
          </div>
          <div className="modal-body">
            <div className="alert alert-success">
              <div>
                <strong>{result.appointment.full_name}</strong><br />
                📅 {result.appointment.appointment_date} בשעה {result.appointment.appointment_time}<br />
                📱 {result.appointment.phone}
              </div>
            </div>

            {result.whatsappError ? (
              <div className="alert alert-warning">
                ⚠️ לא ניתן לשלוח אישור WhatsApp: {result.whatsappError}
              </div>
            ) : (
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                ✉️ אישור WhatsApp נשלח למטופלת
              </div>
            )}

            {result.calendarError && (
              <div className="alert alert-warning" style={{ marginTop: 12 }}>
                ⚠️ לא ניתן להוסיף ל-Google Calendar: {result.calendarError}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary" onClick={onSuccess}>סגור</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>➕ הוספת תור חדש</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-error">{error}</div>
            )}

            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              פרטי מטופלת
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">שם מלא <span className="required">*</span></label>
                <input
                  className="form-control"
                  required
                  value={form.full_name}
                  onChange={e => {
                    set('full_name', e.target.value);
                    if (!form.first_name) set('first_name', e.target.value.split(' ')[0]);
                  }}
                  placeholder="כהן שרה"
                />
              </div>
              <div className="form-group">
                <label className="form-label">שם פרטי</label>
                <input
                  className="form-control"
                  value={form.first_name}
                  onChange={e => set('first_name', e.target.value)}
                  placeholder="שרה"
                />
                <div className="form-hint">לשימוש בהודעות WhatsApp</div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">טלפון <span className="required">*</span></label>
                <input
                  className="form-control"
                  required
                  type="tel"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="05X-XXXXXXX"
                  style={{ direction: 'ltr' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">ת.ז.</label>
                <input
                  className="form-control"
                  value={form.id_number}
                  onChange={e => set('id_number', e.target.value)}
                  placeholder="XXXXXXXXX"
                  style={{ direction: 'ltr' }}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">קופת חולים</label>
                <select
                  className="form-control"
                  value={form.hmo}
                  onChange={e => set('hmo', e.target.value)}
                >
                  <option value="">בחר...</option>
                  {HMO_OPTIONS.map(h => <option key={h}>{h}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">אימייל</label>
                <input
                  className="form-control"
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="email@example.com"
                  style={{ direction: 'ltr' }}
                />
              </div>
            </div>

            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-muted)', margin: '16px 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              מועד התור
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">תאריך <span className="required">*</span></label>
                <input
                  className="form-control"
                  required
                  type="date"
                  value={form.appointment_date}
                  onChange={e => set('appointment_date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="form-group">
                <label className="form-label">שעה <span className="required">*</span></label>
                <select
                  className="form-control"
                  required
                  value={form.appointment_time}
                  onChange={e => set('appointment_time', e.target.value)}
                >
                  <option value="">בחר שעה...</option>
                  {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">הערות</label>
              <textarea
                className="form-control"
                rows={3}
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="הערות נוספות..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '⏳ שומר...' : '✅ שמור ושלח אישור'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
