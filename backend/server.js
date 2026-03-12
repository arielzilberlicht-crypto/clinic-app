require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { initSchema } = require('./db/schema');
const { startScheduler } = require('./services/scheduler');

const appointmentsRouter = require('./routes/appointments');
const patientsRouter = require('./routes/patients');
const calendarRouter = require('./routes/calendar');
const templatesRouter = require('./routes/templates');
const intakeRouter = require('./routes/intake');

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
initSchema();
startScheduler();

app.listen(PORT, () => {
  console.log(`\n🏥 Clinic Management Server running on http://localhost:${PORT}`);
  console.log(`📅 Google Calendar: ${require('./services/googleCalendar').isAuthenticated() ? '✅ Connected' : '❌ Not connected - visit /api/calendar/auth-url'}`);
  console.log(`📱 Green API: ${process.env.GREEN_API_INSTANCE_ID ? '✅ Configured' : '⚠️  Not configured'}\n`);
});

module.exports = app;
