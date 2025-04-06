import React, { useEffect, useState, useContext, useRef } from "react";
import { Context } from "../store/appContext";
import PrivateLayout from "../component/privateLayout";
import html2pdf from "html2pdf.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faSpinner, faCheckCircle } from "@fortawesome/free-solid-svg-icons";

const MaintenanceWorkLog = () => {
  const { store, actions } = useContext(Context);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  const printRef = useRef();

  useEffect(() => {
    actions.getMaintenanceTasks();
    actions.getMaintenances();
    actions.getRooms();
    actions.getBranches();
  }, []);

  const filteredTasks = store.maintenanceTasks.filter(task => {
    const tech = store.maintenances.find(m => m.id === task.maintenance_id);
    const room = store.rooms.find(r => r.id === task.room_id);
  
    const createdBy = tech?.nombre || task.housekeeper?.nombre || task.finalizado_por || "";
    const matchesName = createdBy.toLowerCase().includes(search.toLowerCase());
  
    const matchesDate = dateFilter ? task.created_at?.startsWith(dateFilter) : true;
    const matchesBranch = branchFilter
      ? (room?.branch_id?.toString() === branchFilter || tech?.branch_id?.toString() === branchFilter)
      : true;
  
    const shouldShow = task.maintenance_id || task.condition === "FINALIZADA";
  
    return shouldShow && matchesName && matchesDate && matchesBranch;
  });
  

  const uniqueTechnicians = [...new Set(filteredTasks.map(task => task.maintenance_id))];

  const handleDownloadPDF = () => {
    const element = printRef.current;
    const opt = {
      margin: 0.3,
      filename: `reporte_tecnicos_${new Date().toLocaleDateString()}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" }
    };
    html2pdf().set(opt).from(element).save();
  };

  const getConditionStyle = (condition) => {
    switch (condition) {
      case "PENDIENTE":
        return { className: "badge bg-danger d-inline-flex align-items-center gap-1", icon: faClock };
      case "EN PROCESO":
        return { className: "badge bg-warning text-dark d-inline-flex align-items-center gap-1", icon: faSpinner };
      case "FINALIZADA":
        return { className: "badge bg-success d-inline-flex align-items-center gap-1", icon: faCheckCircle };
      default:
        return { className: "badge bg-secondary", icon: faClock };
    }
  };

  return (
    <PrivateLayout>
      <div className="container mt-4">
        <h3 className="mb-4 text-center">🔧 Tareas por Técnico</h3>

        <div className="row mb-3">
          <div className="col-md-4 mb-2">
            <input
              type="text"
              placeholder="Buscar por nombre"
              className="form-control"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-4 mb-2">
            <input
              type="date"
              className="form-control"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            />
          </div>
          <div className="col-md-4 mb-2">
            <select
              className="form-control"
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
            >
              <option value="">Filtrar por sucursal</option>
              {store.branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-3 text-end">
          <button className="btn btn-sm btn-outline-primary" onClick={handleDownloadPDF}>
            📥 Descargar PDF
          </button>
        </div>

        <div ref={printRef}>
          {filteredTasks.length > 0 && uniqueTechnicians.length === 1 && (
            <div className="mb-3 text-center">
              <h5 className="fw-bold">
                Tareas de{" "}
                {store.maintenances.find(m => m.id === uniqueTechnicians[0])?.nombre || "el técnico"}
                {dateFilter && <> - {new Date(dateFilter).toLocaleDateString()}</>}
              </h5>
            </div>
          )}

          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th>Nombre</th>
                <th>Tarea</th>
                <th>Fecha</th>
                <th>Habitación</th>
                <th>Sucursal</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(task => {
                const tech = store.maintenances.find(m => m.id === task.maintenance_id);
                const room = store.rooms.find(r => r.id === task.room_id);
                const branch = task.room_id
                  ? store.branches.find(b => b.id === room?.branch_id)
                  : store.branches.find(b => b.id === tech?.branch_id);

                const { className, icon } = getConditionStyle(task.condition);

                return (
                  <tr key={task.id} className={task.housekeeper_id ? "table-info" : ""}>
                    <td>
                      {tech?.nombre || task.housekeeper?.nombre || task.finalizado_por || "No asignado"}
                    </td>

                    <td>{task.nombre}</td>
                    <td>{task.created_at?.split("T")[0]}</td>
                    <td>{room?.nombre || "Zona común"}</td>
                    <td>{branch?.nombre || "-"}</td>
                    <td>
                      <span className={className}>
                        <FontAwesomeIcon icon={icon} className="me-1" />
                        {task.condition}
                      </span>
                      {task.finalizado_por && (
                        <div className="text-muted small mt-1">
                          Finalizado por: {task.finalizado_por}
                        </div>
                      )}
                      {task.housekeeper_id && (
                        <div className="text-info small mt-1">
                          Creado por: {task.housekeeper?.nombre || "Camarera"}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PrivateLayout>
  );
};

export default MaintenanceWorkLog;
