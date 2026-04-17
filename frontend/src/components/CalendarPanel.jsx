import React, { useState } from 'react';
import '../tasks.css';

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const CalendarPanel = ({ tasks, fetchTasks }) => {
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
      const res = await fetch('http://localhost:8000/api/tasks/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      if (res.ok) {
        setNewTask({ title: '', date: newTask.date, time: '', priority: 'media' });
        setShowForm(false);
        fetchTasks();
      }
    } catch (error) {
      console.error("Error guardando tarea", error);
    }
  };

  const cells = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const todayDay = today.getMonth() === month && today.getFullYear() === year ? today.getDate() : null;

  return (
    <div className="calendar-panel">
      {/* Header */}
      <div className="calendar-header">
        <button className="cal-nav-btn" onClick={prevMonth}>‹</button>
        <h2 className="calendar-month-title">{monthName}</h2>
        <button className="cal-nav-btn" onClick={nextMonth}>›</button>
        <button className="cal-add-btn" onClick={() => { setSelectedDay(null); setShowForm(true); setNewTask({ title: '', date: '', time: '', priority: 'media' }); }}>
          + Nueva Tarea
        </button>
      </div>

      {/* Grid días de la semana */}
      <div className="calendar-weekdays">
        {DAYS_OF_WEEK.map(d => <div key={d} className="cal-weekday">{d}</div>)}
      </div>

      {/* Grid días */}
      <div className="calendar-grid">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="cal-cell empty" />;
          const dayTasks = getTasksForDay(day);
          const isToday = day === todayDay;
          const isSelected = day === selectedDay;
          return (
            <div
              key={day}
              className={`cal-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => handleDayClick(day)}
            >
              <span className="cal-day-number">{day}</span>
              <div className="cal-task-pills">
                {dayTasks.slice(0, 3).map(t => (
                  <div key={t.id} className={`cal-pill priority-${t.priority}`}>
                    {t.title}
                  </div>
                ))}
                {dayTasks.length > 3 && <div className="cal-pill more">+{dayTasks.length - 3}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal nueva tarea */}
      {showForm && (
        <div className="cal-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="cal-modal" onClick={e => e.stopPropagation()}>
            <h3>📅 Nueva Tarea</h3>
            <form onSubmit={handleAddTask}>
              <input
                type="text"
                placeholder="Título de la tarea..."
                value={newTask.title}
                onChange={e => setNewTask({...newTask, title: e.target.value})}
                required autoFocus
              />
              <input
                type="date"
                value={newTask.date}
                onChange={e => setNewTask({...newTask, date: e.target.value})}
                required
              />
              <input
                type="time"
                value={newTask.time}
                onChange={e => setNewTask({...newTask, time: e.target.value})}
                required
              />
              <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                <option value="alta">🔴 Prioridad Alta</option>
                <option value="media">🟡 Prioridad Media</option>
                <option value="baja">🟢 Prioridad Baja</option>
              </select>
              <div className="cal-modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar Tarea</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPanel;
