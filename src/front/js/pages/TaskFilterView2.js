import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TaskFilterView2 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { view = 'all', tasks = [] } = location.state || {};
  const backendUrl = process.env.REACT_APP_BACKEND_URL || process.env.BACKEND_URL;

  const [taskList, setTaskList] = useState(tasks);

  const filterTasksByCondition = (tasks, condition) => {
    if (condition === 'all') return tasks;
    return tasks.filter(task => task.condition === condition);
  };

  const filteredTasks = filterTasksByCondition(taskList, view);

  const handleConditionChange = async (taskId, newCondition) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${backendUrl}api/maintenancetasks/${taskId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ condition: newCondition })
      });

      if (!response.ok) throw new Error("Error al actualizar tarea");

      const updated = await response.json();
      const updatedTask = updated.task;

      setTaskList(prev => prev.map(t => t.id === taskId ? { ...t, condition: updatedTask.condition } : t));
    } catch (error) {
      console.error("Error al actualizar tarea:", error);
    }
  };

  const getTitle = () => {
    switch(view) {
      case 'all': return 'Todas las tareas';
      case 'PENDIENTE': return 'Tareas Pendientes';
      case 'FINALIZADA': return 'Tareas Finalizadas';
      default: return 'Todas las tareas';
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <div className="card shadow-lg p-4" style={{ maxWidth: '800px', width: '100%' }}>
        <h2 className="text-center mb-4 text-primary">
          {getTitle()}
        </h2>

        <div className="mt-4">
          {filteredTasks.map((task) => (
            <div key={task.id} className="card mb-3 shadow-sm">
              <div className="card-body">
                <p><strong>Nombre:</strong> {task.nombre}</p>
                <p><strong>Estado:</strong> 
                  <span className={`badge ${
                    task.condition === 'PENDIENTE' ? 'bg-warning' : 
                    task.condition === 'EN PROCESO' ? 'bg-info' : 'bg-success'
                  } ms-2`}>
                    {task.condition}
                  </span>
                </p>
                <p><strong>Habitación:</strong> {task.room_nombre || `Habitación ${task.room_id}`}</p>
                
                {(task.photo || task.photo_url) && (
                  <div className="mt-2">
                    <p><strong>Foto:</strong></p>
                    <img 
                      src={task.photo || task.photo_url} 
                      alt={`Tarea ${task.nombre}`}
                      className="img-thumbnail"
                      style={{ maxWidth: '200px' }}
                    />
                  </div>
                )}

                <div className="mt-3 d-flex justify-content-around">
                  {['PENDIENTE', 'EN PROCESO', 'FINALIZADA'].map(status => (
                    <button
                      key={status}
                      className={`btn ${status === 'PENDIENTE' ? 'btn-danger' :
                        status === 'EN PROCESO' ? 'btn-warning' : 'btn-success'}`}
                      onClick={() => handleConditionChange(task.id, status)}
                      disabled={task.condition === status}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="d-flex justify-content-center">
          <button 
            className="btn btn-primary mt-3 px-5 py-2" 
            onClick={() => navigate('/privateMaintenance')}
          >
            Volver a la vista principal
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskFilterView2;
