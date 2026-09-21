// Maps a raw Sheets row (keyed by literal header text) onto the logical
// field names the rest of the app uses, matching header names case-,
// separator- and whitespace-insensitively (e.g. "Patient_ID", "patient id"
// and "Patient ID" are all treated as the same header). Never assume a
// fixed column position: Make's column order is not a contract, only the
// header text is.
function normalize(text) {
  return String(text || '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}

function mapByAliases(rawRecord, aliasMap) {
  const normalizedRecord = {};
  for (const key of Object.keys(rawRecord)) {
    normalizedRecord[normalize(key)] = rawRecord[key];
  }

  const result = {};
  for (const [field, aliases] of Object.entries(aliasMap)) {
    for (const alias of aliases) {
      const normalizedAlias = normalize(alias);
      if (normalizedAlias in normalizedRecord) {
        result[field] = normalizedRecord[normalizedAlias];
        break;
      }
    }
    if (!(field in result)) result[field] = '';
  }
  return result;
}

module.exports = { normalize, mapByAliases };
