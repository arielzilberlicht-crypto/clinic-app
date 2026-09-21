const db = require('../db/database');

db.exec(`
  CREATE TABLE IF NOT EXISTS hub_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts DATETIME DEFAULT CURRENT_TIMESTAMP,
    actor_email TEXT,
    actor_role TEXT,
    action TEXT NOT NULL,
    target TEXT,
    ip TEXT,
    user_agent TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_hub_audit_ts ON hub_audit_log(ts);
`);

const insertStmt = db.prepare(`
  INSERT INTO hub_audit_log (actor_email, actor_role, action, target, ip, user_agent)
  VALUES (@actorEmail, @actorRole, @action, @target, @ip, @userAgent)
`);

// Every login, logout, denied login and ID reveal must go through here -
// this is the audit trail the doctor requires for medical-data access.
function logAudit({ actorEmail, actorRole, action, target, req }) {
  insertStmt.run({
    actorEmail: actorEmail || null,
    actorRole: actorRole || null,
    action,
    target: target || null,
    ip: req ? req.ip : null,
    userAgent: req ? req.get('user-agent') || null : null
  });
}

const listRecentStmt = db.prepare(`SELECT * FROM hub_audit_log ORDER BY ts DESC LIMIT ?`);

function listRecent(limit = 200) {
  return listRecentStmt.all(limit);
}

module.exports = { logAudit, listRecent };
