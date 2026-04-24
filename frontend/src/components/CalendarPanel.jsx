import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../tasks.css';

// --- Iconos SVG ---
const IconChevronLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const IconChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

const CalendarPanel = ({ tasks, fetchTasks, addToast }) => {
  const { authFetch } = useAuth();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [newTask, setNewTask] = useState({ title: '', date: '', time: '', priority: 'media' });
  const [selectedDay, setSelectedDay] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = currentDate.toLocaleString('es-MX', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getTasksForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter(t => t.date === dateStr);
  };

  const handleDayClick = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDay(day);
    setNewTask(prev => ({ ...prev, date: dateStr }));
    setShowForm(true);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('http://localhost:8000/api/tasks/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      if (res.ok) {
        setNewTask({ title: '', date: newTask.date, time: '', priority: 'media' });
        setShowForm(false);
        fetchTasks();
        addToast('Tarea guardada correctamente.');
      } else {
        addToast('No se pudo guardar la tarea.', 'error');
      }
    } catch (error) {
      console.error('Error guardando tarea', error);
      addToast('Error de conexion con el servidor.', 'error');
    }
  };

  const cells = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const todayDay = today.getMonth() === month && today.getFullYear() === year ? today.getDate() : null;

  // Calcular intensidad de carga por día (para el indicador visual)
  const getLoadLevel = (dayTasks) => {
    if (dayTasks.length === 0) return 0;
    if (dayTasks.length === 1) return 1;
    if (dayTasks.length === 2) return 2;
    return 3;
  };

  return (
    <div className="calendar-panel panel calendar-panel-wrap">
      {/* Header */}
      <div className="calendar-header">
        <div className="cal-header-left">
          <div className="cal-header-icon">
            <IconCalendar />
          </div>
          <div>
            <h2 className="calendar-month-title">{monthName}</h2>
            <p className="cal-subtitle">
              {tasks.filter(t => {
                const d = new Date(t.date + 'T00:00:00');
                return d.getMonth() === month && d.getFullYear() === year;
              }).length} tareas este mes
            </p>
          </div>
        </div>
        <div className="cal-header-right">
          <button className="cal-nav-btn" onClick={prevMonth} title="Mes anterior">
            <IconChevronLeft />
          </button>
          <button className="cal-nav-btn" onClick={nextMonth} title="Mes siguiente">
            <IconChevronRight />
          </button>
          <button
            className="cal-add-btn"
            onClick={() => {
              setSelectedDay(null);
              setShowForm(true);
              setNewTask({ title: '', date: '', time: '', priority: 'media' });
            }}
          >
            <IconPlus />
            Nueva tarea
          </button>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="calendar-weekdays">
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className="cal-weekday">{d}</div>
        ))}
      </div>

      {/* Grid días */}
      <div className="calendar-grid">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="cal-cell empty" />;
          const dayTasks = getTasksForDay(day);
          const isToday = day === todayDay;
          const isSelected = day === selectedDay;
          const load = getLoadLevel(dayTasks);

          return (
            <div
              key={day}
              className={`cal-cell load-${load} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => handleDayClick(day)}
            >
              <span className="cal-day-number">{day}</span>
              <div className="cal-task-pills">
                {dayTasks.slice(0, 2).map(t => (
                  <div key={t.id} className={`cal-pill priority-${t.priority}`}>
                    {t.title}
                  </div>
                ))}
                {dayTasks.length > 2 && (
                  <div className="cal-pill more">+{dayTasks.length - 2} mas</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leyenda de prioridades */}
      <div className="cal-legend">
        <span className="legend-item"><span className="legend-dot alta" /> Alta</span>
        <span className="legend-item"><span className="legend-dot media" /> Media</span>
        <span className="legend-item"><span className="legend-dot baja" /> Baja</span>
      </div>

      {/* Modal nueva tarea */}
      {showForm && (
        <div className="cal-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="cal-modal" onClick={e => e.stopPropagation()}>
            <div className="cal-modal-header">
              <h3>Nueva tarea</h3>
              <button className="cal-modal-close" onClick={() => setShowForm(false)}>
                <IconX />
              </button>
            </div>
            <form onSubmit={handleAddTask}>
              <div className="cal-form-group">
                <label>Titulo</label>
                <input
                  type="text"
                  placeholder="Ej: Revision de proyecto..."
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="cal-form-row">
                <div className="cal-form-group">
                  <label>Fecha</label>
                  <input
                    type="date"
                    value={newTask.date}
                    onChange={e => setNewTask({ ...newTask, date: e.target.value })}
                    required
                  />
                </div>
                <div className="cal-form-group">
                  <label>Hora</label>
                  <input
                    type="time"
                    value={newTask.time}
                    onChange={e => setNewTask({ ...newTask, time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="cal-form-group">
                <label>Prioridad</label>
                <select
                  value={newTask.priority}
                  onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                >
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </div>
              <div className="cal-modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPanel;
