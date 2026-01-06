// src/components/PublicRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContextDef';

// This component is for routes that should only be accessible to logged-out users (e.g., Login, Register).
// If a logged-in user tries to access these pages, they will be redirected to their dashboard.
const PublicRoute = () => {
  const { currentUser } = useAuth();

  // Determine redirect path based on user role
  const getDashboardPath = () => {
    if (!currentUser) return null;
    return currentUser.role === 'staff' ? '/staff-dashboard' : '/resident-dashboard';
  };

  const dashboardPath = getDashboardPath();

  return dashboardPath ? <Navigate to={dashboardPath} replace /> : <Outlet />;
};

export default PublicRoute;
