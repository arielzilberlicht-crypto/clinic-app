// All Hub date logic runs in Asia/Jerusalem, regardless of server timezone.
// Appointment start times are stored as UTC ISO strings and converted here.
const TZ = 'Asia/Jerusalem';

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

function getJerusalemDateParts(date = new Date()) {
  const parts = dateFormatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return { year: lookup.year, month: lookup.month, day: lookup.day };
}

function getJerusalemDateString(date = new Date()) {
  const { year, month, day } = getJerusalemDateParts(date);
  return `${year}-${month}-${day}`;
}

function getJerusalemMonthString(date = new Date()) {
  const { year, month } = getJerusalemDateParts(date);
  return `${year}-${month}`;
}

module.exports = { TZ, getJerusalemDateParts, getJerusalemDateString, getJerusalemMonthString };
