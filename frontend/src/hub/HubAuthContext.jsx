import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import hubApi from './hubApi';

const HubAuthContext = createContext(null);

export function HubAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await hubApi.get('/auth/me');
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = useCallback(async (credential) => {
    const { data } = await hubApi.post('/auth/google', { credential });
    setUser(data);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await hubApi.post('/auth/logout');
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <HubAuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </HubAuthContext.Provider>
  );
}

export function useHubAuth() {
  const ctx = useContext(HubAuthContext);
  if (!ctx) throw new Error('useHubAuth must be used within HubAuthProvider');
  return ctx;
}
