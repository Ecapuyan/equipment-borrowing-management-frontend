import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateRoute from './components/PrivateRoute';

// Dashboards / Layouts
import BorrowerLayout from './components/BorrowerLayout';
import StaffDashboard from './dashboards/StaffDashboard';
import SuperadminDashboard from './dashboards/SuperadminDashboard';

// Pages
import BorrowerHome from './dashboards/BorrowerHome';
import BorrowEquipment from './pages/BorrowEquipment';
import MyReservations from './pages/MyReservations';
import Reports from './pages/Reports';

import './App.css';

function App() {
  const token = localStorage.getItem('token');
  let userRole = null;

  if (token) {
    try {
      userRole = JSON.parse(atob(token.split('.')[1])).role;
    } catch (e) {
      console.error('Invalid token:', e);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  return (
    <>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route element={<PrivateRoute isAllowed={!!token} />}>
              {/* Borrower Routes */}
              <Route path="/borrower" element={<BorrowerLayout />}>
                <Route index element={<BorrowerHome />} />
                <Route path="borrow-equipment" element={<BorrowEquipment />} />
                <Route path="my-reservations" element={<MyReservations />} />
              </Route>

              {/* Staff Routes */}
              <Route path="/staff" element={<StaffDashboard />} />
              <Route path="/reports" element={<Reports />} />

              {/* Superadmin Routes */}
              <Route path="/superadmin" element={<SuperadminDashboard />} />
            </Route>

            {/* Root Redirect */}
            <Route 
              path="/" 
              element={
                !token ? <Navigate to="/login" /> :
                userRole === 'borrower' ? <Navigate to="/borrower" /> :
                userRole === 'staff' ? <Navigate to="/staff" /> :
                userRole === 'superadmin' ? <Navigate to="/superadmin" /> :
                <Navigate to="/login" />
              } 
            />
          </Routes>
        </Layout>
      </Router>
    </>
  );
}

export default App;