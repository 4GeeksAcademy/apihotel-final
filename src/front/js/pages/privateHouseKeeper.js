import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import CloudinaryApiHotel from '../component/cloudinaryApiHotel';
import "../../styles/privatehousekeepers.css";
import { faBuilding } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";


const PrivateHouseKeeper = () => {
  const [tasks, setTasks] = useState([]);
  const [maintenanceTasks, setMaintenanceTasks] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [isRoomSelected, setIsRoomSelected] = useState(false);
  const [nombre, setNombre] = useState('');
  const [housekeeperId, setHousekeeperId] = useState(null);
  const [maintenancePhoto, setMaintenancePhoto] = useState('');
  const [maintenanceCondition, setMaintenanceCondition] = useState('PENDIENTE');
  const [showMaintenanceTasks, setShowMaintenanceTasks] = useState(false);
  const [photo, setPhoto] = useState('');
  const [notasPorTarea, setNotasPorTarea] = useState({});
  const [taskPhotos, setTaskPhotos] = useState(() => {
    const savedPhotos = localStorage.getItem('housekeeperTaskPhotos');
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
    localStorage.setItem('housekeeperTaskPhotos', JSON.stringify(photosToSave));
  }, [taskPhotos, tasks]);

  const getHousekeeperIdFromToken = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setHousekeeperId(decoded.housekeeper_id);
      } catch (error) {
        console.error('Error al decodificar el token:', error);
        alert('Hubo un error al obtener el ID del housekeeper');
      }
    } else {
      navigate('/loginHouseKeeper');
    }
  };

  useEffect(() => {
    getHousekeeperIdFromToken();
  }, []);

  const handleFetchTasks = async () => {
    if (housekeeperId === null) return;
    try {
      const response = await fetch(`${backendUrl}api/housekeeper_tasks`);
      if (!response.ok) throw new Error('Error en la respuesta del servidor');
      const data = await response.json();
      const filteredTasks = data.filter(task => task.id_housekeeper === housekeeperId);

      const updatedPhotos = { ...taskPhotos };
      filteredTasks.forEach(task => {
        if (task.photo_url) {
          updatedPhotos[task.id] = task.photo_url;
        }
      });
      setTaskPhotos(updatedPhotos);

      setTasks(filteredTasks);
    } catch (error) {
      console.error('Error al obtener las tareas:', error);
      alert('Error al obtener las tareas, por favor intente más tarde.');
    }
  };

  useEffect(() => {
    if (housekeeperId !== null) {
      handleFetchTasks();
    }
  }, [housekeeperId]);

  const handleFetchMaintenanceTasks = async () => {
    const token = localStorage.getItem('token');
    let housekeeperId = null;
    if (token) {
      try {
        const decoded = jwtDecode(token);
        housekeeperId = decoded.housekeeper_id;
      } catch (error) {
        console.error('Error al decodificar el token:', error);
        alert('Hubo un error al obtener el ID del housekeeper');
        return;
      }
    }
    if (!housekeeperId) return;

    try {
      const response = await fetch(
        `${backendUrl}api/maintenancetasks/filter?housekeeper_id=${housekeeperId}&room_id=${selectedRoomId}`
      );
      if (!response.ok) throw new Error('Error al obtener las tareas de mantenimiento');
      const data = await response.json();
      const filtered = data.filter(task => task.condition === 'PENDIENTE');
      setMaintenanceTasks(filtered);
    } catch (error) {
      console.error('Error al obtener las tareas de mantenimiento:', error);
      alert('Hubo un error al obtener las tareas de mantenimiento');
    }
  };

  useEffect(() => {
    if (housekeeperId && selectedRoomId) {
      handleFetchMaintenanceTasks();
    }
  }, [housekeeperId, selectedRoomId]);

  const handlePhotoUpload = async (taskId, photoUrl) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const newPhotos = { ...taskPhotos, [taskId]: photoUrl };
      setTaskPhotos(newPhotos);

      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, photo_url: photoUrl } : t
      ));

      const response = await fetch(`${backendUrl}api/housekeeper_task/${taskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photo_url: photoUrl,
          condition: tasks.find(t => t.id === taskId)?.condition || 'PENDIENTE',
          nota_housekeeper: tasks.find(t => t.id === taskId)?.nota_housekeeper || ""
        }),

      });

      if (!response.ok) throw new Error('Error al guardar foto');

    } catch (error) {
      console.error('Error al guardar foto:', error);
      setErrorMessages(prev => ({ ...prev, [taskId]: 'Error al guardar foto' }));
    }
  };

  const handlePhotoError = (taskId, errorMessage) => {
    setErrorMessages(prev => ({ ...prev, [taskId]: errorMessage }));
  };

  const handleFilterTasks = (view) => {
    let filteredTasks = tasks;

    if (view === 'pending') {
      filteredTasks = tasks.filter(task => task.condition === 'PENDIENTE');
    } else if (view === 'completed') {
      filteredTasks = tasks.filter(task => task.condition === 'FINALIZADA');
    }

    navigate('/task-filter-housekeeper', {
      state: {
        view: view === 'pending' ? 'PENDIENTE' : view === 'completed' ? 'FINALIZADA' : 'all',
        tasks: filteredTasks.map(task => ({
          ...task,
          photo: taskPhotos[task.id] || task.photo_url || null
        }))
      }
    });
  };

  const handleRoomClick = (roomId) => {
    setSelectedRoomId(roomId);
    setIsRoomSelected(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/loginHouseKeeper');
  };

  const handleBackToRooms = () => {
    setIsRoomSelected(false);
    setSelectedRoomId(null);
  };

  const createMaintenanceTask = async () => {
    if (!nombre.trim()) {
      alert("Por favor, introduce el nombre de la tarea.");
      return;
    }
    if (!maintenancePhoto) {
      alert("Por favor, sube una imagen de la incidencia.");
      return;
    }

    const token = localStorage.getItem('token');
    let housekeeperId = null;
    if (token) {
      try {
        const decoded = jwtDecode(token);
        housekeeperId = decoded.housekeeper_id;
      } catch (error) {
        console.error('Error al decodificar el token:', error);
        alert('Hubo un error al obtener el ID del housekeeper');
        return;
      }
    }

    const taskData = {
      nombre,
      room_id: selectedRoomId,
      housekeeper_id: housekeeperId,
      condition: maintenanceCondition,
      photo_url: maintenancePhoto,
      maintenance_id: null,
      category_id: null,
    };

    try {
      const response = await fetch(`${backendUrl}api/maintenancetasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      if (response.ok) {
        const data = await response.json();
        alert('Tarea de mantenimiento creada con éxito');
        setMaintenanceTasks(prev => [...prev, data]);
        resetForm();
      } else {
        const errorData = await response.json();
        console.error('Error al crear la tarea de mantenimiento:', errorData.message);
        alert('Error al crear la tarea de mantenimiento: ' + JSON.stringify(errorData));
      }
    } catch (error) {
      console.error('Error al crear la tarea de mantenimiento:', error);
      alert('Hubo un problema al enviar la solicitud. Por favor, inténtalo de nuevo.');
    }
  };

  const resetForm = () => {
    setNombre('');
    setMaintenanceCondition('PENDIENTE');
    setMaintenancePhoto('');
  };

  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.id_room]) acc[task.id_room] = [];
    acc[task.id_room].push(task);
    return acc;
  }, {});

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/loginHouseKeeper');
        return;
      }

      const response = await fetch(`${backendUrl}api/housekeeper_task/${taskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          condition: newStatus,
          nota_housekeeper: tasks.find(t => t.id === taskId)?.nota_housekeeper || ""
        })
      });

      if (!response.ok) throw new Error('Error al actualizar');

      const updatedTask = await response.json();
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, condition: newStatus } : task
        )
      );

      if (newStatus === 'FINALIZADA') {
        setTimeout(handleBackToRooms, 500);
      }

    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un problema al actualizar el estado de la tarea');
    }
  };


  const toggleMaintenanceTasks = () => {
    setShowMaintenanceTasks(prev => !prev);
  };

  return (
    <div className="main-container">
      <div className="main-card">
        <h2 className="main-title">Tareas de Camarera</h2>

        {/* Vista general de habitaciones */}
        {!isRoomSelected && Object.keys(groupedTasks).length > 0 && (
          <div className="row">
            {Object.keys(groupedTasks).map(roomId => {
              const tareas = groupedTasks[roomId];
              const nombreTareas = tareas.map(t => t.nombre?.toLowerCase() || "");
              const todasFinalizadas = tareas.every(t => t.condition === 'FINALIZADA');
              const hayPendientes = tareas.some(t => t.condition === 'PENDIENTE');
              const hayEnProceso = tareas.some(t => t.condition === 'EN PROCESO');

              const isZonaComun = !tareas[0].room_nombre;
              const esSalida = nombreTareas.some(n => n.includes("salida"));
              const esCambioSabanas = nombreTareas.some(n => n.includes("cambio de sábanas"));
              const esCliente = nombreTareas.some(n => n.includes("cliente"));

              // Íconos
              let iconPrioridad = esSalida ? <i className="fas fa-plane-departure text-danger me-2"></i> : null;
              let iconRoom = null;
              if (esCambioSabanas) {
                iconRoom = <i className="fas fa-bed text-primary me-2"></i>;
              } else if (isZonaComun) {
                iconRoom = <FontAwesomeIcon icon={faBuilding} className="text-secondary me-2" />;
              } else if (esCliente) {
                iconRoom = <i className="fas fa-user text-warning me-2"></i>;
              }

              // Emoji de estado
              let iconEstado = '❔';
              if (todasFinalizadas) iconEstado = '✅';
              else if (hayPendientes) iconEstado = '🕒';
              else if (hayEnProceso) iconEstado = '❓';


              return (
                <div key={roomId} className="col-md-6 mb-3">
                  <button className="custom-room-button w-100" onClick={() => handleRoomClick(roomId)}>
                    {iconPrioridad}
                    {iconRoom}
                    {isZonaComun ? 'Zona común' : `Habitación: ${tareas[0].room_nombre}`}
                    <span className="float-end">{iconEstado}</span>
                  </button>
                </div>
              );
            })}

            <div className="d-flex justify-content-center gap-3 mt-4">
              <button className="action-button btn-primary" onClick={() => handleFilterTasks('all')}>TODAS</button>
              <button className="action-button btn-danger" onClick={() => handleFilterTasks('pending')}>PENDIENTES</button>
              <button className="action-button btn-success" onClick={() => handleFilterTasks('completed')}>FINALIZADAS</button>
            </div>
          </div>
        )}



        {/* Detalle de habitación */}
        {isRoomSelected && (
          <div className="mt-4">
            {groupedTasks[selectedRoomId]?.map(task => (
              <div key={task.id} className="card mb-3">
                <div className="card-body">
                  <p><strong>Tarea:</strong> {task.nombre}</p>
                  <p><strong>Estado:</strong> <span className={`badge ${task.condition === 'PENDIENTE' ? 'bg-warning' : task.condition === 'EN PROCESO' ? 'bg-info' : 'bg-success'}`}>{task.condition}</span></p>

                  <div className="form-group">
                    <label>Observaciones</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Ej: Cliente descansando, no quiere limpieza..."
                      value={task.nota_housekeeper || ""}
                      onChange={e => {
                        const newValue = e.target.value;
                        setTasks(prevTasks =>
                          prevTasks.map(t =>
                            t && t.id === task.id ? { ...t, nota_housekeeper: newValue } : t
                          )
                        );
                      }}
                      onBlur={async e => {
                        const token = localStorage.getItem('token');
                        if (!token) return;

                        try {
                          const response = await fetch(`${backendUrl}api/housekeeper_task/${task.id}`, {
                            method: 'PUT',
                            headers: {
                              'Authorization': `Bearer ${token}`,
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                              condition: task.condition,
                              nota_housekeeper: e.target.value,
                              photo_url: task.photo_url || ""
                            })
                          });

                          if (!response.ok) throw new Error("Error al guardar observación");

                          const updatedTask = await response.json();
                          setTasks(prev =>
                            prev.map(t => (t.id === task.id ? updatedTask : t))
                          );

                        } catch (error) {
                          console.error("Error al guardar nota:", error);
                          alert("Hubo un error al guardar la observación.");
                        }
                      }}
                    />
                  </div>


                  <div className="my-3">
                    <label><strong>Foto</strong></label>
                    <CloudinaryApiHotel setPhotoUrl={url => handlePhotoUpload(task.id, url)} setErrorMessage={msg => handlePhotoError(task.id, msg)} />
                    {(taskPhotos[task.id] || task.photo_url) && (
                      <img src={taskPhotos[task.id] || task.photo_url} className="img-thumbnail mt-2" style={{ maxWidth: '200px' }} alt="Preview" />
                    )}
                  </div>

                  <div className="d-flex justify-content-between">
                    {['PENDIENTE', 'EN PROCESO', 'FINALIZADA'].map(status => (
                      <button
                        key={status}
                        className={`btn ${status === 'PENDIENTE' ? 'btn-warning' : status === 'EN PROCESO' ? 'btn-info' : 'btn-success'}`}
                        onClick={() => handleStatusChange(task.id, status)}
                        disabled={task.condition === status}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <div className="text-end">
              <button className="btn btn-secondary" onClick={handleBackToRooms}>🔙 Volver</button>
            </div>

            <div className="mt-4">
              <button className="btn btn-outline-info" onClick={toggleMaintenanceTasks}>
                {showMaintenanceTasks ? 'Ocultar tareas de mantenimiento' : 'Mostrar tareas de mantenimiento'}
              </button>

              {showMaintenanceTasks && (
                <div className="card mt-3">
                  <div className="card-body">
                    <h5>Crear nueva incidencia</h5>
                    <input type="text" className="form-control mb-2" placeholder="Nombre de la tarea" value={nombre} onChange={e => setNombre(e.target.value)} />
                    <CloudinaryApiHotel setPhotoUrl={setMaintenancePhoto} setErrorMessage={() => { }} />
                    {maintenancePhoto && <img src={maintenancePhoto} className="img-thumbnail mt-2" style={{ width: 80, height: 80 }} alt="Foto incidencia" />}
                    <button className="btn btn-info mt-3" onClick={createMaintenanceTask}>Crear Tarea</button>

                    <div className="mt-4">
                      <h6>Tareas pendientes</h6>
                      {maintenanceTasks.length > 0 ? (
                        <ul className="list-group">
                          {maintenanceTasks.map(task => (
                            <li key={task.id} className="list-group-item d-flex justify-content-between align-items-center">
                              {task.nombre}
                              <span className="badge bg-danger">{task.condition}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No hay tareas de mantenimiento</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-center mt-5">
          <button className="btn btn-outline-dark" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt me-2"></i> Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivateHouseKeeper;

