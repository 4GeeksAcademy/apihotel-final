import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const PrivateMaintenance = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [isRoomSelected, setIsRoomSelected] = useState(false);
  const [nombre, setNombre] = useState('');
  const [maintenanceId, setMaintenanceId] = useState(null);
  const navigate = useNavigate();

  const backendUrl = process.env.REACT_APP_BACKEND_URL || process.env.BACKEND_URL;

  const getMaintenanceIdFromToken = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setMaintenanceId(decoded.maintenance_id);
      } catch (error) {
        console.error('Error al decodificar el token:', error);
        alert('Hubo un error al obtener el ID de mantenimiento');
      }
    } else {
      navigate('/loginMaintenance');
    }
  };

  useEffect(() => {
    getMaintenanceIdFromToken();
  }, []);

  const handleFetchTasks = async () => {
    console.log("🔍 maintenanceId en React:", maintenanceId);
    if (maintenanceId === null) {
        console.error("⚠️ maintenanceId es null, no se pueden obtener tareas.");
        return;
    }

    try {
        const apiUrl = `${backendUrl}/api/maintenancetasks`;
        console.log("📡 Obteniendo tareas desde:", apiUrl);

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error en la respuesta del servidor: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log("📋 Datos recibidos de la API:", data);

        if (!Array.isArray(data)) {
            throw new Error("❌ Los datos obtenidos no son un array.");
        }

        // 🔹 Verificar si las tareas tienen la propiedad maintenance_id
        if (data.length > 0 && !data[0].hasOwnProperty('maintenance_id')) {
            throw new Error("❌ La API no está enviando 'maintenance_id' en las tareas.");
        }

        // 🔹 Filtrar solo las tareas del usuario logueado
        const userTasks = data.filter(task => task.maintenance_id === maintenanceId);
        console.log("🛠️ Tareas filtradas para el usuario:", userTasks);

        if (userTasks.length === 0) {
            console.warn("⚠️ No hay tareas asignadas para este usuario.");
            setTasks([]); // Asegurar que tasks sea un array vacío si no hay tareas
            return;
        }

        // 🔹 Agrupar tareas por habitación (id_room)
        const groupedTasks = Object.entries(
            userTasks.reduce((acc, task) => {
                if (!acc[task.id_room]) {
                    acc[task.id_room] = [];
                }
                acc[task.id_room].push(task);
                return acc;
            }, {})
        ).map(([roomId, tasks]) => ({
            id_room: roomId,
            tasks,
        }));

        console.log("🏨 Tareas organizadas por habitación:", groupedTasks);
        setTasks(groupedTasks);

    } catch (error) {
        console.error('❌ Error al obtener las tareas:', error.message);
        alert(`Error al obtener las tareas: ${error.message}`);
    }
};

  useEffect(() => {
    if (maintenanceId !== null) {
      handleFetchTasks();
    }
  }, [maintenanceId]);

  const handleRoomClick = (roomId) => {
    setSelectedRoomId(roomId);
    setIsRoomSelected(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/loginMaintenance');
  };

  const handleBackToRooms = () => {
    setIsRoomSelected(false);
    setSelectedRoomId(null);
  };

  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.id_room]) {
      acc[task.id_room] = [];
    }
    acc[task.id_room].push(task);
    return acc;
  }, {});

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <div className="card shadow-lg p-4" style={{ maxWidth: '800px', width: '100%' }}>
        <h2 className="text-center mb-4 text-primary">Tareas de Mantenimiento</h2>
        {!isRoomSelected && Object.keys(groupedTasks).length > 0 ? (
          Object.keys(groupedTasks).map((roomId) => {
            const roomTasks = groupedTasks[roomId];
            return (
              <div key={roomId} className="mb-3">
                <button
                  className="btn btn-primary mt-3 px-3 py-2"
                  onClick={() => handleRoomClick(roomId)}
                >
                  <h5>Habitación: {roomTasks[0].room_nombre}</h5>
                </button>
              </div>
            );
          })
        ) : null}
        {isRoomSelected && (
          <div className="mt-4">
            {groupedTasks[selectedRoomId] && groupedTasks[selectedRoomId].map((task) => (
              <div key={task.id} className="card mb-3 shadow-sm">
                <div className="card-body">
                  <p><strong>Tarea asignada:</strong> {task.nombre}</p>
                  <p><strong>Condición:</strong> {task.condition}</p>
                  <p><strong>Fecha de Asignación:</strong> {task.assignment_date}</p>
                  <p><strong>Fecha de Entrega:</strong> {task.submission_date}</p>
                  <div className="mt-3">
                    <strong>Foto: </strong>
                    {task.photo ? (
                      <img src={task.photo} alt="Tarea" style={{ maxWidth: '100px', borderRadius: '5px' }} />
                    ) : (
                      <span>Sin foto</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-3">
              <button
                className="btn btn-primary w-100"
                onClick={handleBackToRooms}
              >
                Volver a ver todas las habitaciones
              </button>
            </div>
          </div>
        )}
        <div className="d-flex justify-content-center">
          <button
            className="btn btn-primary mt-3 px-5 py-2"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivateMaintenance;