import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../evaluation.css';

const IconBook = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
  </svg>
);

const EvaluationPanel = ({ addToast }) => {
  const { authFetch } = useAuth();
  
  // Estados: 'setup', 'loading', 'quiz', 'results'
  const [step, setStep] = useState('setup');
  const [topic, setTopic] = useState('');
  const [quizData, setQuizData] = useState(null);
  
  // Variables de control de quiz
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { 0: 2, 1: 0, ... }

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    
    setStep('loading');
    try {
      const response = await authFetch('http://localhost:8000/api/evaluate/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim() })
      });
      
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

  return (
    <div className="eval-panel">
      {/* Header */}
      <header className="eval-header">
        <div className="eval-icon">
          <IconBook />
        </div>
        <div>
          <h2 className="eval-header-title">Evaluación Interactiva</h2>
          <p className="eval-header-sub">Pon a prueba tus conocimientos sobre cualquier tema.</p>
        </div>
      </header>

      <div className="eval-content">
        
        {/* ESTADO 1: Setup */}
        {step === 'setup' && (
          <div className="eval-setup">
            <h3>¿Sobre qué tema quieres evaluarte hoy?</h3>
            <form onSubmit={handleGenerate}>
              <input 
                type="text" 
                className="eval-input"
                placeholder="Ejemplo: React Hooks, Historia de Roma, Bases de datos..."
                value={topic}
                onChange={e => setTopic(e.target.value)}
                autoFocus
                required
              />
              <button 
                type="submit" 
                className="eval-btn-generate"
                disabled={!topic.trim()}
              >
                Generar Test (3 Preguntas)
              </button>
            </form>
          </div>
        )}

        {/* ESTADO 2: Cargando */}
        {step === 'loading' && (
          <div className="eval-loading">
            <div className="eval-spinner"></div>
            <h3>AMY está preparando tu examen...</h3>
            <p>Generando preguntas sobre "{topic}"</p>
          </div>
        )}

        {/* ESTADO 3: Quiz */}
        {step === 'quiz' && quizData && (
          <div className="eval-quiz-container">
            <div className="eval-quiz-header">
              <span className="eval-progress-text">
                Pregunta {currentQuestionIdx + 1} de {quizData.preguntas.length}
              </span>
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
