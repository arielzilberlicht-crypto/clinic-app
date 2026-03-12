const express = require('express');
const router = express.Router();
const calendarService = require('../services/googleCalendar');
const { appointmentQueries } = require('../db/queries');

// GET /api/calendar/auth-url
router.get('/auth-url', (req, res) => {
  const url = calendarService.getAuthUrl();
  res.json({ url });
});

// GET /api/calendar/oauth/callback
router.get('/oauth/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.redirect('/?auth=error');
  }

  try {
    await calendarService.exchangeCode(code);
    res.redirect('/?auth=success');
  } catch (err) {
    console.error('[Calendar] OAuth callback error:', err.message);
    res.redirect('/?auth=error');
  }
});

// GET /api/calendar/status
router.get('/status', (req, res) => {
  res.json({ authenticated: calendarService.isAuthenticated() });
});

// GET /api/calendar/events - fetch from Google Calendar
router.get('/events', async (req, res) => {
  if (!calendarService.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated with Google Calendar' });
  }

  const { from, to } = req.query;
  try {
    const events = await calendarService.listEvents(from, to);
    res.json(events);
  } catch (err) {
    console.error('[Calendar] List events error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/calendar/sync - sync Google Calendar events to DB
router.post('/sync', async (req, res) => {
  if (!calendarService.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated with Google Calendar' });
  }

  try {
    const { from, to } = req.body;
    const events = await calendarService.listEvents(from, to);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const event of events) {
      if (!event.start?.dateTime && !event.start?.date) {
        skipped++;
        continue;
      }

      const parsed = calendarService.parseEventToAppointment(event);
      const existing = appointmentQueries.getByCalendarId.get(event.id);

      if (existing) {
        appointmentQueries.updateByCalendarId.run({
          ...parsed,
          calendar_event_id: event.id
        });
        updated++;
      } else {
        appointmentQueries.create.run({
          patient_id: null,
          ...parsed
        });
        created++;
      }
    }

    res.json({ created, updated, skipped, total: events.length });
  } catch (err) {
    console.error('[Calendar] Sync error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/calendar/webhook - receive calendar change notifications
router.post('/webhook', async (req, res) => {
  // Google Calendar webhook notifications - respond quickly
  res.sendStatus(200);

  const resourceState = req.headers['x-goog-resource-state'];
  const eventId = req.headers['x-goog-changed'];

  if (resourceState === 'sync') return;

  try {
    if (eventId) {
      const event = await calendarService.getEvent(eventId);
      const parsed = calendarService.parseEventToAppointment(event);
      const existing = appointmentQueries.getByCalendarId.get(eventId);

      if (event.status === 'cancelled') {
        appointmentQueries.cancelByCalendarId.run(eventId);
        const { sendToDoctor } = require('../services/greenApi');
        const { templateQueries } = require('../db/queries');
        const template = templateQueries.getByName.get('cancellation_doctor');
        if (template) await sendToDoctor(template.content);
      } else if (existing) {
        appointmentQueries.updateByCalendarId.run({
          ...parsed,
          calendar_event_id: eventId
        });
      } else {
        appointmentQueries.create.run({ patient_id: null, ...parsed });
      }
    }
  } catch (err) {
    console.error('[Calendar] Webhook processing error:', err.message);
  }
});

module.exports = router;
