import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

// ─── Iconos SVG ───────────────────────────────────────────────────────────────
const IconSend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const IconPaperclip = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
);
const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconVolume2 = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
  </svg>
);
const IconVolumeX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
  </svg>
);
const IconBot = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"/>
    <circle cx="12" cy="5" r="2"/><path d="M12 7v4"/>
    <line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/>
  </svg>
);
const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconFileText = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IconMessageSquare = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

// ─── Sugerencias iniciales ─────────────────────────────────────────────────────
const SUGGESTIONS = [
  'Que tareas tengo pendientes?',
  'Crea una tarea para manana',
  'Ayudame a organizar mi semana',
  'Resume mi dia de hoy',
];

// ─── Nombres de voces femeninas conocidas ─────────────────────────────────────
const FEMALE_VOICE_KEYWORDS = [
  'Dalia',      // Microsoft Dalia (es-MX) — mejor opcion en Windows
  'Sabina',     // Microsoft Sabina (es-MX)
  'Paulina',    // macOS (es-MX)
  'Helena',     // macOS (es-ES)
  'Laura',      // Diversas
  'Maria',      // Diversas
  'Ana',        // Microsoft Ana
  'Monica',     // Diversas
  'Conchita',   // Google/Apple
  'Elvira',     // Ivona
  'Luciana',    // macOS (pt-BR, fallback)
  'female',
  'Female',
  'woman',
];

// ─── Componente principal ─────────────────────────────────────────────────────
const ChatPanel = ({ fetchTasks, addToast }) => {
  const { authFetch }       = useAuth();
  const [messages,         setMessages]         = useState([]);
  const [input,            setInput]            = useState('');
  const [isLoading,        setIsLoading]        = useState(false);
  const [isAudioEnabled,   setIsAudioEnabled]   = useState(false);
  const [attachedFile,     setAttachedFile]     = useState(null);
  const [availableVoices,  setAvailableVoices]  = useState([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState('');

  const messagesEndRef = useRef(null);
  const fileInputRef   = useRef(null);

  // ── Scroll automático ──
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  // ── Carga de voces (async — la API de Speech las carga diferido) ──
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);

        // Seleccionar la mejor voz femenina en espanol automaticamente
        let best = null;
        for (const kw of FEMALE_VOICE_KEYWORDS) {
          best = voices.find(v => v.lang.startsWith('es') && v.name.includes(kw));
          if (best) break;
        }
        // Fallback: cualquier voz en espanol
        if (!best) best = voices.find(v => v.lang.startsWith('es'));
        // Fallback final: cualquier voz femenina
        if (!best) {
          for (const kw of FEMALE_VOICE_KEYWORDS) {
            best = voices.find(v => v.name.includes(kw));
            if (best) break;
          }
        }
        if (best) setSelectedVoiceName(best.name);
      }
    };

    // Intentar inmediatamente (algunos navegadores ya tienen voces cargadas)
    loadVoices();
    // Escuchar el evento async de Chrome/Edge
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // ── Sintetizador de voz femenina ──
  const speakText = useCallback((text) => {
    if (!isAudioEnabled) return;

    // Cancelar cualquier reproduccion previa
    window.speechSynthesis.cancel();

    // Limpiar el texto: quitar markdown, limitar longitud
    const cleanText = text
      .replace(/[*_#`>]/g, '')
      .replace(/https?:\/\/\S+/g, 'enlace')
      .replace(/\n{2,}/g, '. ')
      .trim()
      .slice(0, 600);

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang   = 'es-MX';
    utterance.rate   = 1.0;
    utterance.pitch  = 1.35;  // Mas alto = voz mas femenina
    utterance.volume = 1;

    // Aplicar voz seleccionada
    if (selectedVoiceName && availableVoices.length > 0) {
      const voice = availableVoices.find(v => v.name === selectedVoiceName);
      if (voice) utterance.voice = voice;
    }

    window.speechSynthesis.speak(utterance);
  }, [isAudioEnabled, selectedVoiceName, availableVoices]);

  // ── Manejo de archivos ──
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setAttachedFile(file);
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatTime = () =>
    new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  // ── Enviar mensaje ──
  const handleSend = async (text) => {
    const msgText = text || input;
    if ((!msgText.trim() && !attachedFile) || isLoading) return;

    const userMessage = msgText || (attachedFile ? `[${attachedFile.name}]` : '');
    const time = formatTime();

    // 1. SNAPSHOT del contador de tareas ANTES de enviar
    let prevCount = 0;
    try {
      const snap = await authFetch('http://localhost:8000/api/tasks/');
      const snapData = await snap.json();
      prevCount = Array.isArray(snapData) ? snapData.length : 0;
    } catch { /* no bloquear el envio si falla */ }

    setMessages(prev => [...prev, { text: userMessage, type: 'user', time }]);
    setInput('');
    setIsLoading(true);

    try {
      let response;

      if (attachedFile) {
        const formData = new FormData();
        if (msgText.trim()) formData.append('message', msgText);
        formData.append('file', attachedFile);
        response = await authFetch('http://localhost:8000/api/chat/', {
          method: 'POST',
          body: formData,
        });
        setAttachedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        response = await authFetch('http://localhost:8000/api/chat/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msgText }),
        });
      }

      const data = await response.json();
      const responseText = data.response || 'Sin respuesta del servidor.';
      const ariaTime = formatTime();

      setMessages(prev => [...prev, { text: responseText, type: 'aria', time: ariaTime }]);
      speakText(responseText);

      // 2. Refrescar tareas y comparar con snapshot previo
      await fetchTasks();
      const newRes   = await authFetch('http://localhost:8000/api/tasks/');
      const newTasks = await newRes.json();
      if (Array.isArray(newTasks) && newTasks.length > prevCount) {
        addToast('AMY agendo una nueva tarea en tu calendario.');
      }

    } catch (error) {
      const errTime = formatTime();
      setMessages(prev => [
        ...prev,
        { text: 'Error de conexion. Verifica que el servidor este corriendo.', type: 'aria', time: errTime }
      ]);
      addToast('No se pudo conectar con el servidor.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ──
  return (
    <div className="panel chat-panel">

      {/* ── Header ── */}
      <header className="chat-header">
        <div className="aria-avatar">
          <IconBot />
        </div>
        <div className="header-info">
          <h1>AMY</h1>
          <p>Asistente Cognitiva Personal</p>
        </div>
        <div className="header-status">
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
          En linea
        </div>

        {/* Toggle de voz */}
        <button
          className={`audio-toggle ${isAudioEnabled ? 'active' : ''}`}
          onClick={() => {
            const next = !isAudioEnabled;
            setIsAudioEnabled(next);
            if (!next) window.speechSynthesis.cancel();
          }}
          title={isAudioEnabled ? 'Desactivar voz de AMY' : 'Activar voz de AMY'}
        >
          {isAudioEnabled ? <IconVolume2 /> : <IconVolumeX />}
          {isAudioEnabled ? 'Voz activa' : 'Silenciado'}
        </button>

        {/* Selector de voz (solo visible cuando el audio esta activo y hay voces) */}
        {isAudioEnabled && availableVoices.length > 0 && (
          <select
            style={{
              fontSize: '0.72rem',
              padding: '4px 8px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-input)',
              color: 'var(--text-secondary)',
              maxWidth: 160,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
            value={selectedVoiceName}
            onChange={e => setSelectedVoiceName(e.target.value)}
            title="Seleccionar voz"
          >
            {availableVoices
              .filter(v => v.lang.startsWith('es') || FEMALE_VOICE_KEYWORDS.some(kw => v.name.includes(kw)))
              .map(v => (
                <option key={v.name} value={v.name}>
                  {v.name.replace('Microsoft ', '').replace(' - Spanish (Mexico)', '')}
                </option>
              ))
            }
          </select>
        )}
      </header>

      {/* ── Ventana de chat ── */}
      <div className="chat-window">
        {/* Pantalla de bienvenida */}
        {messages.length === 0 && (
          <div className="chat-welcome">
            <div className="welcome-icon">
              <IconMessageSquare />
            </div>
            <div>
              <div className="welcome-title">Hola, soy AMY</div>
              <p className="welcome-sub">
                Tu asistente cognitiva personal. Puedo ayudarte a organizar tu agenda,
                analizar documentos y gestionar tus tareas de forma inteligente.
              </p>
            </div>
            <div className="welcome-suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="suggestion-chip" onClick={() => handleSend(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mensajes */}
        {messages.map((msg, i) => (
          <div key={i} className={`message-wrapper ${msg.type}`}>
            {msg.type === 'aria' && (
              <div className="msg-avatar"><IconBot /></div>
            )}
            <div className="msg-body">
              <div className="message-bubble">{msg.text}</div>
              {msg.time && <span className="msg-time">{msg.time}</span>}
            </div>
            {msg.type === 'user' && (
              <div className="msg-avatar" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                <IconUser />
              </div>
            )}
          </div>
        ))}

        {/* Indicador de carga (typing) */}
        {isLoading && (
          <div className="message-wrapper aria">
            <div className="msg-avatar"><IconBot /></div>
            <div className="msg-body">
              <div className="message-bubble typing-indicator">
                <div className="dot" /><div className="dot" /><div className="dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Previsualización de archivo ── */}
      {attachedFile && (
        <div className="file-preview-bar">
          <span className="file-preview-icon"><IconFileText /></span>
          <span className="file-preview-name">{attachedFile.name}</span>
          <button className="file-remove-btn" onClick={handleRemoveFile} title="Quitar archivo">
            <IconX />
          </button>
        </div>
      )}

      {/* ── Area de input ── */}
      <div className="input-area">
        <div className="input-container">
          <button
            className="attach-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Adjuntar documento (.txt, .pdf, .md)"
          >
            <IconPaperclip />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.md"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <input
            type="text"
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={attachedFile ? 'Agrega un comentario o envia el archivo...' : 'Escribe un mensaje a AMY...'}
            autoFocus
            disabled={isLoading}
          />
          <button
            className="send-button"
            onClick={() => handleSend()}
            disabled={(!input.trim() && !attachedFile) || isLoading}
          >
            Enviar
            <IconSend />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
