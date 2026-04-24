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

const RegisterPage = ({ onSuccess, onLogin, onBack }) => {
  const { register } = useAuth();
  const [form, setForm] = useState({
    full_name: '',
    username:  '',
    email:     '',
    password:  '',
    password2: '',
  });
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [errorMsg,  setErrorMsg]  = useState('');
  const [fieldErrs, setFieldErrs] = useState({});

  const handleChange = (e) => {
    setErrorMsg('');
    setFieldErrs(prev => ({ ...prev, [e.target.name]: '' }));
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setFieldErrs({});
    try {
      await register(form);
      onSuccess();
    } catch (err) {
      if (typeof err === 'object' && !err.message) {
        // Errores por campo del serializer
        setFieldErrs(err);
      } else {
        setErrorMsg(err.message || 'No se pudo completar el registro.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldError = (name) => {
    const e = fieldErrs[name];
    if (!e) return null;
    const msg = Array.isArray(e) ? e[0] : e;
    return <span className="auth-field-error">{msg}</span>;
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

        <h1 className="auth-title">Crea tu cuenta</h1>
        <p className="auth-sub">Empieza a usar tu asistente cognitivo personal.</p>

        {errorMsg && (
          <div className="auth-error-msg" style={{ marginBottom: 16 }}>
            <IconAlertCircle /> {errorMsg}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="reg-fullname">Nombre completo</label>
            <input
              id="reg-fullname"
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Juan Perez"
              autoFocus
              autoComplete="name"
              className={fieldErrs.full_name ? 'error' : ''}
            />
            {fieldError('full_name')}
          </div>

          <div className="auth-field-row">
            <div className="auth-field">
              <label htmlFor="reg-username">Usuario</label>
              <input
                id="reg-username"
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="juan_perez"
                autoComplete="username"
                required
                className={fieldErrs.username ? 'error' : ''}
              />
              {fieldError('username')}
            </div>
            <div className="auth-field">
              <label htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="juan@email.com"
                autoComplete="email"
                className={fieldErrs.email ? 'error' : ''}
              />
              {fieldError('email')}
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="reg-password">Contrasena</label>
            <div className="auth-password-wrap">
              <input
                id="reg-password"
                type={showPass ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 6 caracteres"
                autoComplete="new-password"
                required
                className={fieldErrs.password ? 'error' : ''}
              />
              <button type="button" className="auth-eye-btn" onClick={() => setShowPass(p => !p)} tabIndex={-1}>
                {showPass ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
            {fieldError('password')}
          </div>

          <div className="auth-field">
            <label htmlFor="reg-password2">Confirmar contrasena</label>
            <input
              id="reg-password2"
              type={showPass ? 'text' : 'password'}
              name="password2"
              value={form.password2}
              onChange={handleChange}
              placeholder="Repite la contrasena"
              autoComplete="new-password"
              required
              className={fieldErrs.password2 ? 'error' : ''}
            />
            {fieldError('password2')}
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading || !form.username || !form.password || !form.password2}
          >
            {loading ? <span className="auth-spinner" /> : null}
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="auth-footer">
          Ya tienes cuenta?{' '}
          <button onClick={onLogin}>Iniciar sesion</button>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
