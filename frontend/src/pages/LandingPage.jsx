import React from 'react';
import './LandingPage.css';

// ─── Iconos SVG ───────────────────────────────────────────────────────────────
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

const IconSend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

// ─── Datos ────────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    image: '/images/feature-privacy.png',
    title: 'Privacidad absoluta',
    desc: 'Tus datos nunca salen de tu maquina. Totalmente local y seguro con tecnologia Ollama.',
  },
  {
    image: '/images/feature-conversation.png',
    title: 'Conversaciones naturales',
    desc: 'Entiende espanol optimizado y contexto. Respuestas humanas e instantaneas.',
  },
  {
    image: '/images/feature-calendar.png',
    title: 'Agenda inteligente integrada',
    desc: 'Gestiona tu calendario, tareas y recordatorios directamente desde el chat.',
  },
  {
    image: '/images/feature-documents.png',
    title: 'Analisis de documentos IA',
    desc: 'Lee y extrae informacion de PDFs y textos locales rapidamente con IA avanzada.',
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
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
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
              AMY LOCAL: TU IA<br/>
              <span>PERSONAL, 100% PRIVADA</span>
            </h1>
            <p className="land-hero-sub">
              AMY es tu asistente cognitivo personal impulsado por IA que corre
              completamente en tu maquina. Organiza tu agenda, analiza documentos
              y aprende contigo, sin enviar tus datos a la nube.
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

          {/* Hero mockup con imagen */}
          <div className="land-hero-mockup" aria-hidden="true">
            <img
              src="/images/hero-mockup.png"
              alt="AMY Local — Entorno de Trabajo Privado"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* Caracteristicas */}
      <section className="land-features" id="features">
        <div className="land-container">
          <div className="land-section-head">
            <h2>Todo lo que necesitas en un solo lugar</h2>
            <p>AMY combina asistencia conversacional con gestion de tareas para que nunca pierdas el hilo.</p>
          </div>
          <div className="land-features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="feat-card">
                <div className="feat-icon">
                  <img src={f.image} alt={f.title} loading="lazy" />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="land-how" id="how-it-works">
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
          <p>Crea tu cuenta y comienza a usar AMY en segundos. Tus datos, tu maquina, tu privacidad.</p>
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
            <span className="land-logo-name">AMY</span>
          </div>
          <span className="land-footer-copy">Asistente Cognitivo Local — 2026</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
