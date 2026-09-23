const axios = require('axios');

const MAKE_BASE_URL = 'https://eu2.make.com/api/v2';

// "משיכת רשימת מטופלות ליום - משובים", eu2, team 787831 - existing, active scenario.
const FETCH_APPOINTMENTS_SCENARIO_ID = '9852448';

function getToken() {
  const token = process.env.MAKE_API_TOKEN;
  if (!token) throw new Error('MAKE_API_TOKEN not configured');
  return token;
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

module.exports = { runScenario, fetchAppointmentsForDate, FETCH_APPOINTMENTS_SCENARIO_ID };
