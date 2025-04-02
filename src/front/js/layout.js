import React from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import ScrollToTop from "./component/scrollToTop";
import { BackendURL } from "./component/backendURL";
import ThemeForm from './pages/theme';
import HotelTheme from './pages/hotelTheme';
import HouseKeeper from './pages/houseKeeper';
import { Home } from "./pages/home";
import { Demo } from "./pages/demo";
import { Single } from "./pages/single";
import { ListaCat } from "./pages/listaCat";
import injectContext from "./store/appContext";
import { Navbar } from "./component/navbar";
import EditarCategoria from "./component/editarCategoria";
import CrearCategoria from "./component/crearCategoria";
import ListaCategoria from "./component/listaCategoria";
import Hoteles from "./component/listaHoteles";
import Branches from "./component/listaBranches";
import ListaRoom from "./component/listaRoom";
import Maintenance from "./component/listaMaintenance";
import LoginHouseKeeper from "./pages/loginHouseKeeper";
import PrivateHouseKeeper from './pages/privateHouseKeeper';
import ProtectedPrivateHouseKeeper from './pages/ProtectedPrivateHouseKeeper';
import HouseKeeperTask from './pages/HouseKeeperTask';
import LoginHotel from "./pages/loginHotel";
import SignupHotel from "./pages/signupHotel";
import PrivateHotel from "./pages/privateHotel";
import AuthLayout from "./component/authLayout";
import MaintenanceTask from './pages/maintenanceTask';
import LoginMaintenance from "./pages/loginMaintenance";
import PrivateMaintenance from './pages/privateMaintenance';
import ProtectedPrivateMaintenance from './pages/ProtectedPrivateMaintenance';
import { Footer } from "./component/footer";
import TaskFilterView from './pages/TaskFilterView';
import TaskFilterView2 from './pages/TaskFilterView2';
import MaintenanceWorkLog from "./pages/maintenanceWorkLog";
import HousekeeperWorkLog from "./pages/houseKeeperWorkLog";





const Layout = () => {
  const basename = process.env.BASENAME || "";

  return (
    <BrowserRouter basename={basename}>
      <ScrollToTop>
        <RouterContent />
      </ScrollToTop>
    </BrowserRouter>
  );
};

const RouterContent = () => {
  const location = useLocation();
  const showNavbarAndFooter = !["/", "/demo"].includes(location.pathname);

  if (!process.env.BACKEND_URL || process.env.BACKEND_URL === "") {
    return <BackendURL />;
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      {showNavbarAndFooter && <Navbar />}

      <main className="flex-grow-1">
        <Routes>
          <Route element={<Home />} path="/" />
          <Route element={<Demo />} path="/demo" />
          <Route element={<ListaCat />} path="/listaCat" />
          <Route element={<EditarCategoria />} path="/editar/:id" />
          <Route element={<CrearCategoria />} path="/crearCategoria" />
          <Route element={<ListaCategoria />} path="/listaCategoria" />
          <Route element={<Single />} path="/single/:theid" />
          <Route element={<Hoteles />} path="/hoteles" />
          <Route element={<Hoteles />} path="/listaHoteles" />
          <Route element={<ThemeForm />} path="/theme" />
          <Route element={<HotelTheme />} path="/hotelTheme" />
          <Route element={<Branches />} path="/listaBranches" />
          <Route element={<ListaRoom />} path="/listaRoom" />
          <Route element={<Maintenance />} path="/listaMaintenance" />
          <Route element={<HouseKeeper />} path="/houseKeeper" />
          <Route element={<LoginHouseKeeper />} path="/loginHouseKeeper" />
          <Route element={<ProtectedPrivateHouseKeeper><PrivateHouseKeeper /></ProtectedPrivateHouseKeeper>} path="/privateHouseKeeper" />
          <Route element={<HouseKeeperTask />} path="/HouseKeeperTask" />
          <Route element={<PrivateHotel />} path="/privateHotel" />
          <Route element={<LoginHotel />} path="/loginHotel" />
          <Route element={<SignupHotel />} path="/signupHotel" />
          <Route element={<AuthLayout />} path="/authLayout" />
          <Route element={<MaintenanceTask />} path="/maintenanceTask" />
          <Route element={<LoginMaintenance />} path="/loginMaintenance" />
          <Route element={<ProtectedPrivateMaintenance><PrivateMaintenance /></ProtectedPrivateMaintenance>} path="/privateMaintenance" />
          <Route element={<TaskFilterView />} path="/task-filter" />
          <Route element={<TaskFilterView2 />} path="/task-filter-housekeeper" />
          <Route element={<HousekeeperWorkLog />} path="/housekeeperWorkLog"  />
          <Route element={<MaintenanceWorkLog />} path="/maintenanceWorkLog"  />

          <Route element={<h1>Not found!</h1>} path="*" />
        </Routes>
      </main>

      {showNavbarAndFooter && <Footer />}
    </div>
  );
};

export default injectContext(Layout);