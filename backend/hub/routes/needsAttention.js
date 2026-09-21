const express = require('express');
const router = express.Router();
const { getAppointments, getAlerts } = require('../sheetsRepository');

const ID_MISSING_THRESHOLD_MS = 3 * 60 * 60 * 1000;

// GET /api/hub/needs-attention
// Phase 0 can only compute the "ID missing" alert directly from the
// Appointments tab. The other alert types (cancellation not found,
// unrecognized Shidurit message, failed Make execution) need the planned
// Alerts tab, which Make does not write to yet - this degrades gracefully
// instead of erroring when that tab is absent.
router.get('/', async (req, res) => {
  try {
    const appts = await getAppointments();
    const now = Date.now();

    const idMissing = appts
      .filter(a => {
        if (String(a.status || '').toUpperCase() === 'CANCELLED') return false;
        if (String(a.idVerification || '').toUpperCase() !== 'PENDING') return false;
        const created = a.createdAt ? new Date(a.createdAt).getTime() : NaN;
        if (Number.isNaN(created)) return false;
        return now - created > ID_MISSING_THRESHOLD_MS;
      })
      .map(a => ({
        type: 'ID_MISSING_3H',
        patientId: a.patientId,
        name: a.name,
        phone: a.phone,
        appointmentStart: a.appointmentStart,
        createdAt: a.createdAt,
        hoursWaiting: Number(((now - new Date(a.createdAt).getTime()) / 3600000).toFixed(1))
      }))
      .sort((a, b) => b.hoursWaiting - a.hoursWaiting);

    const alertsRaw = await getAlerts();
    const alertsAvailable = alertsRaw !== null;
    const openAlerts = alertsAvailable
      ? alertsRaw
          .filter(a => String(a.status || '').toUpperCase() !== 'HANDLED')
          .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
      : [];

    res.json({
      idMissing,
      alertsAvailable,
      openAlerts,
      note: alertsAvailable
        ? null
        : 'גיליון Alerts עדיין לא קיים. התראות על ביטול שלא נמצא, הודעת שידורית לא מזוהה וכשל בהרצת Make דורשות אותו - יש להציע את מבנה הגיליון לד"ר זילברליכט לפני שMake יתחיל לכתוב אליו.'
    });
  } catch (err) {
    console.error('[Hub Needs Attention] error:', err.message);
    res.status(502).json({ error: 'Failed to read sheet data', detail: err.message });
  }
});

module.exports = router;
