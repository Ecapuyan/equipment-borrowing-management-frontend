import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PublicRoute from './components/PublicRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateRoute from './components/PrivateRoute';
import StaffDashboard from './pages/StaffDashboard';
import ResidentDashboard from './pages/ResidentDashboard';
import ManageEquipment from './pages/ManageEquipment';
import BorrowEquipment from './pages/BorrowEquipment';
import MyReservations from './pages/MyReservations';
import UserManagement from './pages/UserManagement';
import ManageReservations from './pages/ManageReservations';
import Profile from './pages/Profile';
import Reports from './pages/Reports';

function App() {
  return (
    <Routes>
      {/* Public routes only accessible to logged-out users */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Protected dashboard routes */}
      <Route
        path="/*" // All other routes are protected
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/resident-dashboard" replace />} /> {/* Default route redirection */}
        <Route path="profile" element={<Profile />} />
        <Route path="staff-dashboard" element={<StaffDashboard />} />
        <Route path="staff/manage-equipment" element={<ManageEquipment />} />
        <Route path="staff/user-management" element={<UserManagement />} />
        <Route path="staff/manage-reservations" element={<ManageReservations />} />
        <Route path="staff/reports" element={<Reports />} />

        <Route path="resident-dashboard" element={<ResidentDashboard />} />
        <Route path="resident/borrow-equipment" element={<BorrowEquipment />} />
        <Route path="resident/my-reservations" element={<MyReservations />} />

        {/* Redirect any other nested path to the home/dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
