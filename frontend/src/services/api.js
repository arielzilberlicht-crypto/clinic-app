import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// ─── Appointments ─────────────────────────────────────────────────────────────
export const appointmentsApi = {
  getAll: (params) => api.get('/appointments', { params }),
  getToday: () => api.get('/appointments/today'),
  getStats: () => api.get('/appointments/stats'),
  getById: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  cancel: (id) => api.post(`/appointments/${id}/cancel`),
  sendReminder: (id, type) => api.post(`/appointments/${id}/send-reminder`, { type })
};

// ─── Patients ─────────────────────────────────────────────────────────────────
export const patientsApi = {
  getAll: (q) => api.get('/patients', { params: q ? { q } : {} }),
  getById: (id) => api.get(`/patients/${id}`),
  getAppointments: (id) => api.get(`/patients/${id}/appointments`),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data)
};

// ─── Calendar ─────────────────────────────────────────────────────────────────
export const calendarApi = {
  getStatus: () => api.get('/calendar/status'),
  getAuthUrl: () => api.get('/calendar/auth-url'),
  getEvents: (params) => api.get('/calendar/events', { params }),
  sync: (params) => api.post('/calendar/sync', params)
};

// ─── Templates ────────────────────────────────────────────────────────────────
export const templatesApi = {
  getAll: () => api.get('/templates'),
  getByName: (name) => api.get(`/templates/${name}`),
  update: (name, content) => api.put(`/templates/${name}`, { content })
};

export default api;
