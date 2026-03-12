const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(__dirname, '../../data/google_token.json');

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/calendar/oauth/callback'
  );
}

function getAuthUrl() {
  const oauth2Client = getOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    prompt: 'consent'
  });
}

async function exchangeCode(code) {
  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  saveTokens(tokens);
  return tokens;
}

function saveTokens(tokens) {
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
}

function loadTokens() {
  if (!fs.existsSync(TOKEN_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function isAuthenticated() {
  return loadTokens() !== null;
}

async function getAuthenticatedClient() {
  const tokens = loadTokens();
  if (!tokens) throw new Error('Google Calendar not authenticated');

  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials(tokens);

  // Auto-refresh token if needed
  oauth2Client.on('tokens', (newTokens) => {
    const current = loadTokens() || {};
    saveTokens({ ...current, ...newTokens });
  });

  return oauth2Client;
}

async function getCalendarClient() {
  const auth = await getAuthenticatedClient();
  return google.calendar({ version: 'v3', auth });
}

// ─── Calendar Operations ─────────────────────────────────────────────────────

async function listEvents(timeMin, timeMax) {
  const calendar = await getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  const res = await calendar.events.list({
    calendarId,
    timeMin: timeMin || new Date().toISOString(),
    timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 250
  });

  return res.data.items || [];
}

async function getEvent(eventId) {
  const calendar = await getCalendarClient();
  const res = await calendar.events.get({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    eventId
  });
  return res.data;
}

async function createEvent({ fullName, phone, idNumber, hmo, startDatetime, endDatetime, notes }) {
  const calendar = await getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  const descParts = [];
  if (phone) descParts.push(`טלפון: ${phone}`);
  if (idNumber) descParts.push(`ת.ז.: ${idNumber}`);
  if (hmo) descParts.push(`קופת חולים: ${hmo}`);
  if (notes) descParts.push(`הערות: ${notes}`);

  const event = {
    summary: fullName,
    description: descParts.join(' | '),
    start: { dateTime: startDatetime, timeZone: 'Asia/Jerusalem' },
    end: { dateTime: endDatetime || addHour(startDatetime), timeZone: 'Asia/Jerusalem' }
  };

  const res = await calendar.events.insert({ calendarId, resource: event });
  return res.data;
}

async function updateEventDescription(eventId, description) {
  const calendar = await getCalendarClient();
  const res = await calendar.events.patch({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    eventId,
    resource: { description }
  });
  return res.data;
}

async function updateEvent(eventId, updates) {
  const calendar = await getCalendarClient();
  const res = await calendar.events.patch({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    eventId,
    resource: updates
  });
  return res.data;
}

async function deleteEvent(eventId) {
  const calendar = await getCalendarClient();
  await calendar.events.delete({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    eventId
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function addHour(isoString) {
  const d = new Date(isoString);
  d.setHours(d.getHours() + 1);
  return d.toISOString();
}

function parseEventToAppointment(event) {
  const start = event.start?.dateTime || event.start?.date;
  const end = event.end?.dateTime || event.end?.date;

  const startDate = new Date(start);
  const appointmentDate = startDate.toISOString().split('T')[0];
  const appointmentTime = startDate.toTimeString().slice(0, 5);

  // Parse description for phone/id
  const desc = event.description || '';
  const phoneMatch = desc.match(/טלפון:\s*([^\s|]+)/);
  const idMatch = desc.match(/ת\.ז\.:\s*([^\s|]+)/);
  const hmoMatch = desc.match(/קופת חולים:\s*([^|]+)/);

  const fullName = event.summary || '';
  const firstName = fullName.split(' ')[0] || fullName;

  return {
    full_name: fullName,
    first_name: firstName,
    phone: phoneMatch?.[1]?.trim() || '',
    id_number: idMatch?.[1]?.trim() || '',
    hmo: hmoMatch?.[1]?.trim() || '',
    appointment_date: appointmentDate,
    appointment_time: appointmentTime,
    start_datetime: start,
    end_datetime: end,
    calendar_event_id: event.id,
    status: event.status === 'cancelled' ? 'cancelled' : 'active'
  };
}

module.exports = {
  getAuthUrl,
  exchangeCode,
  isAuthenticated,
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  updateEventDescription,
  deleteEvent,
  parseEventToAppointment
};
