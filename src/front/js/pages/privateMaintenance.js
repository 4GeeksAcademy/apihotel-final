import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import CloudinaryApiHotel from "../component/cloudinaryApiHotel";
import Chatbot from "../component/chatBot";
import "../../styles/privateMaintenance.css";

const PrivateMaintenance = () => {
  const [tasks, setTasks] = useState([]);
  const [groupedTasks, setGroupedTasks] = useState({});
  const [isRoomSelected, setIsRoomSelected] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [taskPhotos, setTaskPhotos] = useState(() => {
    const savedPhotos = localStorage.getItem('maintenanceTaskPhotos');
    return savedPhotos ? JSON.parse(savedPhotos) : {};
  });
  const [errorMessages, setErrorMessages] = useState({});
  const navigate = useNavigate();
  const backendUrl = process.env.REACT_APP_BACKEND_URL || process.env.BACKEND_URL;

  useEffect(() => {
    const photosToSave = {};
    Object.keys(taskPhotos).forEach(taskId => {
      const task = tasks.find(t => t.id === parseInt(taskId));
      if (task && task.condition === 'FINALIZADA') {
        photosToSave[taskId] = taskPhotos[taskId];
      }
    });
    localStorage.setItem('maintenanceTaskPhotos', JSON.stringify(photosToSave));
  }, [taskPhotos, tasks]);

  const fetchMaintenanceTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No estás logueado');
        navigate('/loginMaintenance');
        return;
      }

      const response = await fetch(`${backendUrl}api/maintenancetasks_by_branch`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        alert('Error al obtener las tareas de mantenimiento');
        return;
      }

      const data = await response.json();
      setTasks(data);
      setGroupedTasks(groupTasksByRoom(data));

      const updatedPhotos = { ...taskPhotos };
      data.forEach(task => {
        if (task.photo_url) {
          updatedPhotos[task.id] = task.photo_url;
        }
      });
      setTaskPhotos(updatedPhotos);
    } catch (error) {
      console.error('Error al obtener las tareas:', error);
      alert('Hubo un problema al obtener las tareas de mantenimiento');
    }
  };

  const groupTasksByRoom = (tasks) => {
    return tasks.reduce((acc, task) => {
      const key = task.room_id || "zona_comun";
      if (!acc[key]) acc[key] = [];
      acc[key].push(task);
      return acc;
    }, {});
  };


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/loginMaintenance');
      return;
    }
    fetchMaintenanceTasks();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/loginMaintenance');
  };

  const handleRoomClick = (roomId) => {
    setSelectedRoomId(roomId);
    setIsRoomSelected(true);
  };

  const handleBackToRooms = () => {
    setIsRoomSelected(false);
    setSelectedRoomId(null);
  };

  const handleConditionChange = async (taskId, selectedRoomId, newCondition) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/loginMaintenance');

      const currentPhoto = taskPhotos[taskId] || tasks.find(t => t.id === taskId)?.photo_url || null;

      const updatedTask = {
        condition: newCondition,
        photo_url: currentPhoto,
        finalizado_por: newCondition === "FINALIZADA" ? jwtDecode(token).sub : null
      };
      
      

      setTasks(prevTasks =>
        prevTasks.map(task => task.id === taskId ? { ...task, ...updatedTask } : task)
      );

      setGroupedTasks(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(roomId => {
          updated[roomId] = updated[roomId].map(task =>
            task.id === taskId ? { ...task, ...updatedTask } : task
          );
        });
        return updated;
      });

      const response = await fetch(`${backendUrl}api/maintenancetasks/${taskId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTask),
      });

      if (!response.ok) throw new Error('Error al actualizar');

      const updatedTaskFromBackend = await response.json();
      if (updatedTaskFromBackend.photo_url) {
        setTaskPhotos(prev => ({ ...prev, [taskId]: updatedTaskFromBackend.photo_url }));
      }

      if (newCondition === 'FINALIZADA') {
        setTimeout(handleBackToRooms, 500);
      }

    } catch (error) {
      console.error('Error:', error);
      fetchMaintenanceTasks();
    }
  };

  const handlePhotoUpload = async (taskId, photoUrl) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const newPhotos = { ...taskPhotos, [taskId]: photoUrl };
      setTaskPhotos(newPhotos);

      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, photo_url: photoUrl } : t
      ));

      setGroupedTasks(prev => ({
        ...prev,
        [selectedRoomId]: prev[selectedRoomId].map(t =>
          t.id === taskId ? { ...t, photo_url: photoUrl } : t
        ),
      }));

      const response = await fetch(`${backendUrl}api/maintenancetasks/${taskId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photo_url: photoUrl,
          condition: tasks.find(t => t.id === taskId)?.condition || 'PENDIENTE'
        }),
      });

      if (!response.ok) throw new Error('Error al guardar foto');

      const updatedTask = await response.json();
      setTaskPhotos(prev => ({ ...prev, [taskId]: updatedTask.photo_url }));

    } catch (error) {
      console.error('Error al guardar foto:', error);
      setErrorMessages(prev => ({ ...prev, [taskId]: 'Error al guardar foto' }));
    }
  };

  const handlePhotoError = (taskId, errorMessage) => {
    setErrorMessages(prev => ({ ...prev, [taskId]: errorMessage }));
  };

  const handleFilterTasks = (view) => {
    navigate('/task-filter', {
      state: {
        view,
        tasks: tasks.map(task => ({
          ...task,
          photo: taskPhotos[task.id] || task.photo_url || null
        }))
      }
    });
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <div className="card shadow-lg p-4" style={{ maxWidth: '800px', width: '100%' }}>
        <h2 className="text-center mb-4" style={{ color: "#0dcaf0" }}>Tareas de Mantenimiento</h2>
        <Chatbot />

        {!isRoomSelected && Object.keys(groupedTasks).length > 0 && (
          <div className="row">
            {Object.keys(groupedTasks).map(roomId => {
              const roomTasks = groupedTasks[roomId];
              const roomName = roomId === "zona_comun" ? "Zona común" : (roomTasks[0].room_nombre || `Habitación ${roomId}`);

              // Estado de las tareas
              const todasFinalizadas = roomTasks.every(task => task.condition === 'FINALIZADA');
              const hayPendientes = roomTasks.some(task => task.condition === 'PENDIENTE');
              const hayEnProceso = roomTasks.some(task => task.condition === 'EN PROCESO');

              let iconEstado = "❔";
              let bgEstado = "secondary";

              if (todasFinalizadas) {
                iconEstado = "✅";

              } else if (hayPendientes) {
                iconEstado = "🕒";

              } else if (hayEnProceso) {
                iconEstado = "🔧";
              }

              const iconRoom = roomId === "zona_comun"
                ? <i className="fas fa-tree me-2"></i>
                : <i className="fas fa-bed me-2"></i>;

              return (
                <div key={roomId} className="col-md-6">
                  <button
                    className="btn custom-room-button text-start mb-3 w-100 py-2 fw-semibold d-flex justify-content-between align-items-center"
                    onClick={() => handleRoomClick(roomId)}
                  >
                    <span>{iconRoom} {roomName}</span>
                    <span className="fs-5">
                      {iconEstado}
                    </span>

                  </button>
                </div>
              );
            })}

          </div>
        )}

        {isRoomSelected && (
          <>
            <div className="mt-4">
              {groupedTasks[selectedRoomId]?.map(task => (
                <div key={task.id} className="card mb-3 shadow-sm">
                  <div className="card-body">
                    <p><strong>Nombre:</strong> {task.nombre}</p>
                    <p><strong>Estado actual:</strong>
                      <span className={`badge ${task.condition === 'PENDIENTE' ? 'bg-danger' :
                        task.condition === 'EN PROCESO' ? 'bg-warning' : 'bg-success'
                        } ms-2`}>
                        {task.condition}
                      </span>
                    </p>

                    <div className="mb-3">
                      <label className="form-label">Foto</label>
                      <CloudinaryApiHotel
                        setPhotoUrl={(url) => handlePhotoUpload(task.id, url)}
                        setErrorMessage={(msg) => handlePhotoError(task.id, msg)}
                      />
                      {(taskPhotos[task.id] || task.photo_url) && (
                        <div className="mt-2">
                          <img
                            src={taskPhotos[task.id] || task.photo_url}
                            alt={`Tarea ${task.nombre}`}
                            className="img-thumbnail"
                            style={{ maxWidth: '200px' }}
                          />
                        </div>
                      )}
                      {errorMessages[task.id] && (
                        <div className="text-danger small mt-1">{errorMessages[task.id]}</div>
                      )}
                    </div>

                    <div className="mt-3 p-3 border rounded d-flex justify-content-around">
                      {['PENDIENTE', 'EN PROCESO', 'FINALIZADA'].map(status => (
                        <button
                          key={status}
                          className={`btn ${status === 'PENDIENTE' ? 'btn-danger' :
                            status === 'EN PROCESO' ? 'btn-warning' : 'btn-success'}`}
                          onClick={() => handleConditionChange(task.id, selectedRoomId, status)}
                          disabled={task.condition === status}
                        >
                          {status}
                        </button>
                      ))}
                    </div>

                    {task.condition === 'FINALIZADA' && (
                      <div className="text-center mt-2">
                        <i className="bi bi-check-circle-fill text-success fs-4"></i>
                        <span className="ms-2">Tarea completada</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              className="btn custom-room-button w-100 mt-3 fw-semibold py-2"
              onClick={handleBackToRooms}
            >
              🔙 Volver a todas las habitaciones
            </button>
          </>
        )}

        <div className="mt-4 border-top pt-3">
          <button className="btn btn-outline-danger w-100" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>

        <div className="card mt-4 p-3">
          <h5 className="text-center">Filtrar tareas</h5>
          <div className="d-flex justify-content-around">
            <button className="btn btn" style={{ background: "#0dcaf0", color:"white" }} onClick={() => handleFilterTasks('all')}>
              Todas
            </button>
            <button className="btn btn-danger" onClick={() => handleFilterTasks('PENDIENTE')}>
              Pendientes
            </button>
            <button className="btn btn-success" onClick={() => handleFilterTasks('FINALIZADA')}>
              Finalizadas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivateMaintenance;
