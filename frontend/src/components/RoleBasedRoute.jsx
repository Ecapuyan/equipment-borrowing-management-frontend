import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContextDef';
import { Box, CircularProgress } from '@mui/material';

const RoleBasedRoute = ({ children, roles }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentUser) {
    // Not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(currentUser.role)) {
    // Logged in but does not have the required role, redirect to home
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RoleBasedRoute;
