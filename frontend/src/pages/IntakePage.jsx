import React, { useState } from 'react';
import axios from 'axios';

export default function IntakePage() {
  const [form, setForm] = useState({
    full_name: '',
    first_name: '',
    phone: '',
    id_number: '',
    hmo: '',
    email: '',
    appointment_date: '',
    appointment_time: '',
    notes: '',
    privacy_consent: false
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.privacy_consent) {
      setError('יש לאשר את מדיניות הפרטיות');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await axios.post('/api/intake', form);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה, נסי שוב.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        direction: 'rtl',
        fontFamily: 'Heebo, sans-serif',
        padding: 20
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: '48px 40px',
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>הפרטים התקבלו!</h2>
          <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.7 }}>
            תודה! פרטייך התקבלו במרפאה.<br />
            אישור ישלח אלייך בוואטסאפ בקרוב.
          </p>
          <div style={{ marginTop: 24, fontSize: 14, color: '#94a3b8' }}>
            מרפאתו של ד"ר אריאל זילברליכט
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e293b 0%, #1e40af 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      direction: 'rtl',
      fontFamily: 'Heebo, sans-serif'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        width: '100%',
        maxWidth: 560,
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)',
          padding: '32px 32px 28px',
          color: '#fff',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏥</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
            ד"ר אריאל זילברליכט
          </h1>
          <p style={{ fontSize: 14, opacity: 0.85, lineHeight: 1.5 }}>
            מומחה ברפואת נשים, כירורגיה גינקולוגית, אורוגינקולוגיה<br />
            גרנד קניון חיפה, קומה מינוס 4
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '28px 32px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#1e293b' }}>
            קביעת תור
          </h2>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              ⚠️ {error}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">שם מלא <span className="required">*</span></label>
              <input className="form-control" required value={form.full_name}
                onChange={e => set('full_name', e.target.value)} placeholder="כהן שרה" />
            </div>
            <div className="form-group">
              <label className="form-label">שם פרטי <span className="required">*</span></label>
              <input className="form-control" required value={form.first_name}
                onChange={e => set('first_name', e.target.value)} placeholder="שרה" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">טלפון נייד <span className="required">*</span></label>
              <input className="form-control" required type="tel" value={form.phone}
                onChange={e => set('phone', e.target.value)} placeholder="05X-XXXXXXX"
                style={{ direction: 'ltr' }} />
            </div>
            <div className="form-group">
              <label className="form-label">ת.ז.</label>
              <input className="form-control" value={form.id_number}
                onChange={e => set('id_number', e.target.value)} placeholder="XXXXXXXXX"
                style={{ direction: 'ltr' }} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">קופת חולים</label>
              <select className="form-control" value={form.hmo} onChange={e => set('hmo', e.target.value)}>
                <option value="">בחרי...</option>
                <option>מכבי</option>
                <option>מאוחדת</option>
                <option>כללית</option>
                <option>לאומית</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">אימייל</label>
              <input className="form-control" type="email" value={form.email}
                onChange={e => set('email', e.target.value)} placeholder="email@example.com"
                style={{ direction: 'ltr' }} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">תאריך מבוקש <span className="required">*</span></label>
              <input className="form-control" required type="date" value={form.appointment_date}
                onChange={e => set('appointment_date', e.target.value)}
                min={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="form-group">
              <label className="form-label">שעה מבוקשת <span className="required">*</span></label>
              <select className="form-control" required value={form.appointment_time}
                onChange={e => set('appointment_time', e.target.value)}>
                <option value="">בחרי שעה...</option>
                {['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30',
                  '13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">הערות (רשות)</label>
            <textarea className="form-control" rows={3} value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="מידע נוסף שחשוב לדעת..." />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <input
              type="checkbox"
              id="privacy"
              checked={form.privacy_consent}
              onChange={e => set('privacy_consent', e.target.checked)}
              style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0 }}
            />
            <label htmlFor="privacy" style={{ fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
              אני מאשרת את מדיניות הפרטיות ומסכימה שפרטיי ישמרו במערכת המרפאה לצרכי טיפול ותיאום תורים.
              <span className="required"> *</span>
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? '⏳ שולח...' : '📅 קבעי תור'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>
            📞 לפרטים נוספים: 04-8221148
          </p>
        </form>
      </div>
    </div>
  );
}
