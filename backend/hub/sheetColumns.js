// Header aliases per tab. The primary alias for each field is the header
// text implied by the build brief; add more aliases here (never hard-coded
// column letters) if the real spreadsheet uses different wording - this file
// is the only place that should need to change.
module.exports = {
  appointments: {
    calendarEventId: ['calendar event id'],
    patientId: ['patient id'],
    phone: ['phone'],
    name: ['name'],
    createdAt: ['created at'],
    appointmentStart: ['appointment start'],
    clinic: ['clinic'],
    insurer: ['insurer'],
    source: ['source'],
    status: ['status'],
    rawId: ['raw id as received', 'raw id'],
    confirmedId: ['confirmed id'],
    idVerification: ['id verification'],
    engagement: ['engagement'],
    confirmedAt: ['confirmed at']
  },

  botState: {
    phone: ['phone'],
    patientId: ['patient id'],
    state: ['state'],
    eventId: ['event id'],
    updatedAt: ['updated at'],
    expectedReplyType: ['expected reply type']
  },

  communications: {
    messageId: ['message id'],
    patientId: ['patient id'],
    phone: ['phone'],
    time: ['time'],
    direction: ['direction'],
    type: ['type'],
    source: ['source'],
    appointmentId: ['appointment id'],
    status: ['status']
  },

  patients: {
    patientId: ['patient id'],
    name: ['name'],
    phone: ['phone'],
    idNumber: ['id number', 'id']
  },

  // The Leads sheet was described to us by column letter (A-G), not by
  // confirmed header text, so it gets more generic aliases plus a positional
  // fallback in sheetsRepository.js.
  leads: {
    date: ['date', 'תאריך'],
    name: ['name', 'שם'],
    phone: ['phone', 'טלפון'],
    status: ['status', 'סטטוס'],
    subjectSource: ['subject', 'source', 'נושא', 'מקור'],
    summary: ['summary', 'סיכום'],
    email: ['email', 'אימייל']
  },

  // Planned addition - not written by Make yet. Proposed in writing to the
  // doctor before Make starts using it (see README).
  alerts: {
    timestamp: ['timestamp'],
    type: ['type'],
    patientRef: ['patient id or phone', 'patient id', 'phone'],
    text: ['text'],
    status: ['status'],
    handledBy: ['handled by'],
    handledAt: ['handled at']
  }
};
