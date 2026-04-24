import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import './App.css';
import './tasks.css';
import ChatPanel       from './components/ChatPanel';
import CalendarPanel   from './components/CalendarPanel';
import EvaluationPanel from './components/EvaluationPanel';
import LandingPage     from './pages/LandingPage';
import LoginPage      from './pages/LoginPage';
import RegisterPage   from './pages/RegisterPage';

// ─── Iconos SVG ───────────────────────────────────────────────────────────────
const IconChat = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconBook = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
  </svg>
);
const IconLogOut = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconAlertCircle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

// ─── Toast system ─────────────────────────────────────────────────────────────
let toastId = 0;

// ─── Generar iniciales ────────────────────────────────────────────────────────
const getInitials = (user) => {
  if (!user) return '??';
  if (user.first_name && user.last_name)
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  if (user.first_name)
    return user.first_name.slice(0, 2).toUpperCase();
  return user.username.slice(0, 2).toUpperCase();
};

// ─── Pantalla de carga ────────────────────────────────────────────────────────
const LoadingScreen = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: 'var(--bg-base)', flexDirection: 'column', gap: 16
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 12, background: 'var(--accent)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
      </svg>
    </div>
    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Iniciando AMY...</div>
  </div>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = ({ onLogout }) => {
  const { user, logout, authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState('chat');
  const [tasks,     setTasks]     = useState([]);
  const [expanded,  setExpanded]  = useState(false);
  const [toasts,    setToasts]    = useState([]);

  const fetchTasks = async () => {
    try {
      const res  = await authFetch('http://localhost:8000/api/tasks/');
      const data = await res.json();
      setTasks(data);
    } catch (e) {
      console.error('Error al obtener tareas', e);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const addToast = (message, type = 'success') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const initials = getInitials(user);
  const displayName = user?.full_name || user?.username || 'Usuario';

  return (
    <div className="app-root">
      {/* ── Sidebar ── */}
      <nav className={`sidebar-nav ${expanded ? 'expanded' : ''}`}>

        <div className="nav-brand">
          <div className="nav-brand-left">
            <div className="nav-logo-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
            </div>
            <span className="nav-logo-text">AMY</span>
          </div>
          <button className="sidebar-toggle" onClick={() => setExpanded(p => !p)} title={expanded ? 'Colapsar' : 'Expandir'}>
            <IconChevronRight />
          </button>
        </div>

        <div className="nav-links">
          <span className="nav-section-label">Menu</span>
          <button
            id="nav-chat"
            className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
            title="Asistente"
          >
            <IconChat />
            <span className="nav-label">Asistente</span>
          </button>
          <button
            id="nav-calendar"
            className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
            title="Agenda"
          >
            <IconCalendar />
            <span className="nav-label">Agenda</span>
          </button>
          <button
            id="nav-evaluate"
            className={`nav-item ${activeTab === 'evaluate' ? 'active' : ''}`}
            onClick={() => setActiveTab('evaluate')}
            title="Evaluacion"
          >
            <IconBook />
            <span className="nav-label">Evaluacion</span>
          </button>
        </div>

        {/* ── Footer del sidebar ── */}
        <div className="nav-footer">
          {/* Modelo activo */}
          <div className="nav-model-badge">
            <span className="nav-model-dot" />
            <span className="nav-model-label">llama3.2:3b</span>
          </div>

          {/* Usuario */}
          <div className="nav-user">
            <div className="nav-avatar">{initials}</div>
            <div className="nav-user-info">
              <div className="nav-user-name">{displayName}</div>
              <div className="nav-user-email">{user?.email || user?.username}</div>
            </div>
          </div>

          {/* Cerrar sesion */}
          <button className="nav-logout-btn" onClick={handleLogout} title="Cerrar sesion">
            <IconLogOut />
            <span className="nav-label">Cerrar sesion</span>
          </button>
        </div>
      </nav>

      {/* ── Contenido principal ── */}
      <main className="app-main">
        {activeTab === 'chat' && (
          <ChatPanel fetchTasks={fetchTasks} addToast={addToast} />
        )}
        {activeTab === 'calendar' && (
          <CalendarPanel tasks={tasks} fetchTasks={fetchTasks} addToast={addToast} />
        )}
        {activeTab === 'evaluate' && (
          <EvaluationPanel addToast={addToast} />
        )}
      </main>

      {/* ── Toasts ── */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span className="toast-icon">
              {t.type === 'error' ? <IconAlertCircle /> : <IconCheck />}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── App raíz con router de páginas ──────────────────────────────────────────
function App() {
  const { isAuthenticated, loading } = useAuth();
  const [page, setPage] = useState('landing');

  // Si ya hay token válido → ir al dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) setPage('dashboard');
  }, [loading, isAuthenticated]);

  if (loading) return <LoadingScreen />;

  if (page === 'landing')   return <LandingPage  onLogin={() => setPage('login')}    onRegister={() => setPage('register')} />;
  if (page === 'login')     return <LoginPage     onSuccess={() => setPage('dashboard')} onRegister={() => setPage('register')} onBack={() => setPage('landing')} />;
  if (page === 'register')  return <RegisterPage  onSuccess={() => setPage('dashboard')} onLogin={() => setPage('login')}      onBack={() => setPage('landing')} />;

  return <Dashboard onLogout={() => setPage('landing')} />;
}

export default App;
