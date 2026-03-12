const express = require('express');
const router = express.Router();
const { appointmentQueries, patientQueries, templateQueries } = require('../db/queries');
const calendarService = require('../services/googleCalendar');
const { sendMessage, renderTemplate, formatDateHebrew } = require('../services/greenApi');

// GET /api/appointments - list all or by date range
router.get('/', (req, res) => {
  const { date, from, to } = req.query;

  let appointments;
  if (date) {
    appointments = appointmentQueries.getByDate.all(date);
  } else if (from && to) {
    appointments = appointmentQueries.getByDateRange.all(from, to);
  } else {
    appointments = appointmentQueries.getAll.all();
  }

  res.json(appointments);
});

// GET /api/appointments/today
router.get('/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const appointments = appointmentQueries.getByDate.all(today);
  res.json(appointments);
});

// GET /api/appointments/stats
router.get('/stats', (req, res) => {
  const today = appointmentQueries.getTodayCount.get();
  const total = appointmentQueries.getTotalActive.get();
  const remindersToday = appointmentQueries.getPendingRemindersToday.get();

  res.json({
    todayCount: today.count,
    totalActive: total.count,
    pendingReminders: remindersToday.count
  });
});

// GET /api/appointments/:id
router.get('/:id', (req, res) => {
  const appt = appointmentQueries.getById.get(req.params.id);
  if (!appt) return res.status(404).json({ error: 'Appointment not found' });
  res.json(appt);
});

// POST /api/appointments - create new appointment
router.post('/', async (req, res) => {
  const {
    full_name, first_name, phone, id_number, hmo, email,
    appointment_date, appointment_time, notes,
    create_patient = true
  } = req.body;

  if (!full_name || !phone || !appointment_date || !appointment_time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Build datetime
    const startDatetime = `${appointment_date}T${appointment_time}:00+02:00`;
    const endDatetime = new Date(new Date(startDatetime).getTime() + 60 * 60 * 1000).toISOString();

    // Create or find patient record
    let patientId = null;
    if (create_patient) {
      const result = patientQueries.create.run({
        full_name, first_name, phone,
        id_number: id_number || null,
        hmo: hmo || null,
        email: email || null,
        notes: notes || null
      });
      patientId = result.lastInsertRowid;
    }

    // Create Google Calendar event
    let calendarEventId = null;
    let calendarError = null;

    if (calendarService.isAuthenticated()) {
      try {
        const event = await calendarService.createEvent({
          fullName: full_name,
          phone,
          idNumber: id_number,
          hmo,
          startDatetime,
          endDatetime,
          notes
        });
        calendarEventId = event.id;
      } catch (err) {
        calendarError = err.message;
        console.error('[Appointments] Failed to create calendar event:', err.message);
      }
    }

    // Save appointment in DB
    const result = appointmentQueries.create.run({
      patient_id: patientId,
      full_name,
      first_name,
      phone,
      appointment_date,
      appointment_time,
      start_datetime: startDatetime,
      end_datetime: endDatetime,
      calendar_event_id: calendarEventId,
      notes: notes || null
    });

    const newAppt = appointmentQueries.getById.get(result.lastInsertRowid);

    // Send WhatsApp confirmation
    let whatsappError = null;
    try {
      const template = templateQueries.getByName.get('confirmation');
      if (template) {
        const message = renderTemplate(template.content, {
          firstName: first_name,
          appointmentDate: formatDateHebrew(appointment_date),
          appointmentTime: appointment_time
        });
        await sendMessage(phone, message);
        appointmentQueries.markConfirmationSent.run(newAppt.id);
      }
    } catch (err) {
      whatsappError = err.message;
      console.error('[Appointments] Failed to send WhatsApp confirmation:', err.message);
    }

    res.status(201).json({
      appointment: newAppt,
      calendarEventId,
      calendarError,
      whatsappError
    });
  } catch (err) {
    console.error('[Appointments] Create error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/appointments/:id - update appointment
router.put('/:id', async (req, res) => {
  const appt = appointmentQueries.getById.get(req.params.id);
  if (!appt) return res.status(404).json({ error: 'Appointment not found' });

  const {
    full_name, first_name, phone,
    appointment_date, appointment_time, status, notes
  } = req.body;

  const startDatetime = `${appointment_date}T${appointment_time}:00+02:00`;
  const endDatetime = new Date(new Date(startDatetime).getTime() + 60 * 60 * 1000).toISOString();

  appointmentQueries.update.run({
    id: appt.id,
    full_name: full_name || appt.full_name,
    first_name: first_name || appt.first_name,
    phone: phone || appt.phone,
    appointment_date: appointment_date || appt.appointment_date,
    appointment_time: appointment_time || appt.appointment_time,
    start_datetime: startDatetime,
    end_datetime: endDatetime,
    status: status || appt.status,
    notes: notes !== undefined ? notes : appt.notes
  });

  // Update calendar if authenticated
  if (appt.calendar_event_id && calendarService.isAuthenticated()) {
    try {
      await calendarService.updateEvent(appt.calendar_event_id, {
        summary: full_name || appt.full_name,
        start: { dateTime: startDatetime, timeZone: 'Asia/Jerusalem' },
        end: { dateTime: endDatetime, timeZone: 'Asia/Jerusalem' }
      });
    } catch (err) {
      console.error('[Appointments] Failed to update calendar event:', err.message);
    }
  }

  res.json(appointmentQueries.getById.get(appt.id));
});

// POST /api/appointments/:id/cancel
router.post('/:id/cancel', async (req, res) => {
  const appt = appointmentQueries.getById.get(req.params.id);
  if (!appt) return res.status(404).json({ error: 'Appointment not found' });

  appointmentQueries.cancel.run(appt.id);

  // Notify doctor via WhatsApp
  try {
    const template = templateQueries.getByName.get('cancellation_doctor');
    if (template) {
      const { sendToDoctor } = require('../services/greenApi');
      await sendToDoctor(template.content);
    }
  } catch (err) {
    console.error('[Appointments] Failed to notify doctor of cancellation:', err.message);
  }

  res.json({ success: true });
});

// POST /api/appointments/:id/send-reminder - manual reminder trigger
router.post('/:id/send-reminder', async (req, res) => {
  const appt = appointmentQueries.getById.get(req.params.id);
  if (!appt) return res.status(404).json({ error: 'Appointment not found' });

  const { type = 'confirmation' } = req.body;
  const template = templateQueries.getByName.get(type);
  if (!template) return res.status(404).json({ error: 'Template not found' });

  try {
    const message = renderTemplate(template.content, {
      firstName: appt.first_name,
      appointmentDate: formatDateHebrew(appt.appointment_date),
      appointmentTime: appt.appointment_time
    });

    await sendMessage(appt.phone, message);
    res.json({ success: true, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
