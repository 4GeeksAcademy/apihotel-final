import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./sidebar";


const Hoteles = () => {
  const [hoteles, setHoteles] = useState([]);
  const [hotelSeleccionado, setHotelSeleccionado] = useState(null);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Obtener lista de hoteles al cargar el componente
  useEffect(() => {
    const fetchHoteles = async () => {
      const token = localStorage.getItem("token"); // Obtener el token

      console.log(" Enviando solicitud a:", process.env.BACKEND_URL + "/api/hoteles");
      console.log(" Token en uso:", token);
  
      if (!token) {
        console.error("No hay token disponible. Redirigiendo a login.");
        return; // Evitar que la solicitud falle
      }
  
      try {
        const response = await fetch(process.env.BACKEND_URL + "/api/hoteles", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
  
        console.log(" Respuesta completa:", response);
  
        if (!response.ok) {
          if (response.status === 401) {
            console.error("Token inválido o expirado. Redirigiendo a login.");
            // Redirigir al login si el token es inválido
            navigate("/login");
          }
          throw new Error(` Error ${response.status}: ${response.statusText}`);
        }
  
        const data = await response.json();
        console.log(" Datos recibidos en React:", data);
  
        setHoteles(Array.isArray(data) ? data : [data]); // Asegurar que sea un array
      } catch (error) {
        console.error(" Error al obtener hoteles:", error);
      }
    };
  
    fetchHoteles();
  }, []);
  

  // Manejar el envío del formulario (crear o editar)
  const handleSubmit = (e) => {
    e.preventDefault();

    const hotelData = { nombre, email, password: password || undefined };

    if (hotelSeleccionado) {
      // Editar hotel
      fetch(process.env.BACKEND_URL + `/api/hoteles/${hotelSeleccionado.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hotelData),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Error al actualizar el hotel");
          }
          return response.json();
        })
        .then((updatedHotel) => {
          setHoteles((prevHoteles) =>
            prevHoteles.map((hotel) =>
              hotel.id === updatedHotel.id ? updatedHotel : hotel
            )
          );
          setHotelSeleccionado(null); // Limpiar el hotel seleccionado
          setMostrarFormulario(false); // Ocultar formulario después de editar
          setNombre("");
          setEmail("");
          setPassword("");
        })
        .catch((error) => alert(error.message));
    } else {
      // Crear un nuevo hotel
      fetch(process.env.BACKEND_URL + "/api/hoteles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...hotelData, password }),
    })
        .then(async (response) => {
            console.log(" Respuesta completa:", response);
            const responseData = await response.json();
            console.log(" Respuesta JSON:", responseData);
    
            if (!response.ok) {
                throw new Error(responseData.error || "Error al crear el hotel");
            }
            return responseData;
        })
        .then((newHotel) => {
            console.log(" Hotel creado:", newHotel);
            setHoteles((prevHoteles) => [...(prevHoteles || []), newHotel]);
            setMostrarFormulario(false);
            setNombre("");
            setEmail("");
            setPassword("");
            navigate("/listaHoteles");
        })
        .catch((error) => {
            console.error("Error al crear hotel:", error.message);
            alert(error.message);
        });
      }    
  };

  // Eliminar un hotel
  const eliminarHotel = (id) => {
    fetch(process.env.BACKEND_URL + `/api/hoteles/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        if (response.ok) {
          setHoteles(hoteles.filter((hotel) => hotel.id !== id));
        } else {
          alert("Hubo un problema al eliminar el hotel");
        }
      })
      .catch((error) => alert("Error al eliminar: " + error.message));
  };

  return (
    <>
      <div className="d-flex">
        {/* Sidebar */}
        <Sidebar />
        <div className="container">
          <h2 className="text-center my-3">Hoteles</h2>
          {/* Botón para crear hotel */}
          <div className="d-flex justify-content-center align-items-center mb-4">
            <button
              className="btn" style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}
              onClick={() => {
                setHotelSeleccionado(null); // Limpiar selección
                setNombre("");
                setEmail("");
                setPassword("");
                setMostrarFormulario(true); // Mostrar formulario solo cuando se haga clic
              }}
            >
              Crear Hotel
            </button>
          </div>

          {/* Lista de Hoteles */}
          <div className="row bg-light p-2 fw-bold border-bottom">
            <div className="col">Nombre</div>
            <div className="col">Email</div>
            <div className="col text-center">Acciones</div>
          </div>

          {hoteles.map((hotel) => (
            <div key={hotel.id} className="row p-2 border-bottom align-items-center">
              <div className="col">{hotel.nombre}</div>
              <div className="col">{hotel.email}</div>
              <div className="col d-flex justify-content-center">
                <button
                  className="btn me-5" style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}
                  onClick={() => {
                    setHotelSeleccionado(hotel); // Establecer el hotel seleccionado
                    setNombre(hotel.nombre);
                    setEmail(hotel.email);
                    setPassword(""); // Dejamos la contraseña vacía para que el usuario ingrese una nueva
                    setMostrarFormulario(true); // Mostrar el formulario para editar
                  }}
                >
                  Editar
                </button>
                <button
                  className="btn" style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}
                  onClick={() => eliminarHotel(hotel.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}

          {/* Formulario para crear o editar un hotel */}
          {mostrarFormulario && (
            <div className="card p-4 mt-5">
              <h3 className="text-center mb-4">
                {hotelSeleccionado ? "Editar Hotel" : "Crear Hotel"}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="form-control" placeholder="Nombre" required />
                </div>
                <div className="mb-3">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-control" placeholder="Email" required />
                </div>
                <div className="mb-3">
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-control" placeholder="Contraseña"
                    required={!hotelSeleccionado} // Solo es obligatorio si estamos creando un hotel
                  />
                </div>
                <div className="d-flex justify-content-center">
                  <button type="submit" className="btn w-100" style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}>
                    {hotelSeleccionado ? "Guardar Cambios" : "Crear Hotel"}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default Hoteles;