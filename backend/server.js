require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Must run before any require below: db/queries.js (pulled in by the scheduler
// service and by every router) prepares statements against these tables at
// require-time, so on a fresh clone/db this has to come first.
require('./db/schema').initSchema();

const { startScheduler } = require('./services/scheduler');

const appointmentsRouter = require('./routes/appointments');
const patientsRouter = require('./routes/patients');
const calendarRouter = require('./routes/calendar');
const templatesRouter = require('./routes/templates');
const intakeRouter = require('./routes/intake');
const feedbackRouter = require('./routes/feedback');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/appointments', appointmentsRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/intake', intakeRouter);
app.use('/api/feedback', feedbackRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Serve Frontend in Production ─────────────────────────────────────────────
const frontendDist = path.join(__dirname, '../frontend/dist');
if (require('fs').existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────
startScheduler();

app.listen(PORT, () => {
  console.log(`\n🏥 Clinic Management Server running on http://localhost:${PORT}`);
  console.log(`📅 Google Calendar: ${require('./services/googleCalendar').isAuthenticated() ? '✅ Connected' : '❌ Not connected - visit /api/calendar/auth-url'}`);
  console.log(`📱 Green API: ${process.env.GREEN_API_INSTANCE_ID ? '✅ Configured' : '⚠️  Not configured'}`);
  console.log(`⭐ Make (feedback): ${process.env.MAKE_API_TOKEN ? '✅ Configured' : '⚠️  Not configured'}\n`);
});

module.exports = app;
