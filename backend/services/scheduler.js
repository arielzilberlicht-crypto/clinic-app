const cron = require('node-cron');
const { appointmentQueries, templateQueries } = require('../db/queries');
const { sendMessage, sendToDoctor, renderTemplate, formatDateHebrew } = require('./greenApi');

function startScheduler() {
  // Run every day at 08:00 Israel time
  cron.schedule('0 8 * * *', async () => {
    console.log('[Scheduler] Running daily reminders at 08:00');
    await sendReminders4Days();
    await sendReminders2Days();
  }, {
    timezone: 'Asia/Jerusalem'
  });

  console.log('[Scheduler] Daily reminder job scheduled for 08:00 Israel time');
}

async function sendReminders4Days() {
  const appointments = appointmentQueries.getPendingReminders4Days.all();
  const template = templateQueries.getByName.get('reminder_4days');

  if (!template) {
    console.error('[Scheduler] reminder_4days template not found');
    return;
  }

  console.log(`[Scheduler] Sending 4-day reminders for ${appointments.length} appointments`);

  for (const appt of appointments) {
    try {
      const message = renderTemplate(template.content, {
        firstName: appt.first_name,
        appointmentDate: formatDateHebrew(appt.appointment_date),
        appointmentTime: appt.appointment_time
      });

      await sendMessage(appt.phone, message);
      appointmentQueries.markReminder4DaysSent.run(appt.id);
      console.log(`[Scheduler] 4-day reminder sent to ${appt.full_name}`);
    } catch (err) {
      console.error(`[Scheduler] Failed to send 4-day reminder to ${appt.full_name}:`, err.message);
    }
  }
}

async function sendReminders2Days() {
  const appointments = appointmentQueries.getPendingReminders2Days.all();
  const template = templateQueries.getByName.get('reminder_2days');

  if (!template) {
    console.error('[Scheduler] reminder_2days template not found');
    return;
  }

  console.log(`[Scheduler] Sending 2-day reminders for ${appointments.length} appointments`);

  for (const appt of appointments) {
    try {
      const message = renderTemplate(template.content, {
        firstName: appt.first_name,
        appointmentDate: formatDateHebrew(appt.appointment_date),
        appointmentTime: appt.appointment_time
      });

      await sendMessage(appt.phone, message);
      appointmentQueries.markReminder2DaysSent.run(appt.id);
      console.log(`[Scheduler] 2-day reminder sent to ${appt.full_name}`);
    } catch (err) {
      console.error(`[Scheduler] Failed to send 2-day reminder to ${appt.full_name}:`, err.message);
    }
  }
}

// Manual trigger for testing
async function runRemindersNow() {
  await sendReminders4Days();
  await sendReminders2Days();
}

module.exports = { startScheduler, runRemindersNow };
