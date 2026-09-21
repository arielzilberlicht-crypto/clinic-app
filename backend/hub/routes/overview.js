const express = require('express');
const router = express.Router();
const { getAppointments } = require('../sheetsRepository');
const { getJerusalemDateString, getJerusalemMonthString } = require('../tz');

function isCancelled(appt) {
  return String(appt.status || '').toUpperCase() === 'CANCELLED';
}

function bump(map, key) {
  const label = key || 'לא ידוע';
  if (!map[label]) map[label] = { total: 0, cancelled: 0 };
  return map[label];
}

function toRows(map) {
  return Object.entries(map)
    .map(([key, v]) => ({
      key,
      total: v.total,
      cancelled: v.cancelled,
      cancellationRate: v.total ? Number(((v.cancelled / v.total) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.total - a.total);
}

// GET /api/hub/overview?month=YYYY-MM&insurer=&clinic=&source=
router.get('/', async (req, res) => {
  try {
    const appts = await getAppointments();
    const { month, insurer, clinic, source } = req.query;
    const targetMonth = month || getJerusalemMonthString();

    const filtered = appts.filter(a => {
      if (!a.appointmentStart) return false;
      const start = new Date(a.appointmentStart);
      if (Number.isNaN(start.getTime())) return false;
      if (getJerusalemMonthString(start) !== targetMonth) return false;
      if (insurer && a.insurer !== insurer) return false;
      if (clinic && a.clinic !== clinic) return false;
      if (source && a.source !== source) return false;
      return true;
    });

    const total = filtered.length;
    const cancelled = filtered.filter(isCancelled).length;
    const cancellationRate = total > 0 ? Number(((cancelled / total) * 100).toFixed(1)) : 0;

    const byDay = {};
    const byInsurer = {};
    const byClinic = {};
    const bySource = {};

    for (const a of filtered) {
      const day = getJerusalemDateString(new Date(a.appointmentStart));
      const dayBucket = byDay[day] || { total: 0, cancelled: 0 };
      dayBucket.total++;
      if (isCancelled(a)) dayBucket.cancelled++;
      byDay[day] = dayBucket;

      const cancelledFlag = isCancelled(a);
      bump(byInsurer, a.insurer).total++;
      if (cancelledFlag) bump(byInsurer, a.insurer).cancelled++;
      bump(byClinic, a.clinic).total++;
      if (cancelledFlag) bump(byClinic, a.clinic).cancelled++;
      bump(bySource, a.source).total++;
      if (cancelledFlag) bump(bySource, a.source).cancelled++;
    }

    res.json({
      month: targetMonth,
      totals: { total, cancelled, cancellationRate },
      byDay: Object.entries(byDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, ...v })),
      byInsurer: toRows(byInsurer),
      byClinic: toRows(byClinic),
      bySource: toRows(bySource)
    });
  } catch (err) {
    console.error('[Hub Overview] error:', err.message);
    res.status(502).json({ error: 'Failed to read the Appointments sheet', detail: err.message });
  }
});

module.exports = router;
