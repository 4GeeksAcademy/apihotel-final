import React, { useContext, useState, useEffect } from "react";
import { Context } from "../store/appContext";
import { Link } from "react-router-dom";
import Sidebar from "../component/sidebar";
import "../../styles/dashboard.css";

const PrivateHotel = () => {
  const { store, actions } = useContext(Context);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [datos, setDatos] = useState({
    sucursales: 0,
    camareras: 0,
    tecnicos: 0,
    incidencias: 0,
    tareasLimpieza: 0,
    tareasMantenimiento: 0,
    habitaciones: 0
  });

  const nombreHotel = store.hotel?.nombre || "Tu Hotel";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await actions.getHotelDatos();
        setDatos({
          sucursales: data.sucursales || 0,
          camareras: data.camareras || 0,
          tecnicos: data.tecnicos || 0,
          incidencias: data.incidencias || 0,
          tareasLimpieza: data.tareasLimpieza || 0,
          tareasMantenimiento: data.tareasMantenimiento || 0,
          habitaciones: data.habitaciones || 0
        });
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="d-flex" style={{ height: "100vh" }}>
        <Sidebar collapsed={collapsed} toggleCollapsed={() => setCollapsed(!collapsed)} />
        <div className="flex-fill d-flex align-items-center justify-content-center" style={{
          marginLeft: collapsed ? "70px" : "250px",
          backgroundColor: "#f5f7fb"
        }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar collapsed={collapsed} toggleCollapsed={() => setCollapsed(!collapsed)} />

      <div className="flex-fill" style={{ marginLeft: collapsed ? "70px" : "250px", transition: "margin-left 0.3s ease", backgroundColor: "#f5f7fb", height: "100vh", overflow: "hidden" }}>
        <div className="p-4 border-bottom bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Dashboard</h4>
            <div className="d-flex align-items-center">
              <span className="me-3">Bienvenido al Hotel, {nombreHotel}</span>
              <div className="avatar-sm">
                <span className="avatar-title rounded-circle bg-soft-primary text-primary font-size-16">
                  <i className="fas fa-user"></i>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4" style={{ height: "calc(100vh - 72px)", overflow: "auto" }}>
          {/* Estadísticas */}
          <div className="row mb-4">
            <div className="col-md-6 col-xl-3">
              <div className="card bg-primary text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-white-50 mb-2">Habitaciones</h6>
                      <h3 className="mb-0">{datos.habitaciones}</h3>
                    </div>
                    <i className="fas fa-bed fa-2x opacity-50"></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-xl-3">
              <div className="card bg-success text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-white-50 mb-2">Camareras</h6>
                      <h3 className="mb-0">{datos.camareras}</h3>
                    </div>
                    <i className="fas fa-user-nurse fa-2x opacity-50"></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-xl-3">
              <div className="card bg-info text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-white-50 mb-2">Técnicos</h6>
                      <h3 className="mb-0">{datos.tecnicos}</h3>
                    </div>
                    <i className="fas fa-tools fa-2x opacity-50"></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-xl-3">
              <div className="card bg-warning text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-white-50 mb-2">Incidencias</h6>
                      <h3 className="mb-0">{datos.incidencias}</h3>
                    </div>
                    <i className="fas fa-exclamation-triangle fa-2x opacity-50"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Equipo de trabajo */}
          <div className="col-xl-12">
            <div className="card shadow-sm">
              <div className="card-body">
                <h4 className="card-title mb-4">👥 Equipo de Trabajo</h4>
                <div className="row gy-4">

                  <div className="col-md-6">
                    <div className="card border-0 bg-light p-4 text-center">
                      <i className="fas fa-user-nurse fa-2x text-primary mb-2"></i>
                      <h5 className="fw-bold mb-0">Camareras</h5>
                      <p className="text-muted">Tareas asignadas: <strong>{datos.tareasLimpieza}</strong></p>
                      <div className="d-grid gap-2">
                        <Link to="/houseKeeper" className="btn btn-outline-primary btn-sm">Gestionar</Link>
                        <Link to="/houseKeeperWorkLog" className="btn btn-primary btn-sm">Ver Registro</Link>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="card border-0 bg-light p-4 text-center">
                      <i className="fas fa-tools fa-2x text-info mb-2"></i>
                      <h5 className="fw-bold mb-0">Técnicos</h5>
                      <p className="text-muted">Tareas asignadas: <strong>{datos.tareasMantenimiento}</strong></p>
                      <div className="d-grid gap-2">
                        <Link to="/listaMaintenance" className="btn btn-outline-info btn-sm">Gestionar</Link>
                        <Link to="/maintenanceWorkLog" className="btn btn-info btn-sm">Ver Registro</Link>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PrivateHotel;