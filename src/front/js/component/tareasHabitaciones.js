import React, { useContext, useEffect, useState } from "react";
import { Context } from "../store/appContext";
import PrivateLayout from "./privateLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave } from "@fortawesome/free-solid-svg-icons";

const CrearTareasPorHabitacion = () => {
  const { store, actions } = useContext(Context);
  const [housekeeperId, setHousekeeperId] = useState("");
  const [roomsByBranch, setRoomsByBranch] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [nombre, setNombre] = useState("");
  const [condition, setCondition] = useState("PENDIENTE");

  useEffect(() => {
    actions.getHousekeepers();
    actions.getRooms();
  }, []);

  useEffect(() => {
    if (housekeeperId) {
      const hk = store.housekeepers.find(h => h.id == housekeeperId);
      const rooms = store.rooms.filter(r => r.branch_id === hk.id_branche);
      setRoomsByBranch(rooms);
      setSelectedRooms([]);
    }
  }, [housekeeperId, store.rooms]);

  const toggleRoomSelection = (roomId) => {
    setSelectedRooms(prev =>
      prev.includes(roomId)
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!housekeeperId || selectedRooms.length === 0 || !nombre) {
      alert("Completa todos los campos obligatorios");
      return;
    }

    const payload = selectedRooms.map(roomId => ({
      nombre,
      condition,
      id_room: roomId,
      id_housekeeper: parseInt(housekeeperId),
      assignment_date: new Date().toISOString().split("T")[0],
      submission_date: "",
      photo_url: ""
    }));

    const success = await actions.createMultipleHouseKeeperTasks(payload);
    if (success) {
      alert("Tareas creadas correctamente");
      setNombre("");
      setSelectedRooms([]);
    }
  };

  return (
    <PrivateLayout>
      <div className="container">
        <h3 className="text-center my-4">Crear Tareas por Habitaciones</h3>
        <form onSubmit={handleSubmit} className="card p-4 shadow">
          <div className="mb-3">
            <label className="form-label fw-bold">Selecciona una Camarera</label>
            <select
              className="form-select"
              value={housekeeperId}
              onChange={(e) => setHousekeeperId(e.target.value)}
            >
              <option value="">Selecciona una opción</option>
              {store.housekeepers.map(h => (
                <option key={h.id} value={h.id}>{h.nombre}</option>
              ))}
            </select>
          </div>

          {roomsByBranch.length > 0 && (
            <div className="mb-3">
              <label className="form-label fw-bold">Selecciona habitaciones</label>
              <div className="row">
                {roomsByBranch.map(room => (
                  <div className="col-md-3" key={room.id}>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`room-${room.id}`}
                        checked={selectedRooms.includes(room.id)}
                        onChange={() => toggleRoomSelection(room.id)}
                      />
                      <label className="form-check-label" htmlFor={`room-${room.id}`}>
                        {room.nombre}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-3">
            <label className="form-label fw-bold">Tarea</label>
            <input
              type="text"
              className="form-control"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div className="d-grid">
            <button className="btn btn-primary" type="submit">
              <FontAwesomeIcon icon={faSave} className="me-2" />Crear Tareas
            </button>
          </div>
        </form>
      </div>
    </PrivateLayout>
  );
};

export default CrearTareasPorHabitacion;
