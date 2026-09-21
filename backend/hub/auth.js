const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const config = require('./config');

const SESSION_COOKIE = 'hub_session';
const SESSION_TTL = '12h';

function getGoogleClient() {
  if (!config.oauthClientId) {
    throw new Error('HUB_GOOGLE_OAUTH_CLIENT_ID is not configured');
  }
  return new OAuth2Client(config.oauthClientId);
}

// Verifies a Google Identity Services credential (ID token) server-side and
// returns the signed-in email. Never trust an email the client claims
// without this verification.
async function verifyGoogleCredential(credential) {
  const client = getGoogleClient();
  const ticket = await client.verifyIdToken({ idToken: credential, audience: config.oauthClientId });
  const payload = ticket.getPayload();
  if (!payload || !payload.email || !payload.email_verified) {
    throw new Error('Google credential is missing a verified email');
  }
  return { email: payload.email.toLowerCase().trim(), name: payload.name || '' };
}

function lookupRole(email) {
  return config.allowedUsers.get(String(email).toLowerCase().trim()) || null;
}

function issueSessionToken(email, role) {
  if (!config.sessionSecret) throw new Error('HUB_SESSION_SECRET is not configured');
  return jwt.sign({ email, role }, config.sessionSecret, { expiresIn: SESSION_TTL });
}

function verifySessionToken(token) {
  if (!config.sessionSecret) throw new Error('HUB_SESSION_SECRET is not configured');
  return jwt.verify(token, config.sessionSecret);
}

module.exports = {
  SESSION_COOKIE,
  SESSION_TTL,
  verifyGoogleCredential,
  lookupRole,
  issueSessionToken,
  verifySessionToken
};
