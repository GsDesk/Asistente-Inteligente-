import React, { useState, useEffect } from 'react';
import './App.css';
import './tasks.css';
import ChatPanel from './components/ChatPanel';
import CalendarPanel from './components/CalendarPanel';

function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [tasks, setTasks] = useState([]);

  const fetchTasks = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/tasks/');
      const data = await res.json();
      setTasks(data);
    } catch (e) {
      console.error("Error al obtener tareas", e);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  return (
    <div className="app-root">
      {/* Barra de navegación lateral */}
      <nav className="sidebar-nav">
        <div className="nav-brand">
          <div className="nav-logo">A</div>
        </div>
        <div className="nav-links">
          <button
            id="nav-chat"
            className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
            title="Asistente ARIA"
          >
            <span className="nav-icon">💬</span>
            <span className="nav-label">Chat</span>
          </button>
          <button
            id="nav-calendar"
            className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
            title="Mi Calendario"
          >
            <span className="nav-icon">📅</span>
            <span className="nav-label">Agenda</span>
          </button>
        </div>
        <div className="nav-footer">
          <div className="nav-status-dot" title="Ollama conectado"></div>
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="app-main">
        {activeTab === 'chat' && (
          <ChatPanel fetchTasks={fetchTasks} />
        )}
        {activeTab === 'calendar' && (
          <CalendarPanel tasks={tasks} fetchTasks={fetchTasks} />
        )}
      </main>
    </div>
  );
}

export default App;
