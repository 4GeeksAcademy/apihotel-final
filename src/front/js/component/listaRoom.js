import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Context } from "../store/appContext";

const ListaRoom = () => {
  const [rooms, setRooms] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [eliminando, setEliminando] = useState(null);
  const { store, actions } = useContext(Context);
  
  const navigate = useNavigate();

  const getBackendUrl = () => {
    const baseUrl = process.env.BACKEND_URL;
    if (!baseUrl) {
      console.error("Error: BACKEND_URL no está definido.");
      setError("Error interno: No se ha configurado la URL del servidor.");
      return null;
    }
    return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  };

  // Función para obtener los headers con el token
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };
  };

  // Obtener habitaciones
  useEffect(() => {
    const cargarRooms = async () => {
      const apiUrl = getBackendUrl();
      if (!apiUrl) return;

      setCargando(true);
      setError(null);

      try {
        const response = await fetch(`${apiUrl}api/rooms`, {
          headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error("Error al cargar las habitaciones");

        let data = await response.json();

        for (let room of data) {
          if (room.branch_id) {
            const sucursalRes = await fetch(`${apiUrl}api/branches/${room.branch_id}`, {
              headers: getAuthHeaders()
            });
            if (sucursalRes.ok) {
              const sucursalData = await sucursalRes.json();
              room.sucursal = sucursalData;
            }
          }
        }

        setRooms(data);
        actions.setRooms(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setCargando(false);
      }
    };

    cargarRooms();
  }, []);

  // Eliminar habitación
  const eliminarRoom = useCallback(async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta habitación?")) return;

    const apiUrl = getBackendUrl();
    if (!apiUrl) return;

    setEliminando(id);

    try {
      const response = await fetch(`${apiUrl}api/rooms/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al eliminar la habitación.");
      }

      setRooms((prevRooms) => prevRooms.filter((room) => room.id !== id));
    } catch (error) {
      alert(error.message);
    } finally {
      setEliminando(null);
    }
  }, []);

  return (
    <div className="container">
      <div className="d-flex justify-content-center align-items-center mb-4">
        <Link to="/crearRoom" className="btn" style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}>
          Crear Habitación
        </Link>
      </div>

      <h2 className="text-center my-3">Lista de Habitaciones</h2>

      {error && <div className="alert alert-danger text-center">{error}</div>}

      {cargando ? (
        <div className="text-center">Cargando habitaciones...</div>
      ) : (
        <>
          <div className="row bg-light p-2 fw-bold border-bottom">
            <div className="col">Nombre</div>
            <div className="col">Sucursal</div>
            <div className="col text-center">Acciones</div>
          </div>

          {rooms?.map((room) => (
            <div key={room.id} className="row p-2 border-bottom align-items-center">
              <div className="col">{room.nombre}</div>
              <div className="col">{room.sucursal ? room.sucursal.nombre : "Sin sucursal"}</div>
              <div className="col d-flex justify-content-center">
                <Link to={`/editarRoom/${room.id}`}>
                  <button className="btn me-3" style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}>
                    Editar
                  </button>
                </Link>
                <button
                  className="btn"
                  style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}
                  onClick={() => eliminarRoom(room.id)}
                  disabled={eliminando === room.id}
                >
                  {eliminando === room.id ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default ListaRoom;
