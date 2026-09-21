const express = require('express');
const router = express.Router();
const { getAppointments } = require('../sheetsRepository');
const { getJerusalemDateString } = require('../tz');

// GET /api/hub/today - today's appointments grouped by clinic.
router.get('/', async (req, res) => {
  try {
    const appts = await getAppointments();
    const today = getJerusalemDateString();

    const todays = appts.filter(a => {
      if (!a.appointmentStart) return false;
      const start = new Date(a.appointmentStart);
      if (Number.isNaN(start.getTime())) return false;
      return getJerusalemDateString(start) === today;
    });

    const byClinic = {};
    for (const a of todays) {
      const clinic = a.clinic || 'לא צוין (שידורית)';
      if (!byClinic[clinic]) byClinic[clinic] = [];
      byClinic[clinic].push({
        patientId: a.patientId,
        name: a.name,
        phone: a.phone,
        appointmentStart: a.appointmentStart,
        insurer: a.insurer,
        source: a.source,
        status: a.status,
        engagement: a.engagement
      });
    }
    for (const clinic of Object.keys(byClinic)) {
      byClinic[clinic].sort((x, y) => new Date(x.appointmentStart) - new Date(y.appointmentStart));
    }

    res.json({ date: today, byClinic });
  } catch (err) {
    console.error('[Hub Today] error:', err.message);
    res.status(502).json({ error: 'Failed to read the Appointments sheet', detail: err.message });
  }
});

module.exports = router;
