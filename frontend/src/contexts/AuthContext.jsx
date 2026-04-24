import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://localhost:8000';

export const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem('aria_token'));
  const [loading, setLoading] = useState(true);

  // Fetch con Authorization header automático
  const authFetch = useCallback(async (url, options = {}) => {
    const t = localStorage.getItem('aria_token');
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...(t ? { 'Authorization': `Bearer ${t}` } : {}),
      },
    });
  }, []);

  // Al montar: verificar token existente
  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/api/auth/me/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          if (data) {
            setUser(data);
          } else {
            // Token expirado o inválido
            localStorage.removeItem('aria_token');
            setToken(null);
          }
        })
        .catch(() => {
          localStorage.removeItem('aria_token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (username, password) => {
    const res = await fetch(`${API_BASE}/api/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Credenciales incorrectas.');
    }

    const data = await res.json();
    localStorage.setItem('aria_token', data.access);
    setToken(data.access);

    // Obtener datos del usuario
    const meRes  = await fetch(`${API_BASE}/api/auth/me/`, {
      headers: { 'Authorization': `Bearer ${data.access}` },
    });
    const userData = await meRes.json();
    setUser(userData);
    return userData;
  };

  const register = async (formData) => {
    const res = await fetch(`${API_BASE}/api/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const err = await res.json();
      throw err; // Objeto con campos de error del serializer
    }

    const data = await res.json();
    localStorage.setItem('aria_token', data.access);
    setToken(data.access);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('aria_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      authFetch,
      login,
      register,
      logout,
      isAuthenticated: !!token && !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
