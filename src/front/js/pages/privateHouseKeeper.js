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

        {!isRoomSelected && Object.keys(groupedTasks).length > 0 && (
          <>
            <div className="row">
              {Object.keys(groupedTasks).map(roomId => {
                const tareas = groupedTasks[roomId];
                const todasFinalizadas = tareas.every(task => task.condition === 'FINALIZADA');
                const hayPendientes = tareas.some(task => task.condition === 'PENDIENTE');
                const hayEnProceso = tareas.some(task => task.condition === 'EN PROCESO');

                // ✅ Estado general con emojis
                let iconEstado = '❔';
                if (todasFinalizadas) {
                  iconEstado = '✅';
                } else if (hayPendientes) {
                  iconEstado = '🕒';
                } else if (hayEnProceso) {
                  iconEstado = '❓';
                }


                const nombreTareas = tareas.map(t => t.nombre?.toLowerCase() || "");
                // Zona común
                const isZonaComun = !tareas[0].room_nombre;
                const esSalida = nombreTareas.some(n => n.includes("salida"));
                const esCambioSabanas = nombreTareas.some(n => n.includes("cambio de sábanas"));
                const esCliente = nombreTareas.some(n => n.includes("cliente"));
             

                
                const iconRoom = isZonaComun
                  ? <i className="fas fa-tree me-2"></i>
                  : <i className="fas fa-bed me-2"></i>;


                // Ícono de prioridad: solo SALIDA
                let iconPrioridad = null;
                if (esSalida) {
                  iconPrioridad = <i className="fas fa-plane-departure text-danger me-2"></i>;
                }

                let iconRoom = null;
                if (esCambioSabanas && !esSalida) {
                  iconRoom = <i className="fas fa-bed text-primary me-2"></i>;
                } else if (isZonaComun && !esSalida) {
                  iconRoom = <FontAwesomeIcon icon={faBuilding} className="text-secondary me-2" />;
                } else if (esCliente && !esSalida && !esCambioSabanas && !esZonaNoble) {
                  iconRoom = <i className="fas fa-user text-warning me-2"></i>;
                }


                const roomLabel = (
                  <div className="d-flex justify-content-between align-items-center w-100">
                    <div>
                      {iconPrioridad}
                      {iconRoom}
                      {isZonaComun ? 'Zona común' : `Habitación: ${tareas[0].room_nombre}`}
                    </div>
                    <div className="ms-2">
                      <span>{iconEstado}</span>
                    </div>
                  </div>
                );
                

                return (
                  <div key={roomId} className="col-md-6">
                    <button
                      className="custom-room-button"
                      onClick={() => handleRoomClick(roomId)}
                    >

                      {roomLabel}

                      <span>{iconRoom} {roomLabel}</span>
                      <span>{iconEstado}</span>

                    </button>
                  </div>
                );
              })}

              <div className="d-flex justify-content-center gap-3 mb-4">
                <button
                  className="action-button btn-primary"
                  onClick={() => handleFilterTasks('all')}
                >
                  TODAS
                </button>
                <button
                  className="action-button btn-warning"
                  onClick={() => handleFilterTasks('pending')}
                >
                  PENDIENTES
                </button>
                <button
                  className="action-button btn-success"
                  onClick={() => handleFilterTasks('completed')}
                >
                  FINALIZADAS
                </button>
              </div>
            </div>
          </>
        )}

        {isRoomSelected && (
          <div className="mt-4">
            {groupedTasks[selectedRoomId]?.map(task => (

              <div key={task.id} className="card mb-3 shadow-sm rounded-3">
                <div className="card-body">

                  {(() => {
                    const nombre = task.nombre?.toLowerCase() || "";
                    let textClass = "text-success";
                    let icon = "fas fa-circle-info";

                    if (nombre.includes("salida")) {
                      textClass = "text-danger";
                      icon = "fas fa-plane-departure";
                    } else if (nombre.includes("cambio de sábanas")) {
                      textClass = "text-primary"; // Azul
                      icon = "fas fa-bed";
                    } else if (nombre.includes("cliente")) {
                      textClass = "text-warning";
                      icon = "fas fa-user";
                    }

                    return (
                      <p>
                        <strong className={textClass}>
                          <i className={`${icon} me-2`}></i>
                          {task.nombre}
                        </strong>
                      </p>
                    );
                  })()}

                  <p><strong>Estado actual:</strong>
                    <span className={`badge ${task.condition === 'PENDIENTE' ? 'bg-warning' :

              <div key={task.id} className="task-card">
                <div className="task-card-body">
                  <p><strong>Tarea asignada:</strong> {task.nombre}</p>
                  <p><strong>Estado actual:</strong>
                    <span className={`status-badge ${task.condition === 'PENDIENTE' ? 'bg-warning' :

                      task.condition === 'EN PROCESO' ? 'bg-info' : 'bg-success'
                      } ms-2`}>
                      {task.condition}
                    </span>
                  </p>

                  <div className="form-group mt-3">
                    <label htmlFor={`nota-${task.id}`}>Observaciones</label>
                    <textarea
                      id={`nota-${task.id}`}
                      className="form-control"
                      placeholder="Ej: Cliente descansando, no quiere limpieza..."
                      rows={2}
                      value={task.nota_housekeeper || ""}
                      onChange={(e) => {
                        const updatedTasks = tasks.map(t =>
                          t.id === task.id ? { ...t, nota_housekeeper: e.target.value } : t
                        );
                        setTasks(updatedTasks);
                      }}
                      onBlur={async (e) => {
                        const token = localStorage.getItem('token');
                        if (!token) return;

                        try {
                          const response = await fetch(`${backendUrl}api/housekeeper_task/${task.id}`, {
                            method: 'PUT',
                            headers: {
                              'Authorization': `Bearer ${token}`,
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              condition: task.condition,
                              nota_housekeeper: e.target.value,
                              photo_url: task.photo_url || ""
                            }),
                          });

                          if (!response.ok) throw new Error("Error al guardar observación");

                          const updatedTask = await response.json();

                          // Actualiza el estado local con la tarea actualizada
                          setTasks(prev =>
                            prev.map(t => (t.id === task.id ? updatedTask : t))
                          );

                        } catch (error) {
                          console.error("Error al guardar nota:", error);
                        }
                      }}


                    ></textarea>

                  </div>


                  <div className="mb-3">
                    <label htmlFor="photo" className="form-label">Foto</label>


                  <div className="mb-3">
                    <label htmlFor="photo" className="form-label"><strong>Foto</strong></label>

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
                    {['PENDIENTE', 'EN PROCESO', 'FINALIZADA'].map((status) => (
                      <button
                        key={status}

                        className={`btn ${status === 'PENDIENTE' ? 'btn-warning' :

                        className={`action-button ${status === 'PENDIENTE' ? 'btn-warning' :

                          status === 'EN PROCESO' ? 'btn-info' : 'btn-success'
                          }`}
                        onClick={() => handleStatusChange(task.id, status)}
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

            <div className="mt-3">

              <button className="btn custom-room-button" onClick={toggleMaintenanceTasks}>

              <button className="custom-room-button" onClick={toggleMaintenanceTasks}>

                {showMaintenanceTasks ? 'Ocultar tareas de mantenimiento' : 'Mostrar tareas de mantenimiento'}
              </button>
            </div>

            {showMaintenanceTasks && (

              <div className="card shadow-lg mt-4">
                <div className="card-body">

              <div className="maintenance-section">
                <div className="maintenance-form">

                  <h5 className="card-title">Tarea de Mantenimiento</h5>
                  <form>
                    <div className="form-group mb-3">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ingresa la tarea de mantenimiento..."
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                      />
                    </div>
                    <strong>Foto: </strong>
                    <div className="form-group mb-3">
                      <CloudinaryApiHotel setPhotoUrl={setMaintenancePhoto} setErrorMessage={() => { }} />
                      {maintenancePhoto && <img src={maintenancePhoto} alt="Preview" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, marginTop: 10 }} />}
                    </div>
                    <button
                      type="button"

                      className="btn btn-block"
                      style={{ backgroundColor: "#0dcaf0" }}

                      className="action-button btn-info"

                      onClick={createMaintenanceTask}
                    >
                      Crear Tarea
                    </button>


                    <div className="mt-4">

                    <div className="maintenance-list">

                      <h4 className="mb-3">Listado de Tareas de Mantenimiento</h4>
                      {maintenanceTasks.length > 0 ? (
                        <div className="list-group">
                          {maintenanceTasks.map(task => (

                            <div key={task.id} className="list-group-item d-flex justify-content-between align-items-center">
                              <span>{task.nombre}</span>
                              <span className={`badge ${task.condition === 'PENDIENTE' ? 'bg-primary' : 'bg-secondary'} ms-2`}>

                            <div key={task.id} className="maintenance-item">
                              <span>{task.nombre}</span>
                              <span className={`status-badge ${task.condition === 'PENDIENTE' ? 'bg-danger' : 'bg-secondary'}`}>

                                {task.condition}
                              </span>
                            </div>
                          ))}

                        </div>
                      ) : (
                        <div className="alert alert-info" role="alert">
                          No hay tareas de mantenimiento disponibles.
                        </div>

                        </div>
                      ) : (
                        <div className="alert alert-info" role="alert">
                          No hay tareas de mantenimiento disponibles.
                        </div>

                      )}
                    </div>
                  </form>
                </div>
              </div>
            )}

            <button

              className="btn custom-room-button w-100 mt-3 fw-semibold py-2"

              className="custom-room-button w-100 mt-3"

              onClick={handleBackToRooms}
            >
              🔙 Volver a todas las habitaciones
            </button>
          </div>
        )}

        <div className="d-flex justify-content-center mt-4">

          <button className="btn px-5 py-2" style={{ backgroundColor: "#0dcaf0" }} onClick={handleLogout}>
            <i className="fas fa-sign-out-alt me-2"></i> Cerrar sesión

          <button className="logout-button" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Cerrar sesión

          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivateHouseKeeper;
