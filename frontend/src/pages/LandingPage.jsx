import React from 'react';
import './LandingPage.css';

// ─── Iconos SVG ───────────────────────────────────────────────────────────────
const IconCpu = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
    <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
    <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
    <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
    <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
  </svg>
);

const IconCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const IconFileText = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

const IconArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ─── Datos ────────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <IconCpu />,
    title: 'Conversacion natural',
    desc: 'Habla con AMY como con un colega. Entiende contexto, recuerda tus compromisos y te da respuestas precisas en espanol.',
  },
  {
    icon: <IconCalendar />,
    title: 'Agenda inteligente',
    desc: 'Dile a AMY "agenda una reunion manana a las 3pm" y lo hara automaticamente. Visualiza todo en tu calendario.',
  },
  {
    icon: <IconShield />,
    title: 'Privacidad total',
    desc: 'Todo corre en tu maquina con Ollama. Tus conversaciones y datos nunca salen de tu entorno local.',
  },
  {
    icon: <IconFileText />,
    title: 'Analisis de documentos',
    desc: 'Sube archivos PDF, TXT o Markdown. AMY los analiza, resume y responde preguntas sobre su contenido.',
  },
];

const STEPS = [
  { num: '01', title: 'Crea tu cuenta', desc: 'Registrate en segundos. Sin tarjeta de credito ni datos innecesarios.' },
  { num: '02', title: 'Habla con AMY', desc: 'Pregunta, pide que programe tareas o sube documentos para que los analice.' },
  { num: '03', title: 'Mantente organizado', desc: 'Tu agenda se actualiza sola. Revisa el calendario y lleva el control de todo.' },
];

const BENEFITS = [
  'Modelo local con Ollama — sin costos de API',
  'Respuestas en espanol optimizadas',
  'Historial de tareas y calendario integrado',
  'Analisis de documentos PDF y texto',
];

// ─── Componente ───────────────────────────────────────────────────────────────
const LandingPage = ({ onLogin, onRegister }) => {
  return (
    <div className="land-root">
      {/* Navbar */}
      <nav className="land-nav">
        <div className="land-nav-inner">
          <div className="land-logo">
            <div className="land-logo-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
            </div>
            <span className="land-logo-name">AMY</span>
          </div>
          <div className="land-nav-actions">
            <button className="land-btn-ghost" onClick={onLogin}>Iniciar sesion</button>
            <button className="land-btn-primary" onClick={onRegister}>Registrarse</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="land-hero">
        <div className="land-container land-hero-inner">
          <div className="land-hero-content">
            <span className="land-badge">Asistente cognitivo local</span>
            <h1 className="land-hero-title">
              Productividad inteligente,<br />con privacidad total
            </h1>
            <p className="land-hero-sub">
              AMY es tu asistente cognitiva personal impulsada por IA que corre completamente
              en tu maquina. Organiza tu agenda, analiza documentos y aprende contigo,
              sin enviar tus datos a la nube.
            </p>
            <div className="land-hero-ctas">
              <button className="land-btn-primary land-btn-lg" onClick={onRegister}>
                Crear cuenta gratis
                <IconArrowRight />
              </button>
              <button className="land-btn-ghost land-btn-lg" onClick={onLogin}>
                Ya tengo cuenta
              </button>
            </div>
            <ul className="land-benefits">
              {BENEFITS.map((b, i) => (
                <li key={i}>
                  <span className="benefit-check"><IconCheck /></span>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Mockup visual del chat */}
          <div className="land-hero-mockup" aria-hidden="true">
            <div className="mockup-card">
              <div className="mockup-header">
                <div className="mockup-avatar">A</div>
                <div>
                  <div className="mockup-name">AMY</div>
                  <div className="mockup-status">
                    <span className="mockup-dot" />En linea
                  </div>
                </div>
              </div>
              <div className="mockup-messages">
                <div className="mockup-msg aria">Hola, puedo ayudarte a organizar tu dia. Que necesitas?</div>
                <div className="mockup-msg user">Agenda una reunion con el equipo manana a las 10am</div>
                <div className="mockup-msg aria">Listo. He creado la tarea "Reunion con el equipo" para manana a las 10:00 AM con prioridad media.</div>
              </div>
              <div className="mockup-input">
                <span>Escribe un mensaje...</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Caracteristicas */}
      <section className="land-features">
        <div className="land-container">
          <div className="land-section-head">
            <h2>Todo lo que necesitas en un solo lugar</h2>
            <p>AMY combina asistencia conversacional con gestion de tareas para que nunca pierdas el hilo.</p>
          </div>
          <div className="land-features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="feat-card">
                <div className="feat-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="land-how">
        <div className="land-container">
          <div className="land-section-head">
            <h2>Como funciona</h2>
            <p>Empieza a usar AMY en menos de dos minutos.</p>
          </div>
          <div className="land-steps">
            {STEPS.map((s, i) => (
              <div key={i} className="step-card">
                <div className="step-num">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="land-cta">
        <div className="land-container">
          <h2>Empieza hoy sin costo</h2>
          <p>Crea tu cuenta y comienza a usar AMY en segundos. Tus datos, tu maquina.</p>
          <button className="land-btn-cta" onClick={onRegister}>
            Crear mi cuenta
            <IconArrowRight />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="land-footer">
        <div className="land-container land-footer-inner">
          <div className="land-logo">
            <div className="land-logo-box land-logo-box-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
            </div>
            <span className="land-logo-name" style={{ color: '#94a3b8' }}>AMY</span>
          </div>
          <span className="land-footer-copy">Asistente Cognitivo Local — 2026</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
