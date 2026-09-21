// Header aliases per tab. Each field lists every header text seen in
// practice (the phrasing implied by the build brief, plus whatever Make
// actually writes in the real spreadsheet - confirmed 2026-09-21 against
// the live "Clinic Automation Hub - Dr Ariel Zilberlicht" sheet). Add more
// aliases here (never hard-coded column letters) if the header wording
// changes again - this file is the only place that should need to change.
// Matching is case/separator/whitespace-insensitive (see mapRow.js), so
// "Patient_ID", "patient id" and "Patient ID" all match the same alias.
module.exports = {
  appointments: {
    calendarEventId: ['calendar event id', 'Calendar_Event_ID'],
    patientId: ['patient id', 'Patient_ID'],
    phone: ['phone', 'Phone'],
    name: ['name', 'Patient_Name'],
    createdAt: ['created at', 'Created_At'],
    appointmentStart: ['appointment start', 'Appointment_DateTime'],
    clinic: ['clinic', 'Location'],
    // No insurer/HMO column exists in the real sheet today - see note to
    // the doctor. Kept here so it starts working the moment one is added.
    insurer: ['insurer', 'Insurer', 'HMO'],
    source: ['source', 'Source'],
    status: ['status', 'Status'],
    rawId: ['raw id as received', 'raw id', 'Source_ID'],
    confirmedId: ['confirmed id', 'Confirmed_ID'],
    idVerification: ['id verification', 'ID_Verification_Status'],
    engagement: ['engagement', 'Engagement_Status'],
    confirmedAt: ['confirmed at', 'Engagement_Confirmed_At']
  },

  botState: {
    phone: ['phone', 'Phone'],
    patientId: ['patient id', 'Patient_ID'],
    state: ['state', 'Current_State'],
    eventId: ['event id', 'Last_Appointment_ID'],
    updatedAt: ['updated at', 'Updated_At'],
    expectedReplyType: ['expected reply type', 'Expected_Reply_Type']
  },

  communications: {
    messageId: ['message id', 'Communication_ID'],
    patientId: ['patient id', 'Patient_ID'],
    phone: ['phone', 'Phone'],
    time: ['time', 'Timestamp'],
    direction: ['direction', 'Direction'],
    type: ['type', 'Message_Type'],
    source: ['source', 'Scenario_Source'],
    appointmentId: ['appointment id', 'Appointment_or_Surgery_ID'],
    status: ['status', 'Delivery_Status']
  },

  patients: {
    patientId: ['patient id', 'Patient_ID'],
    name: ['name', 'Full_Name'],
    phone: ['phone', 'Phone'],
    idNumber: ['id number', 'id', 'Confirmed_ID']
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
