const { SESSION_COOKIE, verifySessionToken } = require('./auth');

function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies[SESSION_COOKIE];
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const payload = verifySessionToken(token);
    req.hubUser = { email: payload.email, role: payload.role };
    next();
  } catch (err) {
    res.clearCookie(SESSION_COOKIE);
    res.status(401).json({ error: 'Session expired, please sign in again' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.hubUser || !roles.includes(req.hubUser.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
