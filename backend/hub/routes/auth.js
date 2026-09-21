const express = require('express');
const router = express.Router();
const config = require('../config');
const { SESSION_COOKIE, verifyGoogleCredential, lookupRole, issueSessionToken } = require('../auth');
const { requireAuth } = require('../authMiddleware');
const { logAudit } = require('../auditLog');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 12 * 60 * 60 * 1000
};

// POST /api/hub/auth/google - exchange a Google Identity Services credential
// for a Hub session, gated by the allow-list.
router.post('/google', async (req, res) => {
  if (!config.isAuthConfigured()) {
    return res.status(503).json({ error: 'Hub sign-in is not configured yet' });
  }

  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Missing credential' });

  let email;
  try {
    ({ email } = await verifyGoogleCredential(credential));
  } catch (err) {
    console.error('[Hub Auth] Google credential verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid Google credential' });
  }

  const role = lookupRole(email);
  if (!role) {
    logAudit({ actorEmail: email, actorRole: null, action: 'LOGIN_DENIED', target: null, req });
    return res.status(403).json({ error: 'This Google account is not authorized for the Clinic Automation Hub' });
  }

  const token = issueSessionToken(email, role);
  res.cookie(SESSION_COOKIE, token, COOKIE_OPTIONS);
  logAudit({ actorEmail: email, actorRole: role, action: 'LOGIN', target: null, req });
  res.json({ email, role });
});

router.post('/logout', requireAuth, (req, res) => {
  logAudit({ actorEmail: req.hubUser.email, actorRole: req.hubUser.role, action: 'LOGOUT', target: null, req });
  res.clearCookie(SESSION_COOKIE);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ email: req.hubUser.email, role: req.hubUser.role });
});

module.exports = router;
