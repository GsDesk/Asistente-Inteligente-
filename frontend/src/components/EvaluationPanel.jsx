import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../evaluation.css';

const IconBook = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
  </svg>
);

const IconUpload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const IconFileText = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const EvaluationPanel = ({ addToast }) => {
  const { authFetch } = useAuth();
  
  // Estados: 'setup', 'loading', 'quiz', 'results'
  const [step, setStep] = useState('setup');
  const [topic, setTopic] = useState('');
  const [quizData, setQuizData] = useState(null);
  const [attachedFile, setAttachedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [evalMode, setEvalMode] = useState('topic'); // 'topic' | 'document'
  const fileInputRef = useRef(null);
  
  // Variables de control de quiz
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { 0: 2, 1: 0, ... }

  // ── Manejo de archivos ──
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['.pdf', '.txt', '.md', '.doc', '.docx'];
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!validTypes.includes(ext)) {
        addToast('Formato no soportado. Usa PDF, TXT o MD.', 'error');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        addToast('El archivo es muy grande (máximo 10MB).', 'error');
        return;
      }
      setAttachedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Drag & Drop ──
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (['.pdf', '.txt', '.md'].includes(ext)) {
        setAttachedFile(file);
      } else {
        addToast('Formato no soportado. Usa PDF, TXT o MD.', 'error');
      }
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    
    // Validación según modo
    if (evalMode === 'topic' && !topic.trim()) return;
    if (evalMode === 'document' && !attachedFile) {
      addToast('Por favor sube un documento para evaluar.', 'error');
      return;
    }
    
    setStep('loading');
    try {
      let response;

      if (evalMode === 'document' && attachedFile) {
        // Enviar con archivo
        const formData = new FormData();
        formData.append('file', attachedFile);
        if (topic.trim()) {
          formData.append('topic', topic.trim());
        }
        response = await authFetch('http://localhost:8000/api/evaluate/', {
          method: 'POST',
          body: formData,
        });
      } else {
        // Solo tema
        response = await authFetch('http://localhost:8000/api/evaluate/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: topic.trim() })
        });
      }
      
      const data = await response.json();
      
      if (response.ok && data.preguntas && data.preguntas.length > 0) {
        setQuizData(data);
        setCurrentQuestionIdx(0);
        setUserAnswers({});
        setStep('quiz');
      } else {
        addToast(data.error || 'No se pudo generar el examen.', 'error');
        setStep('setup');
      }
    } catch (error) {
      console.error(error);
      addToast('Error conectando con el servidor.', 'error');
      setStep('setup');
    }
  };

  const handleSelectOption = (index) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIdx]: index
    }));
  };

  const handleNext = () => {
    if (userAnswers[currentQuestionIdx] === undefined) {
      addToast('Por favor selecciona una respuesta', 'error');
      return;
    }
    
    if (currentQuestionIdx < quizData.preguntas.length - 1) {
      setCurrentQuestionIdx(p => p + 1);
    } else {
      setStep('results');
    }
  };

  const resetEval = () => {
    setTopic('');
    setQuizData(null);
    setCurrentQuestionIdx(0);
    setUserAnswers({});
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setStep('setup');
  };

  // ── Render Results ──
  const calculateScore = () => {
    let correct = 0;
    quizData.preguntas.forEach((q, i) => {
      if (userAnswers[i] === q.indiceCorrecta) correct++;
    });
    return Math.round((correct / quizData.preguntas.length) * 100);
  };

  // Verificar si se puede generar
  const canGenerate = evalMode === 'topic' ? topic.trim().length > 0 : !!attachedFile;

  return (
    <div className="eval-panel">
      {/* Header */}
      <header className="eval-header">
        <div className="eval-icon">
          <IconBook />
        </div>
        <div>
          <h2 className="eval-header-title">Evaluación Interactiva</h2>
          <p className="eval-header-sub">Pon a prueba tus conocimientos sobre cualquier tema o documento.</p>
        </div>
      </header>

      <div className="eval-content">
        
        {/* ESTADO 1: Setup */}
        {step === 'setup' && (
          <div className="eval-setup">
            <h3>¿Cómo quieres evaluarte hoy?</h3>
            
            {/* Selector de modo */}
            <div className="eval-mode-tabs">
              <button 
                className={`eval-mode-tab ${evalMode === 'topic' ? 'active' : ''}`}
                onClick={() => setEvalMode('topic')}
                type="button"
              >
                <IconBook />
                Por tema
              </button>
              <button 
                className={`eval-mode-tab ${evalMode === 'document' ? 'active' : ''}`}
                onClick={() => setEvalMode('document')}
                type="button"
              >
                <IconFileText />
                Por documento
              </button>
            </div>

            <form onSubmit={handleGenerate}>
              {/* Modo: Por tema */}
              {evalMode === 'topic' && (
                <div className="eval-topic-section">
                  <label className="eval-field-label">Tema de evaluación</label>
                  <input 
                    type="text" 
                    className="eval-input"
                    placeholder="Ejemplo: React Hooks, Historia de Roma, Bases de datos..."
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    autoFocus
                  />
                </div>
              )}

              {/* Modo: Por documento */}
              {evalMode === 'document' && (
                <div className="eval-document-section">
                  <label className="eval-field-label">Sube tu documento</label>
                  
                  {!attachedFile ? (
                    <div 
                      className={`eval-dropzone ${isDragging ? 'dragging' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="eval-dropzone-icon">
                        <IconUpload />
                      </div>
                      <p className="eval-dropzone-text">
                        Arrastra tu archivo aquí o <span>haz clic para seleccionar</span>
                      </p>
                      <p className="eval-dropzone-hint">PDF, TXT o Markdown — Máximo 10MB</p>
                    </div>
                  ) : (
                    <div className="eval-file-preview">
                      <div className="eval-file-info">
                        <div className="eval-file-icon">
                          <IconFileText />
                        </div>
                        <div className="eval-file-details">
                          <span className="eval-file-name">{attachedFile.name}</span>
                          <span className="eval-file-size">
                            {(attachedFile.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        className="eval-file-remove" 
                        onClick={handleRemoveFile}
                        title="Quitar archivo"
                      >
                        <IconX />
                      </button>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.pdf,.md"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />

                  {/* Campo opcional de tema cuando sube documento */}
                  <label className="eval-field-label" style={{ marginTop: 16 }}>
                    Enfoque específico <span className="eval-optional">(opcional)</span>
                  </label>
                  <input 
                    type="text" 
                    className="eval-input"
                    placeholder="Ej: Solo sobre el capítulo 3, Conceptos clave..."
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                  />
                </div>
              )}

              <button 
                type="submit" 
                className="eval-btn-generate"
                disabled={!canGenerate}
              >
                {evalMode === 'document' ? 'Evaluar sobre documento' : 'Generar Test (3 Preguntas)'}
              </button>
            </form>
          </div>
        )}

        {/* ESTADO 2: Cargando */}
        {step === 'loading' && (
          <div className="eval-loading">
            <div className="eval-spinner"></div>
            <h3>AMY está preparando tu examen...</h3>
            <p>
              {evalMode === 'document' && attachedFile
                ? `Analizando "${attachedFile.name}" y generando preguntas`
                : `Generando preguntas sobre "${topic}"`
              }
            </p>
          </div>
        )}

        {/* ESTADO 3: Quiz */}
        {step === 'quiz' && quizData && (
          <div className="eval-quiz-container">
            <div className="eval-quiz-header">
              <span className="eval-progress-text">
                Pregunta {currentQuestionIdx + 1} de {quizData.preguntas.length}
              </span>
              {quizData.tema && (
                <span className="eval-quiz-topic">Tema: {quizData.tema}</span>
              )}
            </div>
            
            <div className="eval-question-card">
              <h3 className="eval-question-text">
                {quizData.preguntas[currentQuestionIdx].pregunta}
              </h3>
              
              <div className="eval-options-list">
                {quizData.preguntas[currentQuestionIdx].opciones.map((opt, idx) => (
                  <label 
                    key={idx} 
                    className={`eval-option-label ${userAnswers[currentQuestionIdx] === idx ? 'selected' : ''}`}
                  >
                    <input 
                      type="radio" 
                      name="quiz_option" 
                      checked={userAnswers[currentQuestionIdx] === idx}
                      onChange={() => handleSelectOption(idx)}
                    />
                    {opt}
                  </label>
                ))}
              </div>

              <div className="eval-modal-actions">
                <button className="eval-btn-generate" onClick={handleNext}>
                  {currentQuestionIdx < quizData.preguntas.length - 1 ? 'Siguiente Pregunta' : 'Finalizar Evaluación'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ESTADO 4: Resultados */}
        {step === 'results' && quizData && (
          <div className="eval-results">
            <div className="eval-score-card">
              <div className="eval-score-title">Tu Puntuación</div>
              <div className="eval-score-circle">
                {calculateScore()}%
              </div>
              <p style={{ color: 'var(--text-secondary)' }}>
                Tema: <strong>{quizData.tema}</strong>
              </p>
              <button className="eval-btn-generate" style={{ marginTop: '24px', maxWidth: '300px', margin: '24px auto 0' }} onClick={resetEval}>
                Evaluar otro tema
              </button>
            </div>

            <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Retroalimentación</h3>
            <div className="eval-feedback-list">
              {quizData.preguntas.map((q, i) => {
                const isCorrect = userAnswers[i] === q.indiceCorrecta;
                return (
                  <div key={i} className={`eval-feedback-item ${isCorrect ? 'correct' : 'incorrect'}`}>
                    <div className="eval-fb-question">{i + 1}. {q.pregunta}</div>
                    
                    <div className="eval-fb-answer">
                      Tu respuesta: <strong>{q.opciones[userAnswers[i]]}</strong> {isCorrect ? '✅' : '❌'}
                    </div>
                    
                    {!isCorrect && (
                      <div className="eval-fb-correct-ans">
                        Respuesta correcta: {q.opciones[q.indiceCorrecta]}
                      </div>
                    )}
                    
                    <div className="eval-fb-explanation">
                      <strong>Explicación de AMY:</strong> {q.explicacion}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluationPanel;
