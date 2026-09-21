const test = require('node:test');
const assert = require('node:assert/strict');
const { mapByAliases } = require('../mapRow');

test('mapByAliases matches headers case- and whitespace-insensitively', () => {
  const raw = { 'Patient ID': 'PAT-1', '  Phone ': '0501234567', Status: 'SCHEDULED' };
  const aliasMap = { patientId: ['patient id'], phone: ['phone'], status: ['status'] };
  assert.deepEqual(mapByAliases(raw, aliasMap), {
    patientId: 'PAT-1',
    phone: '0501234567',
    status: 'SCHEDULED'
  });
});

test('mapByAliases falls back to an empty string for missing columns', () => {
  const raw = { Name: 'דנה' };
  const aliasMap = { name: ['name'], phone: ['phone'] };
  assert.deepEqual(mapByAliases(raw, aliasMap), { name: 'דנה', phone: '' });
});
