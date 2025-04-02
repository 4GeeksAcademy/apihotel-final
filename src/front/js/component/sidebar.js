import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  faHome,
  faCodeBranch,
  faBed,
  faTools,
  faClipboardList,
  faWrench,
  faBars,
  faBroom,
  faCalendarCheck,
  faUserCog
} from "@fortawesome/free-solid-svg-icons";
import "../../styles/sidebar.css";

const Sidebar = ({ collapsed, toggleCollapsed }) => {
  const location = useLocation();

  const navItems = [
    { icon: faHome, label: "Dashboard", to: "/privatehotel" },
    { icon: faCodeBranch, label: "Branches", to: "/listaBranches" },
    { icon: faBed, label: "Habitaciones", to: "/listaRoom" },
    { icon: faBroom, label: "Camareras", to: "/houseKeeper" },
    { icon: faTools, label: "Técnicos", to: "/listaMaintenance" },
    { icon: faClipboardList, label: "Tareas Limpieza", to: "/HouseKeeperTask" },
    { icon: faWrench, label: "Tareas Mantenimiento", to: "/maintenanceTask" },

    { icon: faCalendarCheck, label: "Parte de Trabajo Camareras", to: "/houseKeeperWorkLog" },
    { icon: faUserCog, label: "Parte de Trabajo Técnicos", to: "/maintenanceWorkLog" },
  ];

  return (
    <div
      className={`sidebar ${collapsed ? "collapsed" : ""}`}
      style={{
        backgroundColor: "#2A3042",
        minHeight: "100vh",
        width: collapsed ? "70px" : "250px",
        transition: "width 0.3s ease",
        position: "fixed",
        zIndex: 1000,
        overflowY: "auto",
      }}
    >
      {/* Encabezado */}
      <div className="sidebar-header p-3">
        <div className="d-flex justify-content-between align-items-center">
          {!collapsed && (
            <h5 className="text-white mb-0">
              <span className="fw-bold">API</span>HOTEL
            </h5>
          )}
          <button
            className="sidebar-toggle-btn btn btn-sm btn-light ms-2"
            onClick={toggleCollapsed}
            title={collapsed ? "Expandir" : "Colapsar"}
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
        </div>
      </div>

      {/* Menú */}
      <div className="sidebar-menu px-2">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={index}
              to={item.to}
              className={`sidebar-link ${isActive ? "active" : ""} mb-3`}
            >
              <div className="sidebar-link-content d-flex align-items-center">
                <FontAwesomeIcon
                  icon={item.icon}
                  className={`sidebar-icon ${collapsed ? "collapsed-icon" : ""} me-2`}
                />
                {!collapsed && (
                  <span className="sidebar-link-text">{item.label}</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
