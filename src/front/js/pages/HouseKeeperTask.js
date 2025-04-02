import React, { useState, useEffect, useContext } from 'react';
import { Context } from "../store/appContext";
import PrivateLayout from "../component/privateLayout";
import CloudinaryApiHotel from "../component/cloudinaryApiHotel";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faTimes, faPen, faTrash } from "@fortawesome/free-solid-svg-icons";

const HouseKeeperTask = () => {
  const { store, actions } = useContext(Context);
  const { housekeepers = [], rooms = [], housekeeperTasks = [], branches = [] } = store;
  const [condition, setCondition] = useState('PENDIENTE');
  const [nombre, setNombre] = useState('');
  const [photo, setPhoto] = useState('');
  const [assignmentDate, setAssignmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [submissionDate, setSubmissionDate] = useState('');
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [idHousekeeper, setIdHousekeeper] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [esZonaComun, setEsZonaComun] = useState(false);

  useEffect(() => {
    actions.getHousekeepers();
    actions.getBranches();
    actions.getRooms();
    actions.getHouseKeeperTasks();
  }, []);



  const filteredRooms = idHousekeeper
    ? rooms.filter(room => {
      const hk = housekeepers.find(h => h.id == idHousekeeper);
      return hk ? room.branch_id === hk.id_branche : false;
    })
    : [];

  const getTaskConditionForRoom = (roomId) => {
    const task = housekeeperTasks.find(t =>
      t.id_housekeeper === parseInt(idHousekeeper) && t.id_room === roomId
    );
    return task ? task.condition : null;
  };


  const getColorClassForCondition = (condition) => {
    switch (condition) {
      case 'PENDIENTE': return 'btn-danger';
      case 'EN PROCESO': return 'btn-warning';
      case 'FINALIZADA': return 'btn-success';
      default: return 'btn-outline-secondary';
    }
  };

  const toggleRoomSelection = (roomId) => {
    if (editingTaskId) {
      setSelectedRooms([roomId]); // solo una habitación al editar
    } else {
      const existing = getTaskConditionForRoom(roomId);
      if (!existing) {
        setSelectedRooms(prev =>
          prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
        );
      }
    }
  };


  const handleSubmit = async () => {
    if (!idHousekeeper || !nombre || (!esZonaComun && selectedRooms.length === 0) || !assignmentDate || !submissionDate) {
      alert("Por favor completa todos los campos requeridos.");
      return;
    }

    if (editingTaskId) {
      const updatedTask = {
        nombre,
        photo_url: photo,
        condition,
        assignment_date: assignmentDate,
        submission_date: submissionDate,
        id_room: esZonaComun ? null : selectedRooms[0],
        id_housekeeper: idHousekeeper
      };
      await actions.updateHouseKeeperTask(editingTaskId, updatedTask);
    } else {
      const data = esZonaComun
        ? [{
          nombre,
          photo_url: photo,
          condition,
          assignment_date: assignmentDate,
          submission_date: submissionDate,
          id_room: null,
          id_housekeeper: idHousekeeper
        }]
        : selectedRooms.map(roomId => ({
          nombre,
          photo_url: photo,
          condition,
          assignment_date: assignmentDate,
          submission_date: submissionDate,
          id_room: roomId,
          id_housekeeper: idHousekeeper
        }));

      for (const tarea of data) {
        await actions.createHouseKeeperTask(tarea);
      }
    }

    await actions.getHouseKeeperTasks();
    resetForm();
  };

  const handleEdit = (task) => {
    setEditingTaskId(task.id);
    setNombre(task.nombre);
    setPhoto(task.photo_url || '');
    setCondition(task.condition);
    setAssignmentDate(task.assignment_date);
    setSubmissionDate(task.submission_date);
    setIdHousekeeper(task.id_housekeeper.toString());
    setSelectedRooms(task.id_room ? [task.id_room] : []);
    setEsZonaComun(task.id_room === null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás segura/o de eliminar esta tarea?")) {
      await actions.deleteHouseKeeperTask(id);
      await actions.getHouseKeeperTasks();
    }
  };

  const resetForm = () => {
    setNombre('');
    setPhoto('');
    setCondition('PENDIENTE');
    setAssignmentDate(new Date().toISOString().split('T')[0]);
    setSubmissionDate('');
    setSelectedRooms([]);
    setIdHousekeeper('');
    setEditingTaskId(null);
    setEsZonaComun(false);
  };

  return (
    <PrivateLayout>
      <div className="container">
        <h1 className="my-4 text-center">Asignar Tareas de Limpieza</h1>
        <div className="row">
          <div className="col-12 col-md-3 mb-4">
            <div className="card shadow-sm p-3">
              <h5 className="text-center mb-3">{editingTaskId ? "Editar Tarea" : "Nueva Tarea"}</h5>
              <div className="form-group mb-2">
                <label>Camarera</label>
                <select className="form-control" value={idHousekeeper} onChange={e => setIdHousekeeper(e.target.value)}>
                  <option value="">Selecciona una camarera</option>
                  {housekeepers.map(h => (
                    <option key={h.id} value={h.id}>{h.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={esZonaComun}
                  onChange={() => setEsZonaComun(!esZonaComun)}
                  id="zonaComunCheck"
                />
                <label className="form-check-label" htmlFor="zonaComunCheck">
                  Tarea fuera de una habitación (pasillos, baños, piscina...)
                </label>
              </div>

              {!esZonaComun && (
                <div className="form-group mb-2">
                  <label>Habitaciones</label>
                  {filteredRooms.length === 0 ? (
                    <div className="text-muted">Selecciona una camarera</div>
                  ) : (
                    <div className="d-flex flex-wrap gap-2">
                      {filteredRooms.map(room => {
                        const condition = getTaskConditionForRoom(room.id);
                        const selected = selectedRooms.includes(room.id);
                        const colorClass = condition
                          ? getColorClassForCondition(condition)
                          : selected
                            ? 'btn-primary'
                            : 'btn-outline-secondary';
                        return (
                          <button
                            key={room.id}
                            type="button"
                            className={`btn btn-sm ${colorClass}`}
                            onClick={() => toggleRoomSelection(room.id)}
                            disabled={
                              !!condition &&
                              (!editingTaskId || selectedRooms[0] !== room.id)
                            }

                            title={condition ? `Ya tiene tarea (${condition})` : 'Seleccionar'}
                          >
                            {room.nombre}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="form-group mb-2">
                <label>Tipo de Tarea</label>
                <input className="form-control" value={nombre} onChange={e => setNombre(e.target.value)} />
              </div>

              <div className="form-group mb-2">
                <label>Foto</label>
                <CloudinaryApiHotel setPhotoUrl={setPhoto} setErrorMessage={setErrorMessage} />
                {photo && <img src={photo} alt="Preview" style={{ width: 60, marginTop: 10 }} />}
              </div>

              <div className="form-group mb-2">
                <label>Entrega</label>
                <input type="date" className="form-control" value={submissionDate} onChange={e => setSubmissionDate(e.target.value)} />
              </div>

              <div className="d-flex justify-content-between">
                <button className="btn btn-success" onClick={handleSubmit}>
                  <FontAwesomeIcon icon={faSave} className="me-1" /> {editingTaskId ? "Actualizar" : "Crear"}
                </button>
                <button className="btn btn-secondary" onClick={resetForm}>
                  <FontAwesomeIcon icon={faTimes} className="me-1" /> Cancelar
                </button>
              </div>

              {errorMessage && <p className="text-danger mt-2">{errorMessage}</p>}
            </div>
          </div>

          <div className="col-12 col-md-9">
            <h4 className="mb-3">Tareas Actuales</h4>
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Camarera</th>
                  <th>Tarea</th>
                  <th>Estado</th>
                  <th>Entrega</th>
                  <th>Habitación</th>
                  <th>Sucursal</th>
                  <th>Foto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {housekeeperTasks.map(task => (
                  <tr key={task.id}>
                    <td>{housekeepers.find(h => h.id === task.id_housekeeper)?.nombre || 'Camarera'}</td>
                    <td>{task.nombre}</td>
                    <td>
                      <span className={`badge ${task.condition === 'PENDIENTE' ? 'bg-danger' :
                        task.condition === 'EN PROCESO' ? 'bg-warning text-dark' :
                          'bg-success'
                        }`}>
                        {task.condition}
                      </span>
                    </td>
                    <td>{task.submission_date}</td>
                    <td>{task.room_nombre || 'Zona común'}</td>
                    <td>
                      {task.room_branch_id
                        ? branches.find(b => b.id === task.room_branch_id)?.nombre || '-'
                        : branches.find(b => b.id === housekeepers.find(h => h.id === task.id_housekeeper)?.id_branche)?.nombre || '-'}
                    </td>

                    <td>
                      {task.photo_url
                        ? <img src={task.photo_url} alt="" style={{ width: 40, height: 40, borderRadius: 4 }} />
                        : 'Sin foto'}
                    </td>
                    <td>
                      <button className="btn btn-sm btn-info me-1" onClick={() => handleEdit(task)}>
                        <FontAwesomeIcon icon={faPen} />
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(task.id)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PrivateLayout>
  );
};

export default HouseKeeperTask;
