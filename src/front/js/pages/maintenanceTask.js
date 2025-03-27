import React, { useState, useEffect, useContext } from 'react';
import { Context } from "../store/appContext";
import Sidebar from "../component/sidebar";
import CloudinaryApiHotel from "../component/cloudinaryApiHotel";



const MaintenanceTask = () => {
  const { store, actions } = useContext(Context);
  const [nombre, setNombre] = useState('');
  const [photo, setPhoto] = useState('');
  const [condition, setCondition] = useState('PENDIENTE');  // Estado por defecto "PENDIENTE"
  const [idRoom, setIdRoom] = useState('');
  const [errorMessage, setErrorMessage] = useState("");
  const [idMaintenance, setIdMaintenance] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('');

  const resetForm = () => {
    setNombre('');
    setPhoto('');
    setCondition('PENDIENTE');  // Resetear a "PENDIENTE"
    setIdRoom('');
    setIdMaintenance('');
    setSelectedBranch('');
    setEditingId(null);
  };


  const handleCreateOrUpdate = () => {
    if (!nombre || !idRoom || !idMaintenance) {
      alert('Por favor, completa todos los campos obligatorios');
      return;
    }

    const payload = {
      nombre,
      photo_url: photo,
      condition,
      room_id: idRoom,
      maintenance_id: idMaintenance || null,
    };

    if (editingId) {
      actions.updateMaintenanceTask(editingId, payload);
    } else {
      actions.createMaintenanceTask(payload);
    }

    resetForm();
  };

  const editMaintenanceTask = (task) => {
    setNombre(task.nombre);
    setPhoto(task.photo_url || '');
    setCondition(task.condition || '');
    setIdRoom(task.room_id);
    setIdMaintenance(task.maintenance_id || '');
    setSelectedBranch(task.room?.branch?.id || '');
    setEditingId(task.id);
  };


  const cancelEdit = () => {
    resetForm();
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Estás segura/o de que quieres eliminar esta tarea?')) {
      actions.deleteMaintenanceTask(id);
    }
  };

  useEffect(() => {
    actions.getMaintenanceTasks();
    actions.getBranches();
    actions.getRooms();
    actions.getMaintenances();
    actions.getHousekeepers();
    actions.getRoomsByBranch();
  }, []);



  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container">
        <h1>Gestión de Tareas de Mantenimiento</h1>
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">{editingId ? 'Editar' : 'Crear'} Tarea de Mantenimiento</h5>
            <form>
              <div className="form-group">
                <label><strong>Tarea</strong></label>
                <input
                  type="text"
                  className="form-control"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label><strong>Habitación</strong></label>
                <select
                  className="form-control"
                  value={idRoom}
                  onChange={e => setIdRoom(e.target.value)}
                >
                  <option value="">Selecciona una habitación</option>
                  {Array.isArray(store.rooms) && store.rooms.map(room => (
                    <option key={room.id} value={room.id}>{room.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label><strong>Foto (subir imagen)</strong></label>
                <CloudinaryApiHotel
                  onUploadSuccess={(result) => setPhotoUrl(result.url)}
                  setErrorMessage={setErrorMessage}
                />
              </div>

              {photo && (
                <div className="mt-2">
                  <label><strong>Vista previa:</strong></label>
                  <img src={photo} alt="preview" style={{ width: "100%", maxWidth: "300px", borderRadius: "10px" }} />
                </div>
              )}


              {/* <div className="form-group">
                <label>Estado en que se encuentra</label>
                <input
                  type="text"
                  className="form-control"
                  value={condition}
                  onChange={e => setCondition(e.target.value)}
                />
              </div> */}

              <div className="form-group">
                <label><strong>Sucursal</strong></label>
                <select
                  className="form-control"
                  value={selectedBranch}
                  onChange={(e) => {
                    setSelectedBranch(e.target.value);
                    actions.getRoomsByBranch(e.target.value);
                  }}
                >
                  <option value="">Selecciona una sucursal</option>
                  {Array.isArray(store.branches) && store.branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.nombre}</option>
                  ))}
                </select>
              </div>

              

              <div className="form-group">
                <label><strong>Técnico de Mantenimiento</strong></label>
                <select
                  className="form-control"
                  value={idMaintenance}
                  onChange={e => setIdMaintenance(e.target.value)}
                >
                  <option value="">Selecciona un técnico</option>
                  {Array.isArray(store.maintenances) && store.maintenances.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="btn mt-3"
                style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}
                onClick={handleCreateOrUpdate}
              >
                {editingId ? "Actualizar" : "Crear"} Tarea
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn mt-3 ml-2"
                  style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}
                  onClick={cancelEdit}
                >
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
              <th>Técnico</th>
              <th>Tarea</th>
              <th>Estado</th>
              <th>Sucursal</th>
              <th>Habitación</th>
              <th>Foto</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {Array.isArray(store.maintenanceTasks) && store.maintenanceTasks.map(task => (
              <tr key={task.id}>
                <td>{task.maintenance?.nombre || "-"}</td>
                <td>{task.nombre}</td>
                <td>{task.condition}</td>
                <td> {store.branches.find(branch => branch.id === task.room?.branch_id)?.nombre || "-"}</td>
                <td>{task.room_nombre || task.room?.nombre}</td>
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
                <td>
                  <button className="btn btn-sm" style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }} onClick={() => editMaintenanceTask(task)}>
                    Editar
                  </button>
                  <button className="btn btn-sm ml-2" style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }} onClick={() => handleDelete(task.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
};

export default MaintenanceTask;
