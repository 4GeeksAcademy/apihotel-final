import React, { useContext, useEffect, useState } from "react";
import { Context } from "../store/appContext";
import PrivateLayout from "./privateLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash, faPlus, faSave, faTimes } from "@fortawesome/free-solid-svg-icons";

const ListaRoom = () => {
  const { store, actions } = useContext(Context);
  const [branchId, setBranchId] = useState("");
  const [habitacionesPorPlanta, setHabitacionesPorPlanta] = useState("");
  const [numPlantas, setNumPlantas] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [eliminando, setEliminando] = useState(null);

  useEffect(() => {
    actions.getRooms();
    actions.getBranches();
  }, []);

  const resetForm = () => {
    setHabitacionesPorPlanta("");
    setBranchId("");
    setNumPlantas("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!numPlantas || !habitacionesPorPlanta || !branchId) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    const habitacionesArray = habitacionesPorPlanta.split(",").map((num) => parseInt(num.trim()));
    if (habitacionesArray.length !== parseInt(numPlantas)) {
      alert(`Debe indicar ${numPlantas} valores separados por coma.`);
      return;
    }

    await actions.createMultipleRooms({
      branch_id: parseInt(branchId),
      floors: parseInt(numPlantas),
      rooms_per_floor: habitacionesArray
    });

    resetForm(); 
  };

    

  const eliminarRoom = async (id) => {
    if (!window.confirm("¿Estás segura/o de que quieres eliminar esta habitación?")) return;
    setEliminando(id);
    await actions.deleteRoom(id);
    setEliminando(null);
  };

  // Agrupar habitaciones por sucursal
  const roomsPorSucursal = store.branches.reduce((acc, branch) => {
    acc[branch.id] = store.rooms.filter(room => room.branch_id === branch.id);
    return acc;
  }, {});

  return (
    <PrivateLayout>
      <div className="container-fluid">
        <h2 className="text-center my-3">Gestión de Habitaciones</h2>
        <div className="row">
          {/* Formulario */}
          <div className="col-md-4">
            <div className="card p-4 shadow">
              <h4 className="text-center mb-3">Crear Múltiples Habitaciones</h4>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Sucursal</label>
                  <select
                    className="form-select"
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    required
                  >
                    <option value="">Seleccione una sucursal</option>
                    {store.branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>{branch.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">¿Cuántas plantas tiene?</label>
                  <input
                    type="number"
                    className="form-control"
                    value={numPlantas}
                    onChange={(e) => setNumPlantas(e.target.value)}
                    placeholder="Ej. 3"
                    min="1"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">¿Cuántas habitaciones por planta? (Separadas por coma)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={habitacionesPorPlanta}
                    onChange={(e) => setHabitacionesPorPlanta(e.target.value)}
                    placeholder="Ej. 3,5,4"
                    required
                  />
                  <small className="text-muted">Debes ingresar {numPlantas || 0} valores separados por coma.</small>
                </div>

                <div className="d-flex justify-content-between">
                  <button type="submit" className="btn" style={{ backgroundColor: "#0dcaf0", color: "white" }}>
                    <FontAwesomeIcon icon={faSave} className="me-2" />Crear Habitaciones
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>
                    <FontAwesomeIcon icon={faTimes} className="me-2" />Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Lista de habitaciones */}
          <div className="col-md-8">
            <div className="row">
              {store.branches.map(branch => (
                <div className="col-md-6 mb-4" key={branch.id}>
                  <div className="card shadow">
                    <div className="card-header bg-light fw-bold">{branch.nombre}</div>
                    <div className="card-body">
                      {roomsPorSucursal[branch.id]?.length === 0 ? (
                        <div className="text-muted">Sin habitaciones</div>
                      ) : (
                        roomsPorSucursal[branch.id].map((room) => (
                          <div key={room.id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                            <span>{room.nombre}</span>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => eliminarRoom(room.id)}
                              disabled={eliminando === room.id}
                            >
                              {eliminando === room.id ? "..." : <FontAwesomeIcon icon={faTrash} />}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PrivateLayout>
  );
};

export default ListaRoom;
