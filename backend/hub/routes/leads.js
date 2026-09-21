const express = require('express');
const router = express.Router();
const { getLeads, getAppointments } = require('../sheetsRepository');

// Compares Israeli mobile numbers regardless of 05x / 9725x / +9725x formatting.
function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('972')) return '0' + digits.slice(3);
  return digits;
}

// GET /api/hub/leads - website/MedReviews leads, flagged with whether they
// turned into a booking (matched by phone against the Appointments sheet).
router.get('/', async (req, res) => {
  try {
    const [leads, appts] = await Promise.all([getLeads(), getAppointments()]);

    const apptsByPhone = new Map();
    for (const a of appts) {
      const key = normalizePhone(a.phone);
      if (!key) continue;
      if (!apptsByPhone.has(key)) apptsByPhone.set(key, []);
      apptsByPhone.get(key).push(a);
    }

    const enriched = leads.map(lead => {
      const key = normalizePhone(lead.phone);
      const matches = key ? apptsByPhone.get(key) || [] : [];
      return {
        ...lead,
        booked: matches.length > 0,
        linkedAppointments: matches.map(m => ({ appointmentStart: m.appointmentStart, status: m.status }))
      };
    });

    enriched.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    res.json({ leads: enriched });
  } catch (err) {
    console.error('[Hub Leads] error:', err.message);
    res.status(502).json({ error: 'Failed to read the Leads sheet', detail: err.message });
  }
});

module.exports = router;
