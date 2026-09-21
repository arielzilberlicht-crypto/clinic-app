const express = require('express');
const router = express.Router();
const { getAppointments, getCommunications } = require('../sheetsRepository');
const { maskIsraeliId, isValidIsraeliId } = require('../israeliId');
const { requireRole } = require('../authMiddleware');
const { logAudit } = require('../auditLog');

function byMostRecentAppointmentFirst(a, b) {
  return new Date(b.appointmentStart || 0) - new Date(a.appointmentStart || 0);
}

// GET /api/hub/patients/:patientId - read-only patient card, ID number
// masked to its last 3 digits. Available to any signed-in Hub user.
router.get('/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const [appts, comms] = await Promise.all([getAppointments(), getCommunications()]);

    const patientAppts = appts.filter(a => a.patientId === patientId).sort(byMostRecentAppointmentFirst);
    const patientComms = comms
      .filter(c => c.patientId === patientId)
      .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));

    if (patientAppts.length === 0 && patientComms.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const latest = patientAppts[0] || {};
    const idValue = latest.confirmedId || latest.rawId || '';

    res.json({
      patientId,
      name: latest.name || '',
      phone: latest.phone || '',
      idNumberMasked: maskIsraeliId(idValue),
      idNumberValid: idValue ? isValidIsraeliId(idValue) : null,
      appointments: patientAppts.map(a => ({
        appointmentStart: a.appointmentStart,
        clinic: a.clinic,
        insurer: a.insurer,
        source: a.source,
        status: a.status,
        engagement: a.engagement
      })),
      communications: patientComms.map(c => ({
        time: c.time,
        direction: c.direction,
        type: c.type,
        status: c.status
      }))
    });
  } catch (err) {
    console.error('[Hub Patient Card] error:', err.message);
    res.status(502).json({ error: 'Failed to read sheet data', detail: err.message });
  }
});

// POST /api/hub/patients/:patientId/reveal-id - DOCTOR only, always logged.
router.post('/:patientId/reveal-id', requireRole('DOCTOR'), async (req, res) => {
  try {
    const { patientId } = req.params;
    const appts = await getAppointments();
    const patientAppts = appts.filter(a => a.patientId === patientId).sort(byMostRecentAppointmentFirst);

    if (patientAppts.length === 0) return res.status(404).json({ error: 'Patient not found' });

    const latest = patientAppts[0];
    const idValue = latest.confirmedId || latest.rawId || '';

    logAudit({ actorEmail: req.hubUser.email, actorRole: req.hubUser.role, action: 'ID_REVEAL', target: patientId, req });

    res.json({ patientId, idNumber: idValue, valid: idValue ? isValidIsraeliId(idValue) : null });
  } catch (err) {
    console.error('[Hub Patient Card] reveal error:', err.message);
    res.status(502).json({ error: 'Failed to read sheet data', detail: err.message });
  }
});

module.exports = router;
