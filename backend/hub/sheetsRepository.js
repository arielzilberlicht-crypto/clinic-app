const config = require('./config');
const columns = require('./sheetColumns');
const { getSheetsClient } = require('./googleSheetsClient');
const { cacheGet, cacheSet } = require('./cache');
const { normalize, mapByAliases } = require('./mapRow');

async function fetchRawValues(spreadsheetId, tabName) {
  const cacheKey = `raw:${spreadsheetId}:${tabName}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const sheets = await getSheetsClient();
  const { data } = await sheets.spreadsheets.values.get({ spreadsheetId, range: tabName });
  const values = data.values || [];
  cacheSet(cacheKey, values);
  return values;
}

function headerHasAnyAlias(headerRow, aliasMap) {
  const normalizedHeader = (headerRow || []).map(normalize);
  const allAliases = Object.values(aliasMap).flat().map(normalize);
  return normalizedHeader.some(cell => allAliases.includes(cell));
}

function hasData(row) {
  return row.some(cell => cell !== '' && cell !== undefined && cell !== null);
}

function rowsToRecordsByHeader(values, aliasMap) {
  const [header, ...rows] = values;
  return rows.filter(hasData).map(row => {
    const raw = {};
    header.forEach((h, i) => { raw[h] = row[i] !== undefined ? row[i] : ''; });
    return mapByAliases(raw, aliasMap);
  });
}

function rowsToRecordsByPosition(values, fieldOrder) {
  return values.filter(hasData).map(row => {
    const record = {};
    fieldOrder.forEach((field, i) => { record[field] = row[i] !== undefined ? row[i] : ''; });
    return record;
  });
}

async function getTabRecords(spreadsheetId, tabName, aliasMap) {
  const values = await fetchRawValues(spreadsheetId, tabName);
  if (values.length === 0) return [];
  return rowsToRecordsByHeader(values, aliasMap);
}

async function getAppointments() {
  return getTabRecords(config.spreadsheetId, config.tabAppointments, columns.appointments);
}

async function getBotState() {
  return getTabRecords(config.spreadsheetId, config.tabBotState, columns.botState);
}

async function getCommunications() {
  return getTabRecords(config.spreadsheetId, config.tabCommunications, columns.communications);
}

async function getPatients() {
  return getTabRecords(config.spreadsheetId, config.tabPatients, columns.patients);
}

async function getLeads() {
  const spreadsheetId = config.leadsSpreadsheetId || config.spreadsheetId;
  const values = await fetchRawValues(spreadsheetId, config.tabLeads);
  if (values.length === 0) return [];

  if (headerHasAnyAlias(values[0], columns.leads)) {
    return rowsToRecordsByHeader(values, columns.leads);
  }

  // No recognizable header row - fall back to the documented column order
  // (A date, B name, C phone, D status, E subject/source, F summary, G email).
  console.warn('[Hub] Leads tab has no recognizable header row; falling back to positional mapping (A-G). Verify column order with the doctor.');
  return rowsToRecordsByPosition(values, ['date', 'name', 'phone', 'status', 'subjectSource', 'summary', 'email']);
}

// Returns null (rather than throwing) when the Alerts tab does not exist yet,
// since it is a planned addition Make does not write to in phase 0.
async function getAlerts() {
  try {
    const values = await fetchRawValues(config.spreadsheetId, config.tabAlerts);
    if (values.length === 0) return [];
    return rowsToRecordsByHeader(values, columns.alerts);
  } catch (err) {
    return null;
  }
}

module.exports = { getAppointments, getBotState, getCommunications, getPatients, getLeads, getAlerts };
