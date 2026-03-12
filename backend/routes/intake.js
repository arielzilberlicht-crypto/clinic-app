// Patient self-intake form (public route - no auth required)
const express = require('express');
const router = express.Router();
const { patientQueries, appointmentQueries, templateQueries } = require('../db/queries');
const { sendMessage, renderTemplate, formatDateHebrew } = require('../services/greenApi');

// POST /api/intake - patient self-registration
router.post('/', async (req, res) => {
  const {
    full_name, first_name, phone,
    id_number, hmo, email,
    appointment_date, appointment_time,
    privacy_consent, notes
  } = req.body;

  if (!full_name || !first_name || !phone || !appointment_date || !appointment_time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!privacy_consent) {
    return res.status(400).json({ error: 'Privacy consent is required' });
  }

  try {
    // Create patient
    const patientResult = patientQueries.create.run({
      full_name, first_name, phone,
      id_number: id_number || null,
      hmo: hmo || null,
      email: email || null,
      notes: notes || null
    });

    const startDatetime = `${appointment_date}T${appointment_time}:00+02:00`;
    const endDatetime = new Date(new Date(startDatetime).getTime() + 60 * 60 * 1000).toISOString();

    // Create appointment
    const apptResult = appointmentQueries.create.run({
      patient_id: patientResult.lastInsertRowid,
      full_name, first_name, phone,
      appointment_date, appointment_time,
      start_datetime: startDatetime,
      end_datetime: endDatetime,
      calendar_event_id: null,
      notes: notes || null
    });

    const newAppt = appointmentQueries.getById.get(apptResult.lastInsertRowid);

    // Send WhatsApp confirmation
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
      console.error('[Intake] WhatsApp failed:', err.message);
    }

    res.status(201).json({
      success: true,
      message: 'נרשמת בהצלחה! אישור נשלח לטלפון שלך.',
      appointmentId: newAppt.id
    });
  } catch (err) {
    console.error('[Intake] Error:', err);
    res.status(500).json({ error: 'שגיאה בשמירת הפרטים. נסי שוב.' });
  }
});

module.exports = router;
