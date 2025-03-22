import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../component/sidebar";

const HouseKeeper = () => {
  const [housekeepers, setHousekeepers] = useState([]);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [id_branche, setIdBranche] = useState('');
  const [id_hotel, setIdHotel] = useState('');
  const [branches, setBranches] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const backendUrl = process.env.REACT_APP_BACKEND_URL || process.env.BACKEND_URL;

  const loadHousekeepers = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/housekeepers`);
      if (response.ok) {
        const data = await response.json();
        setHousekeepers(data);
      } else {
        console.error("Error al obtener los housekeepers:", response.status);
      }
    } catch (error) {
      console.error('Error al obtener los housekeepers:', error);
    }
  };

  const loadBranches = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/branches`);
      if (response.ok) {
        const data = await response.json();
        setBranches(data);
      } else {
        console.error("Error al obtener las sucursales:", response.status);
      }
    } catch (error) {
      console.error('Error al obtener las sucursales:', error);
    }
  };

  const loadHotels = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/hoteles`);
      if (response.ok) {
        const data = await response.json();
        setHotels(data);
      } else {
        console.error("Error al obtener los hoteles:", response.status);
      }
    } catch (error) {
      console.error('Error al obtener los hoteles:', error);
    }
  };

  const createHouseKeeper = async () => {
    if (!nombre || !email || !password || !id_branche || !id_hotel) {
      alert('Por favor, completa todos los campos');
      return;
    }

    if (!email.includes('@')) {
      alert('Por favor, ingresa un email válido');
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/housekeepers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre,
          email,
          password,
          id_branche,
          hotel_id: id_hotel,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setHousekeepers([...housekeepers, data]);
        resetForm();
        setShowForm(false);
      } else {
        const errorData = await response.json();
        console.error("Error al crear el housekeeper:", errorData.message);
      }
    } catch (error) {
      console.error('Error al crear el housekeeper:', error);
    }
  };

  const updateHouseKeeper = async () => {
    if (!nombre || !email || !password || !editingId || !id_branche || !id_hotel) {
      alert('Por favor, completa todos los campos para editar');
      return;
    }

    if (!email.includes('@')) {
      alert('Por favor, ingresa un email válido');
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/housekeepers/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre,
          email,
          password,
          id_branche,
          hotel_id: id_hotel,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setHousekeepers(
          housekeepers.map(item => (item.id === editingId ? data : item))
        );
        resetForm();
        setShowForm(false);
      } else {
        const errorData = await response.json();
        console.error("Error al editar el housekeeper:", errorData.message);
      }
    } catch (error) {
      console.error('Error al editar el housekeeper:', error);
    }
  };

  const deleteHouseKeeper = async (id) => {
    const isConfirmed = window.confirm("¿Estás seguro de que quieres eliminar este housekeeper?");
    if (!isConfirmed) {
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/housekeepers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setHousekeepers(housekeepers.filter(item => item.id !== id));
      } else {
        const errorData = await response.json();
        console.error("Error al eliminar el housekeeper:", errorData.message);
      }
    } catch (error) {
      console.error('Error al eliminar el housekeeper:', error);
    }
  };

  const resetForm = () => {
    setNombre('');
    setEmail('');
    setPassword('');
    setIdBranche('');
    setIdHotel('');
    setEditingId(null);
  };

  const handleEdit = (housekeeper) => {
    setNombre(housekeeper.nombre);
    setEmail(housekeeper.email);
    setPassword(housekeeper.password);
    setIdBranche(housekeeper.id_branche);
    setIdHotel(housekeeper.hotel_id);
    setEditingId(housekeeper.id);
    setShowForm(true);
  };

  useEffect(() => {
    loadHousekeepers();
    loadBranches();
    loadHotels();
  }, []);

  const shouldShowForm = showForm || editingId;

  return (
    <div className="d-flex">
      {/* Sidebar personalizado */}
      <Sidebar/>

      {/* Contenido principal */}
      <div className="container">
        <h2 className="text-center my-3">Gestión de Housekeepers</h2>

        {/* Botón Crear Housekeeper centrado */}
        <div className="d-flex justify-content-center align-items-center mb-4">
          <button
            className="btn"
            style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            Crear Housekeeper
          </button>
        </div>

        {/* Lista de Housekeepers */}
        <div className="mb-4">
          <div className="row bg-light p-2 fw-bold border-bottom">
            <div className="col">Nombre</div>
            <div className="col">Email</div>
            <div className="col">Hotel</div>
            <div className="col">Sucursal</div>
            <div className="col text-center">Acciones</div>
          </div>
          {housekeepers.map(housekeeper => (
            <div key={housekeeper.id} className="row p-2 border-bottom align-items-center">
              <div className="col">{housekeeper.nombre}</div>
              <div className="col">{housekeeper.email}</div>
              <div className="col">{housekeeper.hotel_nombre}</div>
              <div className="col">{housekeeper.branch_nombre}</div>
              <div className="col text-center">
                <button
                  className="btn me-2"
                  style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}
                  onClick={() => handleEdit(housekeeper)}
                >
                  Editar
                </button>
                <button
                  className="btn"
                  style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}
                  onClick={() => deleteHouseKeeper(housekeeper.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Formulario condicional */}
        {shouldShowForm && (
          <div className="card p-4 mt-5">
            <form
              onSubmit={e => {
                e.preventDefault();
                editingId ? updateHouseKeeper() : createHouseKeeper();
              }}
            >
              <input
                type="text"
                className="form-control mb-2"
                id="nombre"
                placeholder="Nombre"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                required
              />
              <input
                type="email"
                className="form-control mb-2"
                id="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                className="form-control mb-2"
                id="password"
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <select
                id="id_hotel"
                className="form-select mb-2"
                value={id_hotel}
                onChange={e => setIdHotel(e.target.value)}
                required
              >
                <option value="">Seleccione un hotel</option>
                {hotels.map(hotel => (
                  <option key={hotel.id} value={hotel.id}>
                    {hotel.nombre}
                  </option>
                ))}
              </select>
              <select
                id="id_branche"
                className="form-select mb-3"
                value={id_branche}
                onChange={e => setIdBranche(e.target.value)}
                required
              >
                <option value="">Seleccione una sucursal</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.nombre}
                  </option>
                ))}
              </select>
              <div className="d-flex justify-content-between">
                <button type="submit" className="btn" style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}>
                  {editingId ? 'Actualizar' : 'Crear'} Housekeeper
                </button>
                {!editingId && (
                  <button
                    type="button"
                    className="btn " style={{ backgroundColor: "#ac85eb", borderColor: "#B7A7D1" }}
                    onClick={() => setShowForm(false)}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        )}


      </div>
    </div>
  );
};

export default HouseKeeper;
