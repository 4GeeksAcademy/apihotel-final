// src/component/editarRoom.js
import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";


const EditarRoom = () => {
  const [nombre, setNombre] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const { id } = useParams(); // Obtener el ID de la habitación desde la URL
  const navigate = useNavigate();


  // Función para obtener la URL del backend de forma segura
  const getBackendUrl = () => {
    const baseUrl = process.env.BACKEND_URL;
    if (!baseUrl) {
      console.error("Error: BACKEND_URL no está definido.");
      setError("Error interno: No se ha configurado la URL del servidor.");
      return null;
    }
    return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  };

  // Cargar los datos de la habitación al montar el componente
  useEffect(() => {
    const apiUrl = getBackendUrl();
    if (!apiUrl) return;

    const fetchRoom = async () => {
      try {
        const response = await fetch(`${apiUrl}api/rooms/${id}`);
        if (!response.ok) {
          throw new Error("Error al cargar los datos de la habitación.");
        }
        const data = await response.json();
        setNombre(data.nombre); // Asume que el objeto recibido tiene un campo "nombre"
      } catch (error) {
        console.log(error)
        setError(error.message);
      }
    };

    fetchRoom();
  }, [id]);

  // Manejar la actualización de la habitación
  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const apiUrl = getBackendUrl();
    if (!apiUrl) return;
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${apiUrl}api/rooms/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
         },
        body: JSON.stringify({ nombre: nombre.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar la habitación.");
      }

      alert("Habitación actualizada correctamente.");
      navigate("/listaRooms"); // Redirigir a la lista de habitaciones
    } catch (error) {
      setError(error.message);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return <div className="text-center mt-5">Cargando...</div>;
  }

  if (error) {
    return <div className="text-center text-danger mt-5">Error: {error}</div>;
  }

  return (
    <div className="container d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
      <div className="card p-4" style={{ width: "300px" }}>
        <h1 className="text-center mb-4">Editar Habitación</h1>
        {error && <div className="alert alert-danger text-center">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="form-control"
              placeholder="Nombre"
              required
              disabled={cargando}
            />
          </div>
          <div className="d-flex justify-content-center">
            <button type="submit" className="btn btn-warning w-100" disabled={cargando}>
              {cargando ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarRoom;