const axios = require('axios');
const config = require('./config');

const MAKE_BASE_URL = 'https://eu2.make.com/api/v2';

// "משיכת רשימת מטופלות ליום - משובים", eu2, team 787831 - existing, active scenario.
const FETCH_APPOINTMENTS_SCENARIO_ID = '9852448';

// "שליחת בקשות משוב - מהדשבורד", eu2, team 787831 - existing, active scenario.
const SEND_FEEDBACK_SCENARIO_ID = '9853470';

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

async function fetchAppointmentsForDate(date) {
  const result = await runScenario(FETCH_APPOINTMENTS_SCENARIO_ID, { date });
  return result && result.outputs;
}

module.exports = {
  runScenario,
  fetchAppointmentsForDate,
  FETCH_APPOINTMENTS_SCENARIO_ID,
  SEND_FEEDBACK_SCENARIO_ID
};
