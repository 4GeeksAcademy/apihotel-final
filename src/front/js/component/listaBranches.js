import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AutocompleteWithMap from "./autoComplete";
import Sidebar from "./sidebar";

const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [branchSeleccionado, setBranchSeleccionado] = useState(null);
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [longitud, setLongitud] = useState("");
  const [latitud, setLatitud] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetch(process.env.BACKEND_URL + "/api/branches", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.json())
      .then((data) => setBranches(Array.isArray(data) ? data : []))
      .catch((error) => console.error("Error:", error));
  }, [navigate]);

  const handleLatLngChange = (lat, lng) => {
    setLatitud(lat);
    setLongitud(lng);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    const url =
      process.env.BACKEND_URL +
      (branchSeleccionado ? `/api/branches/${branchSeleccionado.id}` : "/api/branches");
    const method = branchSeleccionado ? "PUT" : "POST";

    fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nombre,
        direccion,
        latitud: parseFloat(latitud),
        longitud: parseFloat(longitud),
      }),
    })
      .then((response) => response.json())
      .then((branch) => {
        setBranches(
          branchSeleccionado
            ? branches.map((b) => (b.id === branch.id ? branch : b))
            : [...branches, branch]
        );
        setBranchSeleccionado(null);
        setNombre("");
        setDireccion("");
        setLongitud("");
        setLatitud("");
        setMostrarFormulario(false);
      })
      .catch((error) => alert(error.message));
  };

  return (
    <>
      <div className="d-flex">
        <Sidebar />

        <div className="main-content flex-fill p-4">
          <div className="container text-center">
            <h2 className="my-3">Branches</h2>

            <div className="d-flex justify-content-center align-items-center mb-4">
              <button
                className="btn"
                style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}
                onClick={() => {
                  setBranchSeleccionado(null);
                  setNombre("");
                  setDireccion("");
                  setMostrarFormulario(true);
                }}
              >
                Crear Branch
              </button>
            </div>

            <div className="row bg-light p-2 fw-bold border-bottom">
              <div className="col">Nombre</div>
              <div className="col">Dirección</div>
              <div className="col text-center">Acciones</div>
            </div>

            {branches.map((branch) => (
              <div key={branch.id} className="row p-2 border-bottom align-items-center">
                <div className="col">{branch.nombre}</div>
                <div className="col">{branch.direccion}</div>
                <div className="col text-center">
                  <button
                    className="btn me-2"
                    style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}
                    onClick={() => {
                      setBranchSeleccionado(branch);
                      setNombre(branch.nombre);
                      setDireccion(branch.direccion);
                      setMostrarFormulario(true);
                    }}
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}

            {mostrarFormulario && (
              <div className="card p-4 mt-5">
                <h3 className="text-center mb-4">
                  {branchSeleccionado ? "Editar Branch" : "Crear Branch"}
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
                    className="btn w-100 mt-3"
                    style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}
                  >
                    {branchSeleccionado ? "Guardar Cambios" : "Crear Branch"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Branches;