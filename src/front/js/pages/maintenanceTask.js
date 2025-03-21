import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CloudinaryApiHotel from "../component/CloudinaryApiHotel"; // Ajusta la ruta si es necesario
import Sidebar from "../component/sidebar";

const MaintenanceTask = () => {
  const [maintenanceTasks, setMaintenanceTasks] = useState([]);
  const [nombre, setNombre] = useState('');
  const [photo, setPhoto] = useState('');
  const [condition, setCondition] = useState('');
  const [idRoom, setIdRoom] = useState('');
  const [idMaintenance, setIdMaintenance] = useState('');
  const [idHousekeeper, setIdHousekeeper] = useState('');
  const [idCategory, setIdCategory] = useState('');
  const [rooms, setRooms] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [housekeepers, setHousekeepers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const navigate = useNavigate();

  const backendUrl = process.env.REACT_APP_BACKEND_URL || process.env.BACKEND_URL;

  // Cargar todas las tareas de mantenimiento
  const loadMaintenanceTasks = async () => {
    try {
      const response = await fetch(`${backendUrl}api/maintenancetasks`);
      if (response.ok) {
        const data = await response.json();
        setMaintenanceTasks(data);
      } else {
        console.error('Error al obtener las tareas de mantenimiento:', response.status);
      }
    } catch (error) {
      console.error('Error al obtener las tareas de mantenimiento:', error);
    }
  };

  // Cargar las habitaciones, mantenimientos, housekeepers y categorías
  const loadOptions = async () => {
    try {
      const [roomsResponse, maintenancesResponse, housekeepersResponse, categoriesResponse] = await Promise.all([
        fetch(`${backendUrl}api/rooms`),
        fetch(`${backendUrl}api/maintenance`),
        fetch(`${backendUrl}api/housekeepers`),
        fetch(`${backendUrl}api/categories`),
      ]);

      if (roomsResponse.ok && maintenancesResponse.ok && housekeepersResponse.ok && categoriesResponse.ok) {
        const roomsData = await roomsResponse.json();
        const maintenancesData = await maintenancesResponse.json();
        const housekeepersData = await housekeepersResponse.json();
        const categoriesData = await categoriesResponse.json();

        setRooms(roomsData);
        setMaintenances(maintenancesData);
        setHousekeepers(housekeepersData);
        setCategories(categoriesData);
      } else {
        console.error('Error al obtener las opciones:', roomsResponse.status);
      }
    } catch (error) {
      console.error('Error al obtener las opciones:', error);
    }
  };

  // Crear una nueva tarea de mantenimiento
  const createMaintenanceTask = async () => {
    if (!nombre || !idRoom || !idHousekeeper) {
      alert('Por favor, completa todos los campos');
      return;
    }

    try {
      const response = await fetch(`${backendUrl}api/maintenancetasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre,
          photo: photo || '',
          condition: condition || '',
          room_id: idRoom,
          maintenance_id: idMaintenance || null,
          housekeeper_id: idHousekeeper,
          category_id: idCategory || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMaintenanceTasks((prevTasks) => [...prevTasks, data]);
        resetForm();
      } else {
        const errorData = await response.json();
        console.error('Error al crear la tarea de mantenimiento:', errorData.message);
      }
    } catch (error) {
      console.error('Error al crear la tarea de mantenimiento:', error);
    }
  };

  // Actualizar una tarea de mantenimiento
  const updateMaintenanceTask = async () => {
    if (!nombre || !idRoom || !idHousekeeper || !editingId) {
      alert('Por favor, completa todos los campos para editar');
      return;
    }

    try {
      const response = await fetch(`${backendUrl}api/maintenancetasks/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre,
          photo: photo || '',
          condition: condition || '',
          room_id: idRoom,
          maintenance_id: idMaintenance || null,
          housekeeper_id: idHousekeeper,
          category_id: idCategory || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMaintenanceTasks(
          maintenanceTasks.map((item) => (item.id === editingId ? data : item))
        );
        resetForm();
      } else {
        const errorData = await response.json();
        console.error('Error al editar la tarea de mantenimiento:', errorData.message);
      }
    } catch (error) {
      console.error('Error al editar la tarea de mantenimiento:', error);
    }
  };

  // Eliminar una tarea de mantenimiento
  const deleteMaintenanceTask = async (id) => {
    const isConfirmed = window.confirm('¿Estás seguro de que quieres eliminar esta tarea de mantenimiento?');
    if (!isConfirmed) return;

    try {
      const response = await fetch(`${backendUrl}api/maintenancetasks/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMaintenanceTasks(maintenanceTasks.filter((item) => item.id !== id));
      } else {
        const errorData = await response.json();
        console.error('Error al eliminar la tarea de mantenimiento:', errorData.message);
      }
    } catch (error) {
      console.error('Error al eliminar la tarea de mantenimiento:', error);
    }
  };

  // Restablecer el formulario
  const resetForm = () => {
    setNombre('');
    setPhoto('');
    setCondition('');
    setIdRoom('');
    setIdMaintenance('');
    setIdHousekeeper('');
    setIdCategory('');
    setEditingId(null);
  };

  // Cargar datos cuando el componente se monta
  useEffect(() => {
    loadMaintenanceTasks();
    loadOptions();
  }, []);

  // Editar una tarea de mantenimiento
  const editMaintenanceTask = (id) => {
    const taskToEdit = maintenanceTasks.find((task) => task.id === id);
    if (taskToEdit) {
      setNombre(taskToEdit.nombre);
      setPhoto(taskToEdit.photo);
      setCondition(taskToEdit.condition);
      setIdRoom(taskToEdit.room.id);
      setIdMaintenance(taskToEdit.maintenance ? taskToEdit.maintenance.id : '');
      setIdHousekeeper(taskToEdit.housekeeper.id);
      setIdCategory(taskToEdit.category ? taskToEdit.category.id : '');
      setEditingId(id);
    }
  };

  // Cancelar la edición de una tarea
  const cancelEdit = () => {
    resetForm();
  };

  return (
    <>
      <div className="d-flex">
        {/* Sidebar */}
        <Sidebar />

        <div className="container">
          <h1>Gestión de Tareas de Mantenimiento</h1>
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">{editingId ? 'Editar' : 'Crear'} Tarea de Mantenimiento</h5>
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
                  <label>Foto</label>
                  <CloudinaryApiHotel setImageUrl={setPhoto} setErrorMessage={() => { }} />
                  {photo && (
                    <div className="mt-2">
                      <p>Vista previa:</p>
                      <img src={photo} alt="Vista previa" style={{ width: "200px", borderRadius: "10px" }} />
                    </div>
                  )}
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
                  <label htmlFor="idMaintenance">Mantenimiento</label>
                  <select
                    className="form-control"
                    id="idMaintenance"
                    value={idMaintenance}
                    onChange={(e) => setIdMaintenance(e.target.value)}
                  >
                    <option value="">Selecciona un mantenimiento</option>
                    {maintenances.map((maintenance) => (
                      <option key={maintenance.id} value={maintenance.id}>
                        {maintenance.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="idHousekeeper">Housekeeper</label>
                  <select
                    className="form-control"
                    id="idHousekeeper"
                    value={idHousekeeper}
                    onChange={(e) => setIdHousekeeper(e.target.value)}
                  >
                    <option value="" >Selecciona un housekeeper</option>
                    {housekeepers.map((housekeeper) => (
                      <option key={housekeeper.id} value={housekeeper.id}>
                        {housekeeper.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="idCategory">Categoría</label>
                  <select
                    className="form-control"
                    id="idCategory"
                    value={idCategory}
                    onChange={(e) => setIdCategory(e.target.value)}
                  >
                    <option value="">Selecciona una categoría</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  className="btn" style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}
                  onClick={editingId ? updateMaintenanceTask : createMaintenanceTask}
                >
                  {editingId ? 'Actualizar' : 'Crear'} Tarea
                </button>
                {editingId && (
                  <button type="button" className="btn" style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }} onClick={cancelEdit}>
                    Cancelar
                  </button>
                )}
              </form>
            </div>
          </div>

          <h2>Tareas de Mantenimiento</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Condición</th>
                <th>Habitación</th>
                <th>Mantenimiento</th>
                <th>Housekeeper</th>
                <th>Categoría</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {maintenanceTasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.nombre}</td>
                  <td>{task.condition}</td>
                  <td>{task.room?.nombre}</td>
                  <td>{task.maintenance?.nombre}</td>
                  <td>{task.housekeeper?.nombre}</td>
                  <td>{task.category?.nombre}</td>
                  <td>
                    <button
                      className="btn btn-sm" style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}
                      onClick={() => editMaintenanceTask(task.id)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-sm ml-2" style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}
                      onClick={() => deleteMaintenanceTask(task.id)}
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

    </>
  );
};

export default MaintenanceTask;