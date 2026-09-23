import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/CalendarPage';
import AppointmentsPage from './pages/AppointmentsPage';
import PatientsPage from './pages/PatientsPage';
import TemplatesPage from './pages/TemplatesPage';
import FeedbackPage from './pages/FeedbackPage';
import IntakePage from './pages/IntakePage';
import AppointmentForm from './components/AppointmentForm';
import { calendarApi } from './services/api';

function Sidebar({ onAddAppointment }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [calendarConnected, setCalendarConnected] = useState(false);

  useEffect(() => {
    calendarApi.getStatus()
      .then(r => setCalendarConnected(r.data.authenticated))
      .catch(() => {});
  }, []);

  const navItems = [
    { path: '/', label: 'לוח בקרה', icon: '🏠' },
    { path: '/calendar', label: 'יומן', icon: '📅' },
    { path: '/appointments', label: 'תורים', icon: '🗓️' },
    { path: '/patients', label: 'מטופלות', icon: '👩‍⚕️' },
    { path: '/templates', label: 'תבניות הודעה', icon: '💬' },
    { path: '/feedback', label: 'שליחת משובים', icon: '⭐' }
  ];

  const handleConnectCalendar = async () => {
    const { data } = await calendarApi.getAuthUrl();
    window.location.href = data.url;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>ד"ר אריאל זילברליכט</h1>
        <span>מרפאה פרטית, חיפה</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
          </button>
        ))}

        <div style={{ margin: '16px 12px 8px', height: '1px', background: 'rgba(255,255,255,0.1)' }} />

        <button className="nav-item" onClick={onAddAppointment}>
          <span className="icon">➕</span>
          הוסף תור
        </button>
      </nav>

      <div className="sidebar-footer">
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: calendarConnected ? 'default' : 'pointer' }}
          onClick={calendarConnected ? undefined : handleConnectCalendar}
          title={calendarConnected ? 'Google Calendar מחובר' : 'לחץ להתחבר ל-Google Calendar'}
        >
          <span>{calendarConnected ? '🟢' : '🔴'}</span>
          <span>Google Calendar</span>
        </div>
      </div>
    </aside>
  );
}

function AppLayout() {
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const location = useLocation();

  // Show auth success/error
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const auth = params.get('auth');
    if (auth === 'success') {
      alert('✅ Google Calendar חובר בהצלחה!');
      window.history.replaceState({}, '', '/');
    } else if (auth === 'error') {
      alert('❌ שגיאה בחיבור Google Calendar');
      window.history.replaceState({}, '', '/');
    }
  }, [location.search]);

  return (
    <div className="layout">
      <Sidebar onAddAppointment={() => setShowNewAppointment(true)} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard onAddAppointment={() => setShowNewAppointment(true)} />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
        </Routes>
      </main>

      {showNewAppointment && (
        <AppointmentForm
          onClose={() => setShowNewAppointment(false)}
          onSuccess={() => setShowNewAppointment(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/intake" element={<IntakePage />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
