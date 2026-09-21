const test = require('node:test');
const assert = require('node:assert/strict');
const { isValidIsraeliId, maskIsraeliId } = require('../israeliId');

test('isValidIsraeliId accepts a known valid checksum', () => {
  assert.equal(isValidIsraeliId('300000007'), true);
});

test('isValidIsraeliId rejects an invalid checksum', () => {
  assert.equal(isValidIsraeliId('123456789'), false);
});

test('isValidIsraeliId rejects non-numeric or wrong-length input', () => {
  assert.equal(isValidIsraeliId('abcdefghi'), false);
  assert.equal(isValidIsraeliId(''), false);
  assert.equal(isValidIsraeliId('12'), false);
});

test('maskIsraeliId keeps only the last 3 digits visible', () => {
  assert.equal(maskIsraeliId('300000007'), '••••••007');
  assert.equal(maskIsraeliId(''), '');
  assert.equal(maskIsraeliId('12'), '12');
});
