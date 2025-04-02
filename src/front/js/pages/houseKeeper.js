import React, { useState, useEffect, useContext } from 'react';
import { Context } from "../store/appContext";
import CloudinaryApiHotel from "../component/cloudinaryApiHotel";
import PrivateLayout from "../component/privateLayout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash, faPlus, faSave, faTimes } from "@fortawesome/free-solid-svg-icons";

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
    setShowForm(false);
  };

  const handleEdit = (housekeeper) => {
    setNombre(housekeeper.nombre);
    setEmail(housekeeper.email);
    setPassword(housekeeper.password);
    setIdBranche(housekeeper.id_branche?.toString() || '');  
    setEditingId(housekeeper.id);
    setShowForm(true);
  };
  

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      nombre,
      email,
      password,
      id_branche: parseInt(id_branche),
      photo_url: photoUrl
    };
    

    if (editingId) {
      console.log("Enviando actualización:", data); // 👈
      actions.updateHousekeeper(editingId, data);
    } else {
      actions.createHousekeeper(data);
    }
    

    resetForm();
  };

  const handleDelete = (id) => {
    if (window.confirm("¿Estás seguro de eliminar esta camarera?")) {
      actions.deleteHousekeeper(id);
    }
  };

  return (
    <PrivateLayout>
      <div className="container">
        <h2 className="text-center my-3">Gestión de camareras de Piso</h2>

        <div className="row">
          {/* Columna izquierda: Formulario */}
          <div className="col-md-4">
            <button
              className="btn mb-4"
              style={{ backgroundColor: "#0dcaf0", border: "none", color: "white" }}
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              <FontAwesomeIcon icon={faPlus} className="me-2" />
              Crear Camarera de Piso
            </button>

            {showForm || editingId ? (
              <div className="card p-4">
                <form onSubmit={handleSubmit}>
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Nombre"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    required
                  />
                  <input
                    type="email"
                    className="form-control mb-2"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                  <input
                    type="password"
                    className="form-control mb-2"
                    placeholder="Contraseña"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <select
                    className="form-select mb-3"
                    value={id_branche}
                    onChange={e => setIdBranche(e.target.value)}
                    required
                    style={{
                      backgroundColor: "#0dcaf0",
                      color: "white",
                      border: "none",
                      fontWeight: "bold",
                      appearance: "none",
                      padding: "10px",
                      borderRadius: "4px"
                    }}
                  >
                    <option value="">Seleccione una sucursal</option>
                    {store.branches?.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.nombre}</option>
                    ))}
                  </select>

                  {/* Componente para cargar la imagen */}
                  <div className="mb-3">
                    <label htmlFor="photo" className="form-label">Foto</label>
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
                    <button
                      type="submit"
                      className="btn"
                      style={{ backgroundColor: "#0dcaf0", border: "none", color: "white" }}
                    >
                      <FontAwesomeIcon icon={faSave} className="me-2" />
                      {editingId ? 'Actualizar' : 'Crear'} Camarera de Piso
                    </button>

                    {!editingId && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowForm(false)}
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

          {/* Columna derecha: Lista */}
          <div className="col-md-8">
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
                <div className="col">
                  {store.branches?.find(branch => branch.id === h.id_branche)?.nombre || "Sucursal no encontrada"}
                </div>
                <div className="col text-center">
                  <button
                    className="btn me-2"
                    style={{ backgroundColor: "#0dcaf0", border: "none", color: "white" }}
                    onClick={() => handleEdit(h)}
                  >
                    <FontAwesomeIcon icon={faPen} className="me-1" />
                    
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(h.id)}
                  >
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

export default HouseKeeper;
