const express = require('express');
const router = express.Router();
const makeService = require('../services/make');
const { settingsQueries, feedbackQueries } = require('../db/queries');
const {
  parseAppointmentsOutput,
  extractDefaultFirstName,
  isPhoneValid,
  applyTestModePhone,
  buildSendSummary,
  buildMockSendResults
} = require('../services/feedbackLogic');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function getTestMode() {
  const row = settingsQueries.get.get('feedback_test_mode');
  return row ? row.value === 'true' : true;
}

// GET /api/feedback/appointments?date=YYYY-MM-DD
router.get('/appointments', async (req, res) => {
  const { date } = req.query;
  if (!date || !DATE_RE.test(date)) {
    return res.status(400).json({ error: 'נדרש תאריך תקין בפורמט YYYY-MM-DD' });
  }

  try {
    const outputs = await makeService.fetchAppointmentsForDate(date);
    const raw = parseAppointmentsOutput(outputs);

    // Explicit allowlist: `summary` may contain an ID number and must never reach the client (see brief §8).
    const appointments = raw.map(appt => ({
      event_id: appt.event_id,
      time: appt.time,
      clinic: appt.clinic,
      phone: appt.phone,
      default_first_name: extractDefaultFirstName(appt.name),
      phone_valid: isPhoneValid(appt.phone)
    }));

    res.json({ appointments });
  } catch (err) {
    console.error('[Feedback] Fetch appointments error:', err.message);
    res.status(502).json({ error: 'שגיאה בשליפת הרשימה מ-Make' });
  }
});

// GET /api/feedback/settings
router.get('/settings', (req, res) => {
  res.json({ testMode: getTestMode() });
});

// PUT /api/feedback/settings - { testMode: boolean }
router.put('/settings', (req, res) => {
  const { testMode } = req.body;
  if (typeof testMode !== 'boolean') {
    return res.status(400).json({ error: 'testMode must be boolean' });
  }
  settingsQueries.set.run('feedback_test_mode', String(testMode));
  res.json({ testMode });
});

// POST /api/feedback/send - { date, items: [{ event_id, first_name, phone, medreviews, google_haifa, google_tlv }] }
router.post('/send', async (req, res) => {
  const { date, items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'נדרש לפחות פריט אחד לשליחה' });
  }

  const testMode = getTestMode();
  const preparedItems = applyTestModePhone(items, testMode);
  const sendScenarioId = process.env.FEEDBACK_SEND_SCENARIO_ID;

  let results;
  try {
    if (sendScenarioId) {
      const result = await makeService.runScenario(sendScenarioId, { items: preparedItems });
      results = (result && result.outputs && result.outputs.results) || [];
    } else {
      console.warn('[Feedback] FEEDBACK_SEND_SCENARIO_ID not configured, using mock send');
      results = buildMockSendResults(preparedItems);
    }
  } catch (err) {
    console.error('[Feedback] Send error:', err.message);
    return res.status(502).json({ error: 'שגיאה בשליחה דרך Make' });
  }

  // Audit only counts, per the brief's explicit "no names/phones in logs" requirement (§7).
  const summary = buildSendSummary(items);
  feedbackQueries.insertAudit.run({
    selected_date: date || null,
    medreviews_count: summary.medreviews,
    google_haifa_count: summary.googleHaifa,
    google_tlv_count: summary.googleTlv,
    test_mode: testMode ? 1 : 0
  });

  res.json({ results, testMode, mocked: !sendScenarioId });
});

module.exports = router;
