import React from 'react';
import { Navigate } from 'react-router-dom';
const ProtectedPrivateHouseKeeper = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/loginHouseKeeper" replace />;
  }
  return children;
};
export default ProtectedPrivateHouseKeeper;