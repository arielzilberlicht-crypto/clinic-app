const DEFAULT_TEST_PHONE = '0522904352';

// Make returns `appointments` either as an array or as a JSON string; normalize to an array.
function parseAppointmentsOutput(outputs) {
  let appointments = outputs && outputs.appointments;

  if (typeof appointments === 'string') {
    try {
      appointments = JSON.parse(appointments);
    } catch {
      appointments = [];
    }
  }

  return Array.isArray(appointments) ? appointments : [];
}

// Calendar titles are written "משפחה פרטי" (last name first), so the default
// first name is the last word; a single-word title is left as-is.
function extractDefaultFirstName(name) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1];
}

function isPhoneValid(phone) {
  return !!phone && phone !== '0';
}

// Test mode is enforced here, server-side, so a tampered client can't bypass it.
function applyTestModePhone(items, testMode, testPhone = DEFAULT_TEST_PHONE) {
  if (!testMode) return items;
  return items.map(item => ({ ...item, phone: testPhone }));
}

function buildSendSummary(items) {
  return items.reduce((acc, item) => {
    if (item.medreviews) acc.medreviews++;
    if (item.google_haifa) acc.googleHaifa++;
    if (item.google_tlv) acc.googleTlv++;
    return acc;
  }, { medreviews: 0, googleHaifa: 0, googleTlv: 0 });
}

// Used until the real Make send scenario exists (see FEEDBACK_SEND_SCENARIO_ID).
function buildMockSendResults(items) {
  return items.map(item => {
    const valid = isPhoneValid(item.phone);
    return {
      event_id: item.event_id,
      status: valid ? 'sent' : 'failed',
      reason: valid ? null : 'מספר טלפון לא תקין'
    };
  });
}

module.exports = {
  DEFAULT_TEST_PHONE,
  parseAppointmentsOutput,
  extractDefaultFirstName,
  isPhoneValid,
  applyTestModePhone,
  buildSendSummary,
  buildMockSendResults
};
