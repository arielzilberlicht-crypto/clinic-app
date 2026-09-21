const { google } = require('googleapis');
const config = require('./config');

let cachedClient = null;

// Service account, read-only scope, no broad Drive access - this must only
// ever be granted Viewer access to the single Clinic Automation Hub
// spreadsheet (and the separate leads spreadsheet), never a Drive-wide scope.
async function getSheetsClient() {
  if (cachedClient) return cachedClient;

  if (!config.serviceAccountEmail || !config.serviceAccountKey) {
    throw new Error('Google service account is not configured (HUB_GOOGLE_SERVICE_ACCOUNT_EMAIL / HUB_GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)');
  }

  const auth = new google.auth.JWT({
    email: config.serviceAccountEmail,
    key: config.serviceAccountKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });

  await auth.authorize();
  cachedClient = google.sheets({ version: 'v4', auth });
  return cachedClient;
}

module.exports = { getSheetsClient };
