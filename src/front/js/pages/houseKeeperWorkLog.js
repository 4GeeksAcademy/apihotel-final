import React, { useEffect, useState, useContext, useRef } from "react";
import { Context } from "../store/appContext";
import PrivateLayout from "../component/privateLayout";
import html2pdf from "html2pdf.js";
import { faPlaneDeparture, faUser, faCircleInfo, faClock, faSpinner, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";


const HousekeeperWorkLog = () => {
  const { store, actions } = useContext(Context);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const printRef = useRef();

  const [branchFilter, setBranchFilter] = useState("");

  useEffect(() => {
    actions.getHouseKeeperTasks();
    actions.getHousekeepers();
    actions.getRooms();
    actions.getBranches();
  }, []);


  console.log("housekeeperTasks:", store.housekeeperTasks);
  console.log("housekeepers:", store.housekeepers);
  console.log("rooms:", store.rooms);


  const filteredTasks = (store.housekeeperTasks || []).filter(task => {
    const hk = store.housekeepers?.find(h => h.id === task.id_housekeeper);
    const room = store.rooms.find(r => r.id === task.id_room);
    const matchesName = hk?.nombre?.toLowerCase().includes(search.toLowerCase());
    const matchesDate = dateFilter ? task.assignment_date?.startsWith(dateFilter) : true;
    const matchesBranch = branchFilter
      ? (room?.branch_id?.toString() === branchFilter || hk?.id_branche?.toString() === branchFilter)
      : true;

    return matchesName && matchesDate && matchesBranch;
  });

  const uniqueHousekeepers = [...new Set(filteredTasks.map(task => task.id_housekeeper))];

  const handleDownloadPDF = () => {
    const element = printRef.current;
    const opt = {
      margin: 0.3,
      filename: `reporte_camareras_${new Date().toLocaleDateString()}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" }
    };

    html2pdf().set(opt).from(element).save();
  };

  const getTaskStyle = (tarea) => {
    const t = tarea.toUpperCase();

    if (t.includes("SALIDA")) {
      return { className: "bg-danger text-white rounded-pill px-2", icon: faPlaneDeparture };
    }

    if (t.includes("CAMBIO DE SÁBANAS") || t.includes("SABANA")) {
      return { className: "bg-primary text-white rounded-pill px-2", icon: "fas fa-bed" };
    }

    if (t.includes("CLIENTE")) {
      return { className: "bg-warning text-dark rounded-pill px-2", icon: faUser };
    }

    return { className: "bg-success text-white rounded-pill px-2", icon: faCircleInfo };
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
        return { className: "badge bg-secondary", icon: faCircleInfo };
    }
  };




  return (
    <PrivateLayout>
      <div className="container mt-4">
        <h3 className="mb-4 text-center">📋 Tareas por Camarera</h3>

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
          <button className="btn btn-sm btn-outline-primary me-2" onClick={handleDownloadPDF}>
            📥 Descargar PDF
          </button>
        </div>

        <div ref={printRef}>
          {filteredTasks.length > 0 && uniqueHousekeepers.length === 1 && (
            <div className="mb-3 text-center">
              <h5 className="fw-bold">
                Tareas de{" "}
                {store.housekeepers.find(h => h.id === uniqueHousekeepers[0])?.nombre || "la camarera"}
                {dateFilter && <> - {new Date(dateFilter).toLocaleDateString()}</>}
              </h5>
            </div>
          )}

          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th>Nombre</th>
                <th>Tarea</th>
                <th>Fecha asignación</th>
                <th>Habitación</th>
                <th>Sucursal</th>
                <th>Estado</th>
                <th>Observación</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(task => {
                const hk = store.housekeepers.find(h => h.id === task.id_housekeeper);
                const roomName = task.id_room
                  ? store.rooms.find(r => r.id === task.id_room)?.nombre
                  : "Zona común";

                return (
                  <tr key={task.id}>
                    <td>{hk?.nombre || "Desconocido"}</td>
                    <td>
                      <span className={`d-inline-flex align-items-center gap-2 ${getTaskStyle(task.nombre).className}`}>
                        {typeof getTaskStyle(task.nombre).icon === "string" ? (
                          <i className={`${getTaskStyle(task.nombre).icon}`}></i>
                        ) : (
                          <FontAwesomeIcon icon={getTaskStyle(task.nombre).icon} />
                        )}
                        {task.nombre}
                      </span>

                    </td>

                    <td>{task.assignment_date?.split("T")[0]}</td>
                    <td>{roomName}</td>
                    <td>
                      {
                        task.id_room
                          ? store.branches.find(b => b.id === store.rooms.find(r => r.id === task.id_room)?.branch_id)?.nombre
                          : store.branches.find(b => b.id === store.housekeepers.find(h => h.id === task.id_housekeeper)?.id_branche)?.nombre || "-"
                      }
                    </td>
                    <td>
                      <span className={getConditionStyle(task.condition).className}>
                        <FontAwesomeIcon icon={getConditionStyle(task.condition).icon} />
                        {task.condition}
                      </span>
                    </td>
                    <td>
                      {task.nota_housekeeper
                      }
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

export default HousekeeperWorkLog;
