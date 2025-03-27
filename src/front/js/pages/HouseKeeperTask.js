// HouseKeeperTask.js
import React, { useState, useEffect, useContext } from 'react';
import Sidebar from "../component/sidebar";
import CloudinaryApiHotel from "../component/cloudinaryApiHotel";
import { Context } from "../store/appContext";

const HouseKeeperTask = () => {
  const { store, actions } = useContext(Context);
  const { housekeepers, rooms, houseKeeperTasks } = store;
  const [condition, setCondition] = useState('PENDIENTE');
  const [nombre, setNombre] = useState('');
  const [photo, setPhoto] = useState('');
  const [assignmentDate, setAssignmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [submissionDate, setSubmissionDate] = useState('');
  const [idRoom, setIdRoom] = useState('');
  const [errorMessage, setErrorMessage] = useState("");
  const [idHousekeeper, setIdHousekeeper] = useState('');
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    actions.getHousekeepers();
    actions.getRooms();
    actions.getHouseKeeperTasks();
  }, []);

  useEffect(() => {
    if (idHousekeeper) {
      const selectedHK = housekeepers.find(h => h.id == idHousekeeper);
      if (selectedHK) {
        const branchId = selectedHK.id_branche;
        const roomsOfBranch = rooms.filter(room => room.branch_id == branchId);
        setFilteredRooms(roomsOfBranch);
      }
    } else {
      setFilteredRooms([]);
    }
  }, [idHousekeeper, housekeepers, rooms]);

  const handleSubmit = async () => {
    if (!nombre || !assignmentDate || !submissionDate || !idRoom || !idHousekeeper) {
      alert('Por favor, completa todos los campos');
      return;
    }

    const data = {
      nombre,
      photo_url: photo,
      condition,
      assignment_date: assignmentDate,
      submission_date: submissionDate,
      id_room: idRoom,
      id_housekeeper: idHousekeeper
    };

    if (editingId) {
      await actions.updateHouseKeeperTask(editingId, data);
    } else {
      await actions.createHouseKeeperTask(data);
      await actions.getHouseKeeperTasks(); // Recargar tareas para verlas completas
    }

    resetForm();
  };

  const editHouseKeeperTask = (id) => {
    const task = houseKeeperTasks.find((t) => t.id === id);
    if (task) {
      setNombre(task.nombre);
      setPhoto(task.photo_url);
      setCondition(task.condition || '');
      setAssignmentDate(task.assignment_date);
      setSubmissionDate(task.submission_date);
      setIdRoom(task.id_room);
      setIdHousekeeper(task.id_housekeeper);
      setEditingId(id);
    }
  };

  const deleteHouseKeeperTask = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      await actions.deleteHouseKeeperTask(id);
      await actions.getHouseKeeperTasks(); // Recargar después de eliminar
    }
  };

  const resetForm = () => {
    setNombre('');
    setPhoto('');
    setCondition('PENDIENTE');
    setAssignmentDate('');
    setSubmissionDate('');
    setIdRoom('');
    setIdHousekeeper('');
    setEditingId(null);
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container">
        <h1>Gestión de Tareas de Camarera</h1>

        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">{editingId ? 'Editar' : 'Crear'} Tarea</h5>

            <div className="form-group">
              <label><strong>Camarera</strong></label>
              <select
                className="form-control"
                value={idHousekeeper}
                onChange={(e) => setIdHousekeeper(e.target.value)}>
                <option value="">Selecciona un HouseKeeper</option>
                {housekeepers.map((h) => (
                  <option key={h.id} value={h.id}>{h.nombre}</option>
                ))}
              </select>
              {idHousekeeper && (
                <p className="text-muted">
                  Sucursal: {housekeepers.find(h => h.id == idHousekeeper)?.branch_nombre || 'Desconocida'}
                </p>
              )}
            </div>

            <div className="form-group">
              <label><strong>Habitación</strong></label>
              <select className="form-control" value={idRoom} onChange={(e) => setIdRoom(e.target.value)}>
                <option value="">Selecciona una habitación</option>
                {filteredRooms.map((room) => (
                  <option key={room.id} value={room.id}>{room.nombre}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label><strong>Tarea</strong></label>
              <input className="form-control" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <label><strong>Foto (subir imagen)</strong></label>
            <CloudinaryApiHotel
              setPhotoUrl={setPhoto}
              setErrorMessage={(msg) => console.error("Error de Cloudinary:", msg)}
            />
            {photo && (
              <img src={photo} alt="Preview" style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", marginTop: "10px" }} />
            )}

            <div className="form-group">
              <label><strong>Fecha de Entrega</strong></label>
              <input type="date" className="form-control" value={submissionDate} onChange={(e) => setSubmissionDate(e.target.value)} />
            </div>



            <div className="form-group">
              <button
                className="btn"
                style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}
                onClick={handleSubmit}>
                {editingId ? 'Actualizar' : 'Crear'} Tarea
              </button>
              {editingId && (
                <button className="btn btn-secondary ml-2" onClick={resetForm}>Cancelar</button>
              )}
            </div>
          </div>
        </div>

        <h3>Tareas de HouseKeeper</h3>
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Tarea</th>
                <th>Estado</th>
                {/* <th>Asignación</th> */}
                <th>Entrega</th>
                <th>Habitación</th>
                <th>Foto</th>
                <th>Camarera</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(houseKeeperTasks) && houseKeeperTasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.nombre}</td>
                  <td>{task.condition}</td>
                  {/* <td>{task.assignment_date}</td> */}
                  <td>{task.submission_date}</td>
                  <td>{task.room_nombre || task.id_room}</td>
                  <td>
                  {task.photo_url ? (
                    <img
                      src={task.photo_url}
                      alt="Incidencia"
                      style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px" }}
                    />
                  ) : (
                    <span className="text-muted">Sin foto</span>
                  )}
                </td>
                  <td>{task.housekeeper_nombre || task.id_housekeeper}</td>
                  <td>
                    <button className="btn btn-sm mr-2" style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }} onClick={() => editHouseKeeperTask(task.id)}>Editar</button>
                    <button className="btn btn-sm" style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }} onClick={() => deleteHouseKeeperTask(task.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HouseKeeperTask;
