import React, { useState, useEffect } from 'react';
import { templatesApi } from '../services/api';

const TEMPLATE_LABELS = {
  confirmation: '✅ אישור תור (נשלח מיידית)',
  reminder_4days: '📅 תזכורת 4 ימים לפני',
  reminder_2days: '⏰ תזכורת יומיים לפני',
  cancellation_doctor: '❌ התראת מחיקה (לרופא)'
};

const VARIABLES = ['{{שם פרטי}}', '{{תאריך הפגישה}}', '{{שעת הפגישה}}'];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    templatesApi.getAll().then(r => setTemplates(r.data));
  }, []);

  const handleEdit = (template) => {
    setEditing(template);
    setEditContent(template.content);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await templatesApi.update(editing.name, editContent);
      setTemplates(prev => prev.map(t =>
        t.name === editing.name ? { ...t, content: editContent } : t
      ));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (variable) => {
    setEditContent(prev => prev + variable);
  };

  return (
    <>
      <div className="page-header">
        <h2>תבניות הודעה</h2>
      </div>

      <div className="page-body">
        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          💡 ניתן להשתמש במשתנים: <strong>{'{{שם פרטי}}'}</strong>, <strong>{'{{תאריך הפגישה}}'}</strong>, <strong>{'{{שעת הפגישה}}'}</strong>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: editing ? '1fr 1fr' : '1fr', gap: 20 }}>
          {/* Template list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {templates.map(t => (
              <div
                key={t.name}
                className="card"
                style={{
                  cursor: 'pointer',
                  borderColor: editing?.name === t.name ? 'var(--primary)' : 'var(--border)',
                  borderWidth: editing?.name === t.name ? 2 : 1
                }}
                onClick={() => handleEdit(t)}
              >
                <div className="card-header">
                  <span style={{ fontSize: 15 }}>{TEMPLATE_LABELS[t.name] || t.name}</span>
                  <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); handleEdit(t); }}>
                    ✏️ עריכה
                  </button>
                </div>
                <div className="card-body">
                  <pre style={{
                    fontFamily: 'Heebo, sans-serif',
                    fontSize: 13,
                    color: 'var(--text)',
                    whiteSpace: 'pre-wrap',
                    margin: 0,
                    direction: 'rtl',
                    lineHeight: 1.7
                  }}>
                    {t.content}
                  </pre>
                </div>
              </div>
            ))}
          </div>

          {/* Edit panel */}
          {editing && (
            <div className="card">
              <div className="card-header">
                <span>✏️ עריכת: {TEMPLATE_LABELS[editing.name] || editing.name}</span>
                <button className="btn-close" onClick={() => setEditing(null)}>×</button>
              </div>
              <div className="card-body">
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
                    הכנס משתנה:
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {VARIABLES.map(v => (
                      <button
                        key={v}
                        className="btn btn-secondary btn-sm"
                        onClick={() => insertVariable(v)}
                        style={{ fontSize: 12, fontFamily: 'monospace' }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  className="form-control"
                  rows={12}
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  style={{ fontFamily: 'Heebo, sans-serif', fontSize: 14, lineHeight: 1.7 }}
                />

                <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                  <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? '⏳ שומר...' : saved ? '✅ נשמר!' : '💾 שמור'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => setEditing(null)}>
                    ביטול
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
