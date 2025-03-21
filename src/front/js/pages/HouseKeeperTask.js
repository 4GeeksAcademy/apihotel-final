import React, { useState, useEffect } from 'react';
import Sidebar from "../component/sidebar";

const HouseKeeperTask = () => {
  const [houseKeeperTasks, setHouseKeeperTasks] = useState([]);
  const [nombre, setNombre] = useState('');
  const [photo, setPhoto] = useState('');
  const [condition, setCondition] = useState('');
  const [assignmentDate, setAssignmentDate] = useState('');
  const [submissionDate, setSubmissionDate] = useState('');
  const [idRoom, setIdRoom] = useState('');
  const [idHousekeeper, setIdHousekeeper] = useState('');
  const [rooms, setRooms] = useState([]);
  const [housekeepers, setHousekeepers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');


  const backendUrl = process.env.REACT_APP_BACKEND_URL || process.env.BACKEND_URL;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Sesión expirada. Inicia sesión nuevamente.");
      navigate("/login");
      return;
    }
    loadHouseKeeperTasks();
    loadRoomsAndHousekeepers();
  }, []);
  
  const loadHouseKeeperTasks = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${backendUrl}/api/housekeeper_tasks`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
  
      if (response.ok) {
        const data = await response.json();
        setHouseKeeperTasks(data);
      } else {
        console.error("Error al obtener las tareas:", response.status);
      }
    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
    }
  };
  
   
  // Cargar las habitaciones y los housekeepers (para la lista de opciones)
  const loadRoomsAndHousekeepers = async () => {
    const token = localStorage.getItem("token");
    try {
      const [roomsResponse, housekeepersResponse] = await Promise.all([
        fetch(`${backendUrl}/api/rooms`),
        fetch(`${backendUrl}/api/housekeepers`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        }),
      ]);
  
      if (roomsResponse.ok && housekeepersResponse.ok) {
        const roomsData = await roomsResponse.json();
        const housekeepersData = await housekeepersResponse.json();
        setRooms(roomsData);
        setHousekeepers(housekeepersData);
      } else {
        console.error("Error en la petición:", roomsResponse.status, housekeepersResponse.status);
      }
    } catch (error) {
      console.error("Error al obtener habitaciones o housekeepers:", error);
    }
  };
  
  
   // Crear una nueva tarea de HouseKeeper
   const createHouseKeeperTask = async () => {
    if (!nombre || !photo || !condition || !assignmentDate || !submissionDate || !idRoom || !idHousekeeper) {
      alert('Por favor, completa todos los campos');
      return;
    }
  
    const token = localStorage.getItem("token"); 
    try {
      const response = await fetch(`${backendUrl}/api/housekeeper_task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          nombre,
          photo,
          condition,
          assignment_date: assignmentDate,
          submission_date: submissionDate,
          id_room: idRoom,
          id_housekeeper: idHousekeeper,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Error del backend:", errorData);
        alert("Error al crear la tarea: " + (errorData.error || errorData.message || "Error desconocido"));
        return;
      }
  
      const data = await response.json();
      setHouseKeeperTasks((prevTasks) => [...prevTasks, data]);
      resetForm();
    } catch (error) {
      console.error('Error al crear la tarea de HouseKeeper:', error);
    }
  };
  
  

  // Actualizar una tarea de HouseKeeper
  const updateHouseKeeperTask = async () => {
    if (!nombre || !photo || !condition || !assignmentDate || !submissionDate || !editingId || !idRoom || !idHousekeeper) {
      alert('Por favor, completa todos los campos para editar');
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/housekeeper_task/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre,
          photo,
          condition,
          assignment_date: assignmentDate,
          submission_date: submissionDate,
          id_room: idRoom,
          id_housekeeper: idHousekeeper,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setHouseKeeperTasks(
          houseKeeperTasks.map((item) => (item.id === editingId ? data : item))
        );
        resetForm();
      } else {
        const errorData = await response.json();
        console.error('Error al editar la tarea de HouseKeeper:', errorData.message);
      }
    } catch (error) {
      console.error('Error al editar la tarea de HouseKeeper:', error);
    }
  };

  // Eliminar una tarea de HouseKeeper
  const deleteHouseKeeperTask = async (id) => {
    const isConfirmed = window.confirm('¿Estás seguro de que quieres eliminar esta tarea de HouseKeeper?');

    if (!isConfirmed) {
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/housekeeper_task/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setHouseKeeperTasks(houseKeeperTasks.filter((item) => item.id !== id));
      } else {
        const errorData = await response.json();
        console.error('Error al eliminar la tarea de HouseKeeper:', errorData.message);
      }
    } catch (error) {
      console.error('Error al eliminar la tarea de HouseKeeper:', error);
    }
  };

  // Restablecer el formulario
  const resetForm = () => {
    setNombre('');
    setPhoto('');
    setCondition('');
    setAssignmentDate('');
    setSubmissionDate('');
    setIdRoom('');
    setIdHousekeeper('');
    setEditingId(null);
  };

  // Cargar datos cuando el componente se monta
  useEffect(() => {
    loadHouseKeeperTasks();
    loadRoomsAndHousekeepers();
  }, []);

  // Editar una tarea de HouseKeeper
  const editHouseKeeperTask = (id) => {
    const taskToEdit = houseKeeperTasks.find((task) => task.id === id);
    if (taskToEdit) {
      setNombre(taskToEdit.nombre);
      setPhoto(taskToEdit.photo);
      setCondition(taskToEdit.condition);
      setAssignmentDate(taskToEdit.assignment_date);
      setSubmissionDate(taskToEdit.submission_date);
      setIdRoom(taskToEdit.id_room);
      setIdHousekeeper(taskToEdit.id_housekeeper);
      setEditingId(id);
    }
  };

  // Cancelar la edición de una tarea de HouseKeeper
  const cancelEdit = () => {
    resetForm();
  };

  return (
    <>
      <div className="d-flex">
        {/* Sidebar */}
        <Sidebar/>
        <div className="container">
          <h1>Gestión de Tareas de HouseKeeper</h1>

          <div className="card">
            <div className="card-body">
              <h5 className="card-title">{editingId ? 'Editar' : 'Crear'} Tarea de HouseKeeper</h5>

              <form>
                <div className="form-group">
                  <label htmlFor="nombre">Nombre</label>
                  <input
                    type="text"
                    className="form-control"
                    id="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="photo">Foto</label>
                  <input
                    type="text"
                    className="form-control"
                    id="photo"
                    value={photo}
                    onChange={(e) => setPhoto(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="condition">Condición</label>
                  <input
                    type="text"
                    className="form-control"
                    id="condition"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="assignmentDate">Fecha de Asignación</label>
                  <input
                    type="date"
                    className="form-control"
                    id="assignmentDate"
                    value={assignmentDate}
                    onChange={(e) => setAssignmentDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="submissionDate">Fecha de Entrega</label>
                  <input
                    type="date"
                    className="form-control"
                    id="submissionDate"
                    value={submissionDate}
                    onChange={(e) => setSubmissionDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="idRoom">Habitación</label>
                  <select
                    className="form-control"
                    id="idRoom"
                    value={idRoom}
                    onChange={(e) => setIdRoom(e.target.value)}
                  >
                    <option value="">Selecciona una habitación</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="idHousekeeper">HouseKeeper</label>
                  <select
                    className="form-control"
                    id="idHousekeeper"
                    value={idHousekeeper}
                    onChange={(e) => setIdHousekeeper(e.target.value)}
                  >
                    <option value="">Selecciona un HouseKeeper</option>
                    {housekeepers.map((housekeeper) => (
                      <option key={housekeeper.id} value={housekeeper.id}>
                        {housekeeper.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <button
                    type="button"
                    className="btn" style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}
                    onClick={editingId ? updateHouseKeeperTask : createHouseKeeperTask}
                  >
                    {editingId ? 'Actualizar' : 'Crear'} Tarea de HouseKeeper
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      className="btn btn-secondary ml-2"
                      onClick={cancelEdit}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          <h3 className="mt-4">Tareas de HouseKeeper</h3>
          <div className="table-responsive mt-4">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Condición</th>
                  <th>Asignación</th>
                  <th>Entrega</th>
                  <th>ID de Habitación</th> {/* Nueva columna */}
                  <th>ID de Housekeeper</th> {/* Nueva columna */}
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {houseKeeperTasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.nombre}</td>
                    <td>{task.condition}</td>
                    <td>{task.assignment_date}</td>
                    <td>{task.submission_date}</td>
                    <td>{task.id_room}</td> {/* Muestra el ID de la habitación */}
                    <td>{task.id_housekeeper}</td> {/* Muestra el ID de Housekeeper */}
                    <td>
                      <button
                        className="btn  btn-sm mr-2" style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}
                        onClick={() => editHouseKeeperTask(task.id)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-sm" style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}
                        onClick={() => deleteHouseKeeperTask(task.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
};

export default HouseKeeperTask;