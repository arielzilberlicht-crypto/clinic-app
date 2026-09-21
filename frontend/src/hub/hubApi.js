import axios from 'axios';

// Separate axios instance for the Clinic Automation Hub: it authenticates
// with an httpOnly session cookie (Google sign-in), not the rest of the app.
const hubApi = axios.create({
  baseURL: '/api/hub',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

export default hubApi;
