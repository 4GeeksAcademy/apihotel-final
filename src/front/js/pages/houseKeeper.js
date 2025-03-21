import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../component/sidebar";

const HouseKeeper = () => {
  const [housekeepers, setHousekeepers] = useState([]);
  const [housekeeperSeleccionado, setHousekeeperSeleccionado] = useState(null);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const backendUrl = process.env.REACT_APP_BACKEND_URL || process.env.BACKEND_URL;

  useEffect(() => {
    verificarAutenticacion();
    cargarSucursales();
    cargarHousekeepers();
  }, []);

  const verificarAutenticacion = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("No tienes acceso. Inicia sesión.");
      navigate("/login");
    }
  };

  const cargarSucursales = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${backendUrl}/api/branches`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Error al cargar sucursales");
      const data = await response.json();
      setBranches(data);
    } catch (error) {
      console.error("Error al obtener sucursales:", error);
      setError("Error de conexión");
    }
  };

  const cargarHousekeepers = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${backendUrl}/api/housekeepers`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Error al cargar housekeepers");
      const data = await response.json();
      setHousekeepers(data);
    } catch (error) {
      console.error("Error al obtener housekeepers:", error);
      setError("Error de conexión");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!branchId) {
      alert("Debes seleccionar una sucursal.");
      return;
    }

    const housekeeperData = {
      nombre,
      email,
      password,
      id_branche: parseInt(branchId)
    };

    const url = housekeeperSeleccionado
      ? `${backendUrl}/api/housekeepers/${housekeeperSeleccionado.id}`
      : `${backendUrl}/api/housekeepers`;

    const method = housekeeperSeleccionado ? "PUT" : "POST";
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(housekeeperData)
      });

      if (!response.ok)
        throw new Error(`Error al ${housekeeperSeleccionado ? "actualizar" : "crear"} el housekeeper`);

      const nuevoHousekeeper = await response.json();
      if (housekeeperSeleccionado) {
        setHousekeepers((prev) =>
          prev.map((m) => (m.id === nuevoHousekeeper.id ? nuevoHousekeeper : m))
        );
      } else {
        setHousekeepers((prev) => [...prev, nuevoHousekeeper]);
      }

      setHousekeeperSeleccionado(null);
      setNombre("");
      setEmail("");
      setPassword("");
      setBranchId("");
      setMostrarFormulario(false);
    } catch (error) {
      alert(error.message);
    }
  };

  const eliminarHousekeeper = async (id) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${backendUrl}/api/housekeepers/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Hubo un problema al eliminar el housekeeper");
      setHousekeepers((prev) =>
        prev.filter((housekeeper) => housekeeper.id !== id)
      );
    } catch (error) {
      alert("Error al eliminar: " + error.message);
    }
  };

  return (
    <>
      <div className="d-flex">
        <Sidebar />
        <div className="container">
          <h2 className="text-center my-3">Housekeepers</h2>

          <div className="d-flex justify-content-center align-items-center mb-4">
            <button
              className="btn"
              style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}
              onClick={() => {
                setHousekeeperSeleccionado(null);
                setNombre("");
                setEmail("");
                setPassword("");
                setBranchId("");
                setMostrarFormulario(true);
              }}
            >
              Crear Housekeeper
            </button>
          </div>

          <div className="row bg-light p-2 fw-bold border-bottom">
            <div className="col">Nombre</div>
            <div className="col">Email</div>
            <div className="col">Sucursal</div>
            <div className="col text-center">Acciones</div>
          </div>

          {housekeepers.map((housekeeper) => (
            <div key={housekeeper.id} className="row p-2 border-bottom align-items-center">
              <div className="col">{housekeeper.nombre}</div>
              <div className="col">{housekeeper.email}</div>
              <div className="col">{branches.find(branch => branch.id === housekeeper.id_branche)?.nombre || "No asignado"}</div>
              <div className="col d-flex justify-content-center">
                <button
                  className="btn me-2"
                  style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}
                  onClick={() => {
                    setHousekeeperSeleccionado(housekeeper);
                    setNombre(housekeeper.nombre);
                    setEmail(housekeeper.email);
                    setPassword(housekeeper.password);
                    setBranchId(housekeeper.id_branche);
                    setMostrarFormulario(true);
                  }}
                >
                  Editar
                </button>
                <button
                  className="btn"
                  style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}
                  onClick={() => eliminarHousekeeper(housekeeper.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}

          {mostrarFormulario && (
            <div className="card p-4 mt-5">
              <h3 className="text-center mb-4">
                {housekeeperSeleccionado ? "Editar Housekeeper" : "Crear Housekeeper"}
              </h3>
              <form onSubmit={handleSubmit}>
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="form-control mb-3" placeholder="Nombre" required />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-control mb-3" placeholder="Email" required />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-control mb-3" placeholder="Contraseña" required />
                <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="form-control mb-3" required>
                  <option value="">Seleccionar Sucursal</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>{branch.nombre}</option>
                  ))}
                </select>
                <button type="submit" className="btn w-100" style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}>
                  {housekeeperSeleccionado ? "Guardar Cambios" : "Crear Housekeeper"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HouseKeeper;
