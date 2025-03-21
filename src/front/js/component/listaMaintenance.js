import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../component/sidebar";

const Maintenance = () => {
  const [maintenance, setMaintenance] = useState([]);
  const [maintenanceSeleccionado, setMaintenanceSeleccionado] = useState(null);
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
    cargarMantenimiento();
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

  const cargarMantenimiento = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${backendUrl}/api/maintenance`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Error al cargar mantenimiento");
      const data = await response.json();
      setMaintenance(data);
    } catch (error) {
      console.error("Error al obtener mantenimiento:", error);
      setError("Error de conexión");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!branchId) {
      alert("Debes seleccionar una sucursal.");
      return;
    }

    const maintenanceData = {
      nombre,
      email,
      password,
      branch_id: parseInt(branchId)
    };

    const url = maintenanceSeleccionado
      ? `${backendUrl}/api/maintenance/${maintenanceSeleccionado.id}`
      : `${backendUrl}/api/maintenance`;

    const method = maintenanceSeleccionado ? "PUT" : "POST";
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(maintenanceData)
      });

      if (!response.ok)
        throw new Error(`Error al ${maintenanceSeleccionado ? "actualizar" : "crear"} el técnico`);

      const nuevoTecnico = await response.json();
      if (maintenanceSeleccionado) {
        setMaintenance((prev) =>
          prev.map((m) => (m.id === nuevoTecnico.id ? nuevoTecnico : m))
        );
      } else {
        setMaintenance((prev) => [...prev, nuevoTecnico]);
      }

      setMaintenanceSeleccionado(null);
      setNombre("");
      setEmail("");
      setPassword("");
      setBranchId("");
      setMostrarFormulario(false);
      navigate("/listaMaintenance");
    } catch (error) {
      alert(error.message);
    }
  };

  const eliminarMaintenance = async (id) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${backendUrl}/api/maintenance/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Hubo un problema al eliminar el mantenimiento");
      setMaintenance((prev) =>
        prev.filter((mantenimiento) => mantenimiento.id !== id)
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
          <h2 className="text-center my-3">Técnicos de Mantenimiento</h2>

          <div className="d-flex justify-content-center align-items-center mb-4">
            <button
              className="btn"
              style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}
              onClick={() => {
                setMaintenanceSeleccionado(null);
                setNombre("");
                setEmail("");
                setPassword("");
                setBranchId("");
                setMostrarFormulario(true);
              }}
            >
              Crear Técnico de Mantenimiento
            </button>
          </div>

          <div className="row bg-light p-2 fw-bold border-bottom">
            <div className="col">Nombre</div>
            <div className="col">Email</div>
            <div className="col">Sucursal</div>
            <div className="col text-center">Acciones</div>
          </div>

          {maintenance.map((mantenimiento) => (
            <div key={mantenimiento.id} className="row p-2 border-bottom align-items-center">
              <div className="col">{mantenimiento.nombre}</div>
              <div className="col">{mantenimiento.email}</div>
              <div className="col">{branches.find(branch => branch.id === mantenimiento.branch_id)?.nombre || "No asignado"}</div>
              <div className="col d-flex justify-content-center">
                <button
                  className="btn me-2"
                  style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}
                  onClick={() => {
                    setMaintenanceSeleccionado(mantenimiento);
                    setNombre(mantenimiento.nombre);
                    setEmail(mantenimiento.email);
                    setPassword(mantenimiento.password);
                    setBranchId(mantenimiento.branch_id);
                    setMostrarFormulario(true);
                  }}
                >
                  Editar
                </button>
                <button
                  className="btn"
                  style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}
                  onClick={() => eliminarMaintenance(mantenimiento.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}

          {mostrarFormulario && (
            <div className="card p-4 mt-5">
              <h3 className="text-center mb-4">
                {maintenanceSeleccionado ? "Editar Técnico" : "Crear Técnico"}
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
                  {maintenanceSeleccionado ? "Guardar Cambios" : "Crear Técnico"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Maintenance;
