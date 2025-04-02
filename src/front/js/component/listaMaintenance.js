import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Context } from "../store/appContext";
import CloudinaryApiHotel from "../component/cloudinaryApiHotel";
import PrivateLayout from "./privateLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash, faPlus, faSave, faTimes } from "@fortawesome/free-solid-svg-icons";

const Maintenance = () => {
  const [maintenanceSeleccionado, setMaintenanceSeleccionado] = useState(null);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [branchId, setBranchId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const { store, actions } = useContext(Context);
  const navigate = useNavigate();

  useEffect(() => {
    actions.getMaintenances();
    actions.getBranches();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      nombre,
      email,
      password,
      photo_url: photoUrl,
      branch_id: branchId,
    };

    if (maintenanceSeleccionado) {
      actions.putMaintenance(maintenanceSeleccionado.id, data);
    } else {
      actions.postMaintenance(data);
    }

    resetFormulario();
    navigate("/listaMaintenance");
  };

  const eliminar = (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este técnico?")) {
      actions.deleteMaintenance(id);
    }
  };

  const resetFormulario = () => {
    setMaintenanceSeleccionado(null);
    setNombre("");
    setEmail("");
    setPassword("");
    setPhotoUrl("");
    setBranchId("");
    setErrorMessage("");
    setMostrarFormulario(false);
  };

  return (
    <PrivateLayout>
      <div className="container">
        <h2 className="text-center my-3">Técnicos de Mantenimiento</h2>

        <div className="row">
          {/* Formulario */}
          <div className="col-md-4">
            <button
              className="btn mb-4"
              style={{ backgroundColor: "#0dcaf0", border: "none", color: "white" }}
              onClick={() => {
                resetFormulario();
                setMostrarFormulario(true);
              }}
            >
              <FontAwesomeIcon icon={faPlus} className="me-2" />
              Crear Técnico de Mantenimiento
            </button>

            {mostrarFormulario || maintenanceSeleccionado ? (
              <div className="card p-4">
                <form onSubmit={handleSubmit}>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="form-control mb-3"
                    placeholder="Nombre"
                    required
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control mb-3"
                    placeholder="Email"
                    required
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-control mb-3"
                    placeholder="Contraseña"
                    required
                  />

                  <select
                    className="form-select mb-3"
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    required
                    style={{ backgroundColor: "#0dcaf0", color: "white", border: "none", fontWeight: "bold", padding: "10px", borderRadius: "4px" }}
                  >
                    <option value="">Seleccione una sucursal</option>
                    {store.branches?.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.nombre}</option>
                    ))}
                  </select>

                  <div className="mb-3">
                    <label htmlFor="photo" className="form-label">Foto</label>
                    <CloudinaryApiHotel setPhotoUrl={setPhotoUrl} setErrorMessage={setErrorMessage} />
                  </div>

                  {photoUrl && (
                    <img
                      src={photoUrl}
                      alt="Preview"
                      className="img-thumbnail my-3"
                      style={{ width: "150px" }}
                    />
                  )}

                  <div className="d-flex justify-content-between">
                    <button
                      type="submit"
                      className="btn"
                      style={{ backgroundColor: "#0dcaf0", border: "none", color: "white" }}
                    >
                      <FontAwesomeIcon icon={faSave} className="me-2" />
                      {maintenanceSeleccionado ? "Guardar Cambios" : "Crear Técnico"}
                    </button>
                    {!maintenanceSeleccionado && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={resetFormulario}
                      >
                        <FontAwesomeIcon icon={faTimes} className="me-2" />
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>
            ) : null}
          </div>

          {/* Lista */}
          <div className="col-md-8">
            <div className="row bg-light p-2 fw-bold border-bottom">
              <div className="col">Foto</div>
              <div className="col">Nombre</div>
              <div className="col">Email</div>
              <div className="col">Sucursal</div>
              <div className="col text-center">Acciones</div>
            </div>

            {store.maintenances?.map((mantenimiento) => (
              <div key={mantenimiento.id} className="row p-2 border-bottom align-items-center">
                <div className="col">
                  {mantenimiento.photo_url ? (
                    <img
                      src={mantenimiento.photo_url}
                      alt="foto técnico"
                      style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "50%" }}
                    />
                  ) : (
                    <span className="text-muted">Sin foto</span>
                  )}
                </div>
                <div className="col">{mantenimiento.nombre}</div>
                <div className="col">{mantenimiento.email}</div>
                <div className="col">
                  {store.branches?.find(branch => branch.id === mantenimiento.branch_id)?.nombre || "Sucursal no encontrada"}
                </div>
                <div className="col d-flex justify-content-center">
                  <button
                    className="btn me-2"
                    style={{ backgroundColor: "#0dcaf0", border: "none", color: "white" }}
                    onClick={() => {
                      setMaintenanceSeleccionado(mantenimiento);
                      setNombre(mantenimiento.nombre);
                      setEmail(mantenimiento.email);
                      setPassword(mantenimiento.password || "");
                      setPhotoUrl(mantenimiento.photo_url || "");
                      setBranchId(mantenimiento.branch_id || "");
                      setMostrarFormulario(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faPen} className="me-1" />
                  </button>

                  <button className="btn btn-danger" onClick={() => eliminar(mantenimiento.id)}>
                    <FontAwesomeIcon icon={faTrash} className="me-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PrivateLayout>
  );
};

export default Maintenance;
