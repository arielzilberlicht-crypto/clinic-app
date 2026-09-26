const test = require('node:test');
const assert = require('node:assert/strict');

const {
  parseAppointmentsOutput,
  extractDefaultFirstName,
  sanitizePhone,
  isPhoneValid,
  applyTestModePhone,
  buildSendSummary,
  buildUniformSendResults
} = require('../feedbackLogic');

test('parseAppointmentsOutput: array passthrough', () => {
  const outputs = { appointments: [{ event_id: '1' }] };
  assert.deepEqual(parseAppointmentsOutput(outputs), [{ event_id: '1' }]);
});

test('parseAppointmentsOutput: JSON string', () => {
  const outputs = { appointments: JSON.stringify([{ event_id: '1' }]) };
  assert.deepEqual(parseAppointmentsOutput(outputs), [{ event_id: '1' }]);
});

test('parseAppointmentsOutput: empty list', () => {
  assert.deepEqual(parseAppointmentsOutput({ appointments: [] }), []);
});

test('parseAppointmentsOutput: missing field', () => {
  assert.deepEqual(parseAppointmentsOutput({}), []);
  assert.deepEqual(parseAppointmentsOutput(undefined), []);
});

test('parseAppointmentsOutput: malformed JSON string', () => {
  assert.deepEqual(parseAppointmentsOutput({ appointments: '{not json' }), []);
});

test('extractDefaultFirstName: first word of a two-word name', () => {
  assert.equal(extractDefaultFirstName('ענבל כהן'), 'ענבל');
});

test('extractDefaultFirstName: single-word name unchanged', () => {
  assert.equal(extractDefaultFirstName('ענבל'), 'ענבל');
});

test('extractDefaultFirstName: empty/missing name', () => {
  assert.equal(extractDefaultFirstName(''), '');
  assert.equal(extractDefaultFirstName(undefined), '');
});

test('sanitizePhone: strips hyphens and spaces from manually-entered numbers', () => {
  assert.equal(sanitizePhone('052-6516944'), '0526516944');
  assert.equal(sanitizePhone('052 690 4352'), '0526904352');
});

test('sanitizePhone: empty/missing phone', () => {
  assert.equal(sanitizePhone(''), '');
  assert.equal(sanitizePhone(undefined), '');
});

test('isPhoneValid: "0" is invalid, a real number is valid', () => {
  assert.equal(isPhoneValid('0'), false);
  assert.equal(isPhoneValid(''), false);
  assert.equal(isPhoneValid(undefined), false);
  assert.equal(isPhoneValid('0522904352'), true);
});

test('applyTestModePhone: overrides phone for every item when on', () => {
  const items = [{ phone: '0501111111' }, { phone: '0502222222' }];
  const result = applyTestModePhone(items, true, '0522904352');
  assert.ok(result.every(i => i.phone === '0522904352'));
});

test('applyTestModePhone: leaves items untouched when off', () => {
  const items = [{ phone: '0501111111' }];
  const result = applyTestModePhone(items, false, '0522904352');
  assert.deepEqual(result, items);
});

test('buildSendSummary: counts each option independently', () => {
  const items = [
    { medreviews: true, google_haifa: false, google_tlv: true },
    { medreviews: true, google_haifa: true, google_tlv: false },
    { medreviews: false, google_haifa: false, google_tlv: false }
  ];
  assert.deepEqual(buildSendSummary(items), { medreviews: 2, googleHaifa: 1, googleTlv: 1 });
});

test('buildUniformSendResults: applies the same status to every item (Make reports one aggregate status)', () => {
  const items = [{ event_id: 'a' }, { event_id: 'b' }, { event_id: 'c' }];
  assert.deepEqual(buildUniformSendResults(items, 'sent'), [
    { event_id: 'a', status: 'sent', reason: null },
    { event_id: 'b', status: 'sent', reason: null },
    { event_id: 'c', status: 'sent', reason: null }
  ]);
});

test('buildUniformSendResults: carries an optional shared reason', () => {
  const items = [{ event_id: 'a' }];
  assert.deepEqual(buildUniformSendResults(items, 'failed', 'שגיאה בשליחה'), [
    { event_id: 'a', status: 'failed', reason: 'שגיאה בשליחה' }
  ]);
});
