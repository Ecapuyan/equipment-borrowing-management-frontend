import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PublicRoute from './components/PublicRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import RoleBasedRoute from './components/RoleBasedRoute';
import StaffDashboard from './pages/StaffDashboard';
import ResidentDashboard from './pages/ResidentDashboard';
import ManageEquipment from './pages/ManageEquipment';
import BorrowEquipment from './pages/BorrowEquipment';
import MyReservations from './pages/MyReservations';
import UserManagement from './pages/UserManagement';
import ManageReservations from './pages/ManageReservations';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import { useAuth } from './context/AuthContextDef';

const HomeRedirect = () => {
  const { currentUser } = useAuth();
  if (!currentUser) return null; // Or a loading spinner

  if (currentUser.role === 'admin') {
    return <Navigate to="/user-management" replace />;
  }
  if (currentUser.role === 'staff') {
    return <Navigate to="/staff-dashboard" replace />;
  }
  return <Navigate to="/resident-dashboard" replace />;
};

function App() {
  return (
    <Routes>
      {/* Public routes only accessible to logged-out users */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <RoleBasedRoute>
            <Layout />
          </RoleBasedRoute>
        }
      >
        <Route index element={<HomeRedirect />} />
        <Route path="profile" element={<Profile />} />

        {/* Staff and Admin Routes */}
        <Route path="staff-dashboard" element={<RoleBasedRoute roles={['staff', 'admin']}><StaffDashboard /></RoleBasedRoute>} />
        <Route path="staff/manage-equipment" element={<RoleBasedRoute roles={['staff', 'admin']}><ManageEquipment /></RoleBasedRoute>} />
        <Route path="staff/manage-reservations" element={<RoleBasedRoute roles={['staff', 'admin']}><ManageReservations /></RoleBasedRoute>} />
        <Route path="staff/reports" element={<RoleBasedRoute roles={['staff', 'admin']}><Reports /></RoleBasedRoute>} />

        {/* User Management for Admin/Staff */}
        <Route path="user-management" element={<RoleBasedRoute roles={['admin', 'staff']}><UserManagement /></RoleBasedRoute>} />

        {/* Resident Routes */}
        <Route path="resident-dashboard" element={<RoleBasedRoute roles={['resident']}><ResidentDashboard /></RoleBasedRoute>} />
        <Route path="resident/borrow-equipment" element={<RoleBasedRoute roles={['resident']}><BorrowEquipment /></RoleBasedRoute>} />
        <Route path="resident/my-reservations" element={<RoleBasedRoute roles={['resident']}><MyReservations /></RoleBasedRoute>} />

        {/* Redirect old paths */}
        <Route path="admin/user-management" element={<Navigate to="/user-management" replace />} />
        <Route path="staff/user-management" element={<Navigate to="/user-management" replace />} />

        {/* Fallback for any other authenticated path */}
        <Route path="*" element={<HomeRedirect />} />
      </Route>
    </Routes>
  );
}

export default App;