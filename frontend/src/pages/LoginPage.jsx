import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AuthPage.css';

const IconArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const IconEye = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconEyeOff = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const IconAlertCircle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const LoginPage = ({ onSuccess, onRegister, onBack }) => {
  const { login } = useAuth();
  const [form,       setForm]       = useState({ username: '', password: '' });
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [errorMsg,   setErrorMsg]   = useState('');

  const handleChange = (e) => {
    setErrorMsg('');
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password) return;
    setLoading(true);
    setErrorMsg('');
    try {
      await login(form.username.trim(), form.password);
      onSuccess();
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo iniciar sesion. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Volver */}
        {onBack && (
          <button className="auth-back" onClick={onBack}>
            <IconArrowLeft /> Volver al inicio
          </button>
        )}

        {/* Marca */}
        <div className="auth-brand">
          <div className="auth-logo-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
            </svg>
          </div>
          <span className="auth-logo-name">AMY</span>
        </div>

        <h1 className="auth-title">Bienvenido de vuelta</h1>
        <p className="auth-sub">Ingresa tus datos para acceder a tu asistente.</p>

        {/* Error global */}
        {errorMsg && (
          <div className="auth-error-msg">
            <IconAlertCircle /> {errorMsg}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="login-username">Usuario</label>
            <input
              id="login-username"
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="tu_usuario"
              autoFocus
              autoComplete="username"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Contrasena</label>
            <div className="auth-password-wrap">
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button type="button" className="auth-eye-btn" onClick={() => setShowPass(p => !p)} tabIndex={-1}>
                {showPass ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-submit" disabled={loading || !form.username || !form.password}>
            {loading ? <span className="auth-spinner" /> : null}
            {loading ? 'Ingresando...' : 'Iniciar sesion'}
          </button>
        </form>

        <p className="auth-footer">
          No tienes cuenta?{' '}
          <button onClick={onRegister}>Registrarse</button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
