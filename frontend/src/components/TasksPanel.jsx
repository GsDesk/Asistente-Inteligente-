import React, { useState } from 'react';
import '../tasks.css';

const TasksPanel = ({ tasks, fetchTasks }) => {
  const [newTask, setNewTask] = useState({ title: '', date: '', time: '', priority: 'media' });

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/api/tasks/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      if (res.ok) {
        setNewTask({ title: '', date: '', time: '', priority: 'media' });
        fetchTasks();
      }
    } catch (error) {
      console.error("Error guardando tarea", error);
    }
  };

  return (
    <div className="panel tasks-panel">
      <h2>Mi Agenda</h2>
      
      <form className="task-form" onSubmit={handleAddTask}>
        <input 
          type="text" 
          placeholder="Ej. Estudiar React" 
          value={newTask.title}
          onChange={e => setNewTask({...newTask, title: e.target.value})}
          required
        />
        <div style={{display: 'flex', gap: '8px'}}>
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
        </div>
        <select 
          value={newTask.priority}
          onChange={e => setNewTask({...newTask, priority: e.target.value})}
        >
          <option value="alta">Prioridad Alta</option>
          <option value="media">Prioridad Media</option>
          <option value="baja">Prioridad Baja</option>
        </select>
        <button type="submit">+ Añadir Tarea</button>
      </form>

      <div className="task-list">
        {tasks.map(task => (
          <div key={task.id} className="task-card">
            <div className="task-card-header">
              <span className="task-title">{task.title}</span>
              <span className={`task-priority ${task.priority}`}>
                {task.priority.toUpperCase()}
              </span>
            </div>
            <div className="task-details">
              📅 {task.date} | ⏰ {task.time}
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <p style={{color: '#64748b', textAlign:'center', marginTop:'20px', fontWeight: '500'}}>No hay tareas pendientes.</p>
        )}
      </div>
    </div>
  );
};

export default TasksPanel;
