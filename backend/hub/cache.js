// Small in-memory TTL cache for Google Sheets reads (phase 0 needs 1-5 minutes
// of staleness at most, not a full cache layer / Redis).
const config = require('./config');

const store = new Map();

function cacheGet(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

function cacheSet(key, value, ttlMs) {
  store.set(key, { value, expiresAt: Date.now() + (ttlMs || config.cacheTtlMs) });
}

function cacheClear() {
  store.clear();
}

module.exports = { cacheGet, cacheSet, cacheClear };
