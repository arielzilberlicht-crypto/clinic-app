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

// The send scenario (9853470) reports one aggregate `status`, not a per-item result,
// so every submitted item gets the same outcome for a given call.
function buildUniformSendResults(items, status, reason = null) {
  return items.map(item => ({ event_id: item.event_id, status, reason }));
}

module.exports = {
  DEFAULT_TEST_PHONE,
  parseAppointmentsOutput,
  extractDefaultFirstName,
  isPhoneValid,
  applyTestModePhone,
  buildSendSummary,
  buildUniformSendResults
};
