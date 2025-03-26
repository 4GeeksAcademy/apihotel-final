import React, { useState, useEffect, useContext } from 'react';
import Sidebar from "../component/sidebar";
import { Context } from "../store/appContext";
import CloudinaryApiHotel from "../component/cloudinaryApiHotel";

const HouseKeeper = () => {
  const { store, actions } = useContext(Context);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [id_branche, setIdBranche] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");


  useEffect(() => {
    actions.getHousekeepers();
    actions.getBranches();
  }, []);

  const resetForm = () => {
    setNombre('');
    setEmail('');
    setPassword('');
    setIdBranche('');
    setPhotoUrl('');
    setEditingId(null);
  };

  const handleEdit = (housekeeper) => {
    setNombre(housekeeper.nombre);
    setEmail(housekeeper.email);
    setPassword(housekeeper.password);
    setIdBranche(housekeeper.id_branche);
    setEditingId(housekeeper.id);
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      nombre,
      email,
      password,
      id_branche,
      photo_url: photoUrl

    };
    if (editingId) {
      actions.updateHousekeeper(editingId, data);
    } else {
      actions.createHousekeeper(data);
    }
    resetForm();
    setShowForm(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("¿Estás seguro de eliminar este housekeeper?")) {
      actions.deleteHousekeeper(id);
    }
  };

  const shouldShowForm = showForm || editingId;

  return (
    <div className="d-flex">
      <Sidebar />

      <div className="container">
        <h2 className="text-center my-3">Gestión de Housekeepers</h2>

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

        <div className="mb-4">
          <div className="row bg-light p-2 fw-bold border-bottom">
            <div className='col'>Foto</div>
            <div className="col">Nombre</div>
            <div className="col">Email</div>
            <div className="col">Sucursal</div>
            <div className="col text-center">Acciones</div>
          </div>
          {store.housekeepers?.map(h => (
            <div key={h.id} className="row p-2 border-bottom align-items-center">
              <div className='col'>
                {h.photo_url ? (
                  <img
                    src={h.photo_url}
                    alt="foto camarera de piso"
                    style={{
                      width: "50px",
                      height: "50px",
                      objectFit: "cover",
                      borderRadius: "50%",
                    }}
                  />
                ) : (
                  <span className="text-muted">Sin foto</span>
                )}
              </div>
              <div className="col">{h.nombre}</div>
              <div className="col">{h.email}</div>
              <div className="col">{h.branch_nombre}</div>
              <div className="col text-center">
                <button className="btn me-2" style={{ backgroundColor: "#ac85eb" }} onClick={() => handleEdit(h)}>Editar</button>
                <button className="btn" style={{ backgroundColor: "#ac85eb" }} onClick={() => handleDelete(h.id)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>

        {shouldShowForm && (
          <div className="card p-4 mt-5">
            <form onSubmit={handleSubmit}>
              <input type="text" className="form-control mb-2" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} required />
              <input type="email" className="form-control mb-2" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
              <input type="password" className="form-control mb-2" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
              <select
                className="form-select mb-3"
                value={id_branche}
                onChange={e => setIdBranche(e.target.value)}
                required
              >
                <option value="">Seleccione una sucursal</option>
                {store.branches?.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.nombre}</option>
                ))}
              </select>

              {/* Componente para cargar la imagen */}
              <div className="mb-3">
                <label htmlFor="photo" className="form-label">
                  Foto
                </label>
                <CloudinaryApiHotel setPhotoUrl={setPhotoUrl} setErrorMessage={setErrorMessage} />
             </div>

              {/* Preview de imagen */}
              {photoUrl && (
                <img
                  src={photoUrl}
                  alt="Preview"
                  className="img-thumbnail my-3"
                  style={{ width: "150px" }}
                />
              )}
              <div className="d-flex justify-content-between">
                <button type="submit" className="btn" style={{ backgroundColor: "#ac85eb" }}>
                  {editingId ? 'Actualizar' : 'Crear'} Housekeeper
                </button>
                {!editingId && (
                  <button type="button" className="btn" style={{ backgroundColor: "#ac85eb" }} onClick={() => setShowForm(false)}>Cancelar</button>
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
