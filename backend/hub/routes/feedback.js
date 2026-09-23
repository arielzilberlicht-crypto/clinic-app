const express = require('express');
const router = express.Router();
const makeClient = require('../makeClient');
const { settingsQueries } = require('../../db/queries');
const { logAudit } = require('../auditLog');
const {
  parseAppointmentsOutput,
  extractDefaultFirstName,
  isPhoneValid,
  applyTestModePhone,
  buildSendSummary,
  buildUniformSendResults
} = require('../feedbackLogic');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SETTINGS_KEY = 'feedback_test_mode';

function getTestMode() {
  const row = settingsQueries.get.get(SETTINGS_KEY);
  return row ? row.value === 'true' : true;
}

// GET /api/hub/feedback/appointments?date=YYYY-MM-DD
// Separate from sheetsRepository: this reads Google Calendar live, on demand,
// via Make - not the periodically-synced spreadsheet the rest of the Hub uses.
router.get('/appointments', async (req, res) => {
  const { date } = req.query;
  if (!date || !DATE_RE.test(date)) {
    return res.status(400).json({ error: 'נדרש תאריך תקין בפורמט YYYY-MM-DD' });
  }

  try {
    const outputs = await makeClient.fetchAppointmentsForDate(date);
    const raw = parseAppointmentsOutput(outputs);

    // Explicit allowlist: `summary` may contain an ID number and must never reach the client.
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
    console.error('[Hub Feedback] Fetch appointments error:', err.message);
    res.status(502).json({ error: 'שגיאה בשליפת הרשימה מ-Make' });
  }
});

// GET /api/hub/feedback/settings
router.get('/settings', (req, res) => {
  res.json({ testMode: getTestMode() });
});

// PUT /api/hub/feedback/settings - { testMode: boolean }
router.put('/settings', (req, res) => {
  const { testMode } = req.body;
  if (typeof testMode !== 'boolean') {
    return res.status(400).json({ error: 'testMode must be boolean' });
  }
  settingsQueries.set.run(SETTINGS_KEY, String(testMode));
  logAudit({
    actorEmail: req.hubUser.email,
    actorRole: req.hubUser.role,
    action: 'FEEDBACK_TEST_MODE_SET',
    target: String(testMode),
    req
  });
  res.json({ testMode });
});

// POST /api/hub/feedback/send - { date, items: [{ event_id, first_name, phone, medreviews, google_haifa, google_tlv }] }
router.post('/send', async (req, res) => {
  const { date, items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'נדרש לפחות פריט אחד לשליחה' });
  }

  const testMode = getTestMode();
  const preparedItems = applyTestModePhone(items, testMode);

  // mode="LIVE" is the only value that reaches real recipients - a second, Make-side
  // guard on top of this route's own test-mode phone override.
  const mode = testMode ? 'TEST' : 'LIVE';

  let results;
  try {
    const result = await makeClient.runScenario(makeClient.SEND_FEEDBACK_SCENARIO_ID, { mode, items: preparedItems });
    const status = result && result.outputs && result.outputs.status;
    if (status !== 'completed') {
      throw new Error(`Unexpected Make status: ${status}`);
    }
    // The scenario reports one aggregate status, not a per-item result.
    results = buildUniformSendResults(items, 'sent');
  } catch (err) {
    console.error('[Hub Feedback] Send error:', err.message);
    return res.status(502).json({ error: 'שגיאה בשליחה דרך Make' });
  }

  // Audit only counts, never names/phones - patient data stays out of the log.
  const summary = buildSendSummary(items);
  logAudit({
    actorEmail: req.hubUser.email,
    actorRole: req.hubUser.role,
    action: 'FEEDBACK_SEND',
    target: `date=${date || ''};medreviews=${summary.medreviews};haifa=${summary.googleHaifa};tlv=${summary.googleTlv};test_mode=${testMode}`,
    req
  });

  res.json({ results, testMode });
});

module.exports = router;
