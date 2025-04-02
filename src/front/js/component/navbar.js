import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Context } from "../store/appContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHotel,
  faBroom,
  faTools,
  faRightFromBracket,
  faHouse,
  faBars
} from "@fortawesome/free-solid-svg-icons";
import DarkModeToggle from "./dark";

export const Navbar = () => {
  const { store, actions } = useContext(Context);
  const navigate = useNavigate();

  const handleLogout = () => {
    actions.logout();
    navigate("/loginHotel");
  };

  return (
    <nav className="navbar navbar-expand-lg shadow-sm" style={{ backgroundColor: "#0dcaf0" }}>
      <div className="container-fluid">
        {/* Logo o título a la izquierda */}
        <span className="navbar-brand fw-bold text-white">APIHotel</span>

        {/* Botón hamburguesa para colapsar */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <FontAwesomeIcon icon={faBars} style={{ color: "white" }} />
        </button>

        {/* Links colapsables */}
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <div className="ms-auto d-flex flex-column flex-lg-row align-items-end align-items-lg-center gap-2 mt-3 mt-lg-0">
            {/* Alineación derecha gracias a ms-auto (margin-start auto) */}
            <DarkModeToggle />

            <Link className="btn btn-outline-light btn-sm d-flex align-items-center" to="/">
              <FontAwesomeIcon icon={faHouse} className="me-1" />
              Inicio
            </Link>

            {!store.token && (
              <>
                <Link className="btn btn-outline-light btn-sm d-flex align-items-center" to="/loginHotel">
                  <FontAwesomeIcon icon={faHotel} className="me-1" />
                  Hotel
                </Link>
                <Link className="btn btn-outline-light btn-sm d-flex align-items-center" to="/loginHouseKeeper">
                  <FontAwesomeIcon icon={faBroom} className="me-1" />
                  Housekeeper
                </Link>
                <Link className="btn btn-outline-light btn-sm d-flex align-items-center" to="/loginMaintenance">
                  <FontAwesomeIcon icon={faTools} className="me-1" />
                  Mantenimiento
                </Link>
              </>
            )}

            {store.token && (
              <button className="btn btn-light btn-sm d-flex align-items-center" onClick={handleLogout}>
                <FontAwesomeIcon icon={faRightFromBracket} className="me-2" />
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
