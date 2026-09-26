const axios = require('axios');
const config = require('./config');

const MAKE_BASE_URL = 'https://eu2.make.com/api/v2';

// "משיכת רשימת מטופלות ליום - משובים", eu2, team 787831 - existing, active scenario.
const FETCH_APPOINTMENTS_SCENARIO_ID = '9852448';

// "שליחת בקשות משוב - מהדשבורד", eu2, team 787831 - existing, active scenario.
const SEND_FEEDBACK_SCENARIO_ID = '9853470';

// "Feedback_Fetch_Cache" data store: 9852448's run() response never reliably carries
// `outputs` back through the API (confirmed empirically - see git history for this
// file), so the scenario now also writes its result here (before its ReturnData
// module, which otherwise short-circuits anything placed after it) and the dashboard
// reads it back by key instead of relying on the run/logs API for the payload.
const FEEDBACK_FETCH_DATASTORE_ID = 190048;

function getToken() {
  if (!config.makeApiToken) throw new Error('MAKE_API_TOKEN not configured');
  return config.makeApiToken;
}

async function runScenario(scenarioId, data) {
  const token = getToken();
  const res = await axios.post(
    `${MAKE_BASE_URL}/scenarios/${scenarioId}/run`,
    { data, responsive: true },
    { headers: { Authorization: `Token ${token}` } }
  );
  return res.data;
}

async function getDataStoreRecord(dataStoreId, key) {
  const token = getToken();
  const res = await axios.get(
    `${MAKE_BASE_URL}/data-stores/${dataStoreId}/data`,
    { headers: { Authorization: `Token ${token}` } }
  );
  const records = Array.isArray(res.data) ? res.data : (res.data && res.data.records) || [];
  return records.find(r => r.key === key);
}

async function fetchAppointmentsForDate(date) {
  await runScenario(FETCH_APPOINTMENTS_SCENARIO_ID, { date });
  const record = await getDataStoreRecord(FEEDBACK_FETCH_DATASTORE_ID, date);
  return { appointments: record && record.data && record.data.appointments_json };
}

module.exports = {
  runScenario,
  fetchAppointmentsForDate,
  FETCH_APPOINTMENTS_SCENARIO_ID,
  SEND_FEEDBACK_SCENARIO_ID,
  FEEDBACK_FETCH_DATASTORE_ID
};
