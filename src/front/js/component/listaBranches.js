import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Context } from "../store/appContext";
import AutocompleteWithMap from "./autoComplete";
import PrivateLayout from "./privateLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash, faPlus, faSave } from "@fortawesome/free-solid-svg-icons";


const Branches = () => {
  const { store, actions } = useContext(Context);
  const [branchSeleccionado, setBranchSeleccionado] = useState(null);
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [longitud, setLongitud] = useState("");
  const [latitud, setLatitud] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    actions.getBranches();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const branchData = {
      nombre,
      direccion,
      longitud: longitud === "" ? null : parseFloat(longitud),
      latitud: latitud === "" ? null : parseFloat(latitud),
      hotel_id: parseInt(store.hotel.id),
    };
  
    try {
      await actions.createOrUpdateBranch(branchData, branchSeleccionado);
      await actions.getBranches();
      resetForm();
      navigate("/listaBranches");
    } catch (error) {
      alert(error.message);
    }
  };
  

  const eliminarBranch = async (id) => {
    try {
      await actions.deleteBranch(id);
      await actions.getBranches();
    } catch (error) {
      alert("Error al eliminar: " + error.message);
    }
  };

  const handleLatLngChange = (lat, lng) => {
    setLatitud(lat);
    setLongitud(lng);
  };

  const resetForm = () => {
    setBranchSeleccionado(null);
    setNombre("");
    setDireccion("");
    setLongitud("");
    setLatitud("");
    setMostrarFormulario(false);
  };

  return (
    <PrivateLayout>
      <div className="container">
        <h2 className="text-center my-3">Sucursales</h2>

        <div className="d-flex justify-content-center align-items-center mb-4">
          <button
            className="btn"
            style={{ backgroundColor: "#0dcaf0", border: "none", color: "white" }}
            onClick={() => {
              resetForm();
              setMostrarFormulario(true);
            }}
          >
            <FontAwesomeIcon icon={faPlus} className="me-1" />
            Crear Sucursal
          </button>

        </div>

        <div className="row bg-light p-2 fw-bold border-bottom">
          <div className="col">Nombre</div>
          <div className="col">Dirección</div>
          <div className="col text-center">Acciones</div>
        </div>

        {Array.isArray(store.branches) &&
          store.branches.map((branch) => (
            <div
              key={branch.id}
              className="row p-2 border-bottom align-items-center"
            >
              <div className="col">{branch.nombre}</div>
              <div className="col">{branch.direccion}</div>
              <div className="col d-flex justify-content-center">
                <button
                  className="btn me-2"
                  style={{ backgroundColor: "#0dcaf0", border: "none", color: "white" }}
                  onClick={() => {
                    setBranchSeleccionado(branch);
                    setNombre(branch.nombre);
                    setDireccion(branch.direccion);
                    setLongitud(branch.longitud);
                    setLatitud(branch.latitud);
                    setMostrarFormulario(true);
                  }}
                >
                  <FontAwesomeIcon icon={faPen} className="me-1" />
              
                </button>


                <button
                  className="btn btn-danger"
                  onClick={() => eliminarBranch(branch.id)}
                >
                  <FontAwesomeIcon icon={faTrash} className="me-1" />
          
                </button>


              </div>
            </div>
          ))}

        {mostrarFormulario && (
          <div className="card p-4 mt-5">
            <h3 className="text-center mb-4">
              {branchSeleccionado ? "Editar Sucursal" : "Crear Sucursal"}
            </h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="form-control mb-3"
                placeholder="Nombre Sucursal"
                required
              />

              <AutocompleteWithMap
                value={direccion}
                onChange={setDireccion}
                onSelect={setDireccion}
                onLatLngChange={handleLatLngChange}
              />

              <button
                type="submit"
                className="btn w-100"
                style={{ backgroundColor: "#0dcaf0", border: "none", color: "white" }}
              >
                <FontAwesomeIcon icon={faSave} className="me-2" />
                {branchSeleccionado ? "Guardar Cambios" : "Crear Sucursal"}
              </button>

            </form>
          </div>
        )}
      </div>
    </PrivateLayout>
  );
};

export default Branches;
