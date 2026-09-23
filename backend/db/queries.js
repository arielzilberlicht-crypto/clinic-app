const db = require('./database');

// ─── Appointments ────────────────────────────────────────────────────────────

const appointmentQueries = {
  getAll: db.prepare(`
    SELECT * FROM appointments ORDER BY appointment_date, appointment_time
  `),

  getById: db.prepare(`SELECT * FROM appointments WHERE id = ?`),

  getByCalendarId: db.prepare(`
    SELECT * FROM appointments WHERE calendar_event_id = ?
  `),

  getByDate: db.prepare(`
    SELECT * FROM appointments
    WHERE appointment_date = ? AND status = 'active'
    ORDER BY appointment_time
  `),

  getByDateRange: db.prepare(`
    SELECT * FROM appointments
    WHERE appointment_date BETWEEN ? AND ? AND status = 'active'
    ORDER BY appointment_date, appointment_time
  `),

  getPendingReminders4Days: db.prepare(`
    SELECT * FROM appointments
    WHERE status = 'active'
      AND reminder_4days_sent = 0
      AND date(appointment_date) = date('now', '+4 days')
  `),

  getPendingReminders2Days: db.prepare(`
    SELECT * FROM appointments
    WHERE status = 'active'
      AND reminder_2days_sent = 0
      AND date(appointment_date) = date('now', '+2 days')
  `),

  create: db.prepare(`
    INSERT INTO appointments (
      patient_id, full_name, first_name, phone,
      appointment_date, appointment_time, start_datetime, end_datetime,
      calendar_event_id, status, notes
    ) VALUES (
      @patient_id, @full_name, @first_name, @phone,
      @appointment_date, @appointment_time, @start_datetime, @end_datetime,
      @calendar_event_id, 'active', @notes
    )
  `),

  update: db.prepare(`
    UPDATE appointments SET
      full_name = @full_name,
      first_name = @first_name,
      phone = @phone,
      appointment_date = @appointment_date,
      appointment_time = @appointment_time,
      start_datetime = @start_datetime,
      end_datetime = @end_datetime,
      status = @status,
      notes = @notes,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `),

  updateByCalendarId: db.prepare(`
    UPDATE appointments SET
      full_name = @full_name,
      first_name = @first_name,
      appointment_date = @appointment_date,
      appointment_time = @appointment_time,
      start_datetime = @start_datetime,
      end_datetime = @end_datetime,
      status = @status,
      updated_at = CURRENT_TIMESTAMP
    WHERE calendar_event_id = @calendar_event_id
  `),

  markConfirmationSent: db.prepare(`
    UPDATE appointments SET confirmation_sent = 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),

  markReminder4DaysSent: db.prepare(`
    UPDATE appointments SET reminder_4days_sent = 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),

  markReminder2DaysSent: db.prepare(`
    UPDATE appointments SET reminder_2days_sent = 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),

  cancel: db.prepare(`
    UPDATE appointments SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),

  cancelByCalendarId: db.prepare(`
    UPDATE appointments SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
    WHERE calendar_event_id = ?
  `),

  getTodayCount: db.prepare(`
    SELECT COUNT(*) as count FROM appointments
    WHERE appointment_date = date('now') AND status = 'active'
  `),

  getTotalActive: db.prepare(`
    SELECT COUNT(*) as count FROM appointments WHERE status = 'active'
  `),

  getPendingRemindersToday: db.prepare(`
    SELECT COUNT(*) as count FROM appointments
    WHERE status = 'active' AND (
      (reminder_4days_sent = 0 AND date(appointment_date) = date('now', '+4 days')) OR
      (reminder_2days_sent = 0 AND date(appointment_date) = date('now', '+2 days'))
    )
  `)
};

// ─── Patients ─────────────────────────────────────────────────────────────────

const patientQueries = {
  getAll: db.prepare(`SELECT * FROM patients ORDER BY full_name`),

  getById: db.prepare(`SELECT * FROM patients WHERE id = ?`),

  search: db.prepare(`
    SELECT * FROM patients
    WHERE full_name LIKE ? OR phone LIKE ? OR id_number LIKE ?
    ORDER BY full_name
    LIMIT 20
  `),

  create: db.prepare(`
    INSERT INTO patients (full_name, first_name, phone, id_number, hmo, email, notes)
    VALUES (@full_name, @first_name, @phone, @id_number, @hmo, @email, @notes)
  `),

  update: db.prepare(`
    UPDATE patients SET
      full_name = @full_name,
      first_name = @first_name,
      phone = @phone,
      id_number = @id_number,
      hmo = @hmo,
      email = @email,
      notes = @notes
    WHERE id = @id
  `)
};

// ─── Templates ────────────────────────────────────────────────────────────────

const templateQueries = {
  getAll: db.prepare(`SELECT * FROM message_templates ORDER BY name`),

  getByName: db.prepare(`SELECT * FROM message_templates WHERE name = ?`),

  update: db.prepare(`
    UPDATE message_templates SET content = ?, updated_at = CURRENT_TIMESTAMP
    WHERE name = ?
  `)
};

// ─── Settings ─────────────────────────────────────────────────────────────────

const settingsQueries = {
  get: db.prepare(`SELECT value FROM settings WHERE key = ?`),

  set: db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `)
};

// ─── Feedback ─────────────────────────────────────────────────────────────────

const feedbackQueries = {
  insertAudit: db.prepare(`
    INSERT INTO feedback_audit (
      selected_date, medreviews_count, google_haifa_count, google_tlv_count, test_mode
    ) VALUES (
      @selected_date, @medreviews_count, @google_haifa_count, @google_tlv_count, @test_mode
    )
  `)
};

module.exports = { appointmentQueries, patientQueries, templateQueries, settingsQueries, feedbackQueries };
