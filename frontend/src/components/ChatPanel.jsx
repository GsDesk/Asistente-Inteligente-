import React, { useState, useRef, useEffect } from 'react';

const ChatPanel = ({ fetchTasks }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const speakText = (text) => {
    if (!isAudioEnabled) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#]/g, '').replace(/https?:\/\/\S+/g, 'enlace oculto');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-MX';
    utterance.rate = 1.05;
    utterance.pitch = 1.1;
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v =>
      v.lang.startsWith('es') &&
      (v.name.includes('Paulina') || v.name.includes('Helena') || v.name.includes('Sabina') ||
       v.name.includes('Laura') || v.name.includes('Female') || v.name.includes('Dalia'))
    );
    if (femaleVoice) utterance.voice = femaleVoice;
    else {
      const fallback = voices.find(v => v.lang.startsWith('es'));
      if (fallback) utterance.voice = fallback;
    }
    window.speechSynthesis.speak(utterance);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setAttachedFile(file);
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachedFile) || isLoading) return;

    const userMessage = input || (attachedFile ? `📎 [${attachedFile.name}]` : '');
    setMessages(prev => [...prev, { text: userMessage, type: 'user' }]);
    setInput('');
    setIsLoading(true);

    try {
      let response;

      if (attachedFile) {
        // Enviar como multipart si hay archivo adjunto
        const formData = new FormData();
        if (input.trim()) formData.append('message', input);
        formData.append('file', attachedFile);
        response = await fetch('http://localhost:8000/api/chat/', {
          method: 'POST',
          body: formData
        });
        setAttachedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        // Enviar como JSON normal
        response = await fetch('http://localhost:8000/api/chat/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: input || userMessage })
        });
      }

      const data = await response.json();
      const responseText = data.response || "No hubo respuesta";
      setMessages(prev => [...prev, { text: responseText, type: 'aria' }]);
      speakText(responseText);
      fetchTasks();
    } catch (error) {
      setMessages(prev => [...prev, { text: "Error crítico de red. ¿Está Django corriendo?", type: 'aria' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="panel chat-panel">
      <header className="chat-header">
        <div className="aria-avatar">A</div>
        <div className="header-info">
          <h1>ARIA Tutor</h1>
          <p>Asistente Cognitivo Local</p>
        </div>
        <button
          className={`audio-toggle ${isAudioEnabled ? 'active' : ''}`}
          onClick={() => setIsAudioEnabled(!isAudioEnabled)}
        >
          {isAudioEnabled ? '🔊 Voz Activada' : '🔇 Silenciada'}
        </button>
      </header>

      <div className="chat-window">
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', opacity: 0.4, margin: 'auto' }}>
            <div style={{ fontSize: '3rem' }}>✨</div>
            <h2 style={{ color: '#1e293b', marginBottom: '8px' }}>Hola, soy ARIA.</h2>
            <p style={{ color: '#64748b' }}>Puedes hablar conmigo o subir un documento con el clip para que lo analice.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`message-wrapper ${msg.type}`}>
            <div className="message-bubble">{msg.text}</div>
          </div>
        ))}

        {isLoading && (
          <div className="message-wrapper aria">
            <div className="message-bubble typing-indicator">
              <div className="dot"></div><div className="dot"></div><div className="dot"></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* File Preview Banner */}
      {attachedFile && (
        <div className="file-preview-bar">
          <span className="file-preview-icon">📄</span>
          <span className="file-preview-name">{attachedFile.name}</span>
          <button className="file-remove-btn" onClick={handleRemoveFile}>✕</button>
        </div>
      )}

      <div className="input-area">
        <div className="input-container">
          {/* Botón Clip */}
          <button
            className="attach-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Subir documento"
          >
            📎
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
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={attachedFile ? "Agrega un comentario o envía el archivo..." : "Habla con ARIA..."}
            autoFocus
            disabled={isLoading}
          />
          <button
            className="send-button"
            onClick={handleSend}
            disabled={(!input.trim() && !attachedFile) || isLoading}
          >Enviar</button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
