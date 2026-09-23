require('dotenv').config();

// Clinic Automation Hub configuration. All values come from environment
// variables so no spreadsheet IDs, service account keys or allow-listed
// emails ever live in the repo.

function parseAllowedUsers() {
  const raw = process.env.HUB_ALLOWED_USERS || '[]';
  try {
    const list = JSON.parse(raw);
    const map = new Map();
    for (const entry of list) {
      if (entry && entry.email && entry.role) {
        map.set(String(entry.email).toLowerCase().trim(), String(entry.role).toUpperCase());
      }
    }
    return map;
  } catch (err) {
    console.error('[Hub] HUB_ALLOWED_USERS must be a JSON array like [{"email":"doctor@example.com","role":"DOCTOR"}]:', err.message);
    return new Map();
  }
}

const config = {
  spreadsheetId: process.env.HUB_SPREADSHEET_ID || '',
  leadsSpreadsheetId: process.env.HUB_LEADS_SPREADSHEET_ID || '',

  tabAppointments: process.env.HUB_TAB_APPOINTMENTS || 'Appointments',
  tabBotState: process.env.HUB_TAB_BOT_STATE || 'Bot_State',
  tabCommunications: process.env.HUB_TAB_COMMUNICATIONS || 'Communications',
  tabPatients: process.env.HUB_TAB_PATIENTS || 'Patients',
  tabAlerts: process.env.HUB_TAB_ALERTS || 'Alerts',
  tabLeads: process.env.HUB_TAB_LEADS || 'קליטת ליד',

  serviceAccountEmail: process.env.HUB_GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
  serviceAccountKey: (process.env.HUB_GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n'),

  oauthClientId: process.env.HUB_GOOGLE_OAUTH_CLIENT_ID || '',
  sessionSecret: process.env.HUB_SESSION_SECRET || '',

  cacheTtlMs: Number(process.env.HUB_CACHE_TTL_SECONDS || 120) * 1000,

  allowedUsers: parseAllowedUsers(),

  // "שליחת משובים" tab - separate from the Sheets read above: this calls two
  // on-demand Make scenarios directly (today's calendar list + the send action).
  makeApiToken: process.env.MAKE_API_TOKEN || '',

  isSheetsConfigured() {
    return Boolean(this.spreadsheetId && this.serviceAccountEmail && this.serviceAccountKey);
  },

  isAuthConfigured() {
    return Boolean(this.oauthClientId && this.sessionSecret);
  },

  isMakeConfigured() {
    return Boolean(this.makeApiToken);
  }
};

module.exports = config;
