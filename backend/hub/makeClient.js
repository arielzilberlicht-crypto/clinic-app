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

async function getExecution(scenarioId, executionId) {
  const token = getToken();
  const res = await axios.get(
    `${MAKE_BASE_URL}/scenarios/${scenarioId}/executions/${executionId}`,
    { headers: { Authorization: `Token ${token}` } }
  );
  return res.data;
}

// The run() response doesn't always carry `outputs` inline (per Make's docs, this can
// depend on execution timing) - fall back to a separate execution lookup when it's missing.
async function runScenarioAndGetOutputs(scenarioId, data) {
  const runResult = await runScenario(scenarioId, data);
  if (runResult && runResult.outputs) return runResult.outputs;

  if (!runResult || !runResult.executionId) return undefined;

  const detail = await getExecution(scenarioId, runResult.executionId);
  // TEMPORARY DIAGNOSTIC - shape only, never patient content. Remove after debugging.
  console.log('[makeClient][DEBUG] execution detail top-level keys:', detail ? Object.keys(detail) : '(none)');
  return detail && (detail.outputs || (detail.execution && detail.execution.outputs));
}

async function fetchAppointmentsForDate(date) {
  return runScenarioAndGetOutputs(FETCH_APPOINTMENTS_SCENARIO_ID, { date });
}

module.exports = {
  runScenario,
  runScenarioAndGetOutputs,
  fetchAppointmentsForDate,
  FETCH_APPOINTMENTS_SCENARIO_ID,
  SEND_FEEDBACK_SCENARIO_ID
};
