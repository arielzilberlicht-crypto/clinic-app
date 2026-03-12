const axios = require('axios');

const BASE_URL = 'https://api.green-api.com';

function formatPhone(phone) {
  // Convert Israeli phone to WhatsApp format: 972XXXXXXXXX@c.us
  const digits = phone.replace(/\D/g, '');
  let normalized = digits;

  if (digits.startsWith('0')) {
    normalized = '972' + digits.slice(1);
  } else if (!digits.startsWith('972')) {
    normalized = '972' + digits;
  }

  return `${normalized}@c.us`;
}

async function sendMessage(phone, message) {
  const instanceId = process.env.GREEN_API_INSTANCE_ID;
  const token = process.env.GREEN_API_TOKEN;

  if (!instanceId || !token) {
    console.warn('[GreenAPI] Missing credentials, skipping message send');
    return { skipped: true };
  }

  const chatId = formatPhone(phone);
  const url = `${BASE_URL}/waInstance${instanceId}/sendMessage/${token}`;

  const res = await axios.post(url, {
    chatId,
    message
  });

  return res.data;
}

async function sendToDoctor(message) {
  const doctorPhone = process.env.DOCTOR_PHONE || '972522904352';
  return sendMessage(doctorPhone, message);
}

function renderTemplate(template, vars) {
  return template
    .replace(/{{שם פרטי}}/g, vars.firstName || '')
    .replace(/{{תאריך הפגישה}}/g, vars.appointmentDate || '')
    .replace(/{{שעת הפגישה}}/g, vars.appointmentTime || '');
}

function formatDateHebrew(dateStr) {
  // dateStr: YYYY-MM-DD → DD/MM/YYYY
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

module.exports = { sendMessage, sendToDoctor, renderTemplate, formatDateHebrew, formatPhone };
