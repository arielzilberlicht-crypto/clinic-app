import React from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { HubAuthProvider, useHubAuth } from './HubAuthContext';
import HubLogin from './HubLogin';
import HubOverview from './pages/HubOverview';
import HubNeedsAttention from './pages/HubNeedsAttention';
import HubToday from './pages/HubToday';
import HubLeads from './pages/HubLeads';
import HubPatientCard from './pages/HubPatientCard';

const NAV_ITEMS = [
  { path: '/hub', label: 'סקירה כללית', end: true },
  { path: '/hub/needs-attention', label: 'דורש טיפול' },
  { path: '/hub/today', label: 'היום' },
  { path: '/hub/leads', label: 'לידים' },
  { path: '/hub/patients', label: 'כרטיס מטופלת' }
];

function HubShell() {
  const { user, loading, logout } = useHubAuth();

  if (loading) {
    return (
      <div className="loading-center" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
        <span>טוען...</span>
      </div>
    );
  }

  if (!user) return <HubLogin />;

  return (
    <div className="hub-shell">
      <header className="hub-header">
        <div className="hub-header-title">
          <h1>Clinic Automation Hub</h1>
          <span>ד"ר אריאל זילברליכט - תצוגת מנהל</span>
        </div>
        <div className="hub-header-user">
          <span className="hub-user-email">{user.email}</span>
          <span className={`badge ${user.role === 'DOCTOR' ? 'badge-active' : 'badge-pending'}`}>
            {user.role === 'DOCTOR' ? 'רופא' : 'מזכירה'}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={logout}>התנתקות</button>
        </div>
      </header>

      <nav className="hub-nav">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) => `hub-nav-item ${isActive ? 'active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main className="hub-main">
        <Routes>
          <Route path="/" element={<HubOverview />} />
          <Route path="/needs-attention" element={<HubNeedsAttention />} />
          <Route path="/today" element={<HubToday />} />
          <Route path="/leads" element={<HubLeads />} />
          <Route path="/patients" element={<HubPatientCard />} />
          <Route path="/patients/:patientId" element={<HubPatientCard />} />
          <Route path="*" element={<Navigate to="/hub" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function HubApp() {
  return (
    <HubAuthProvider>
      <HubShell />
    </HubAuthProvider>
  );
}
