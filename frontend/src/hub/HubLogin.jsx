import React, { useState, useCallback } from 'react';
import GoogleSignIn from './GoogleSignIn';
import { useHubAuth } from './HubAuthContext';

export default function HubLogin() {
  const { login } = useHubAuth();
  const [error, setError] = useState('');

  const handleCredential = useCallback(async (credential) => {
    setError('');
    try {
      await login(credential);
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה בהתחברות, נסי שוב');
    }
  }, [login]);

  return (
    <div className="hub-login-screen">
      <div className="hub-login-card">
        <h1>Clinic Automation Hub</h1>
        <p>ד"ר אריאל זילברליכט - תצוגת מנהל (גישה למשתמשים מורשים בלבד)</p>
        {error && <div className="alert alert-error">{error}</div>}
        <GoogleSignIn onCredential={handleCredential} />
      </div>
    </div>
  );
}
