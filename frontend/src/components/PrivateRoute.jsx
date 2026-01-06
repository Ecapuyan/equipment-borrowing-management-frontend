// src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContextDef';
import { Box, CircularProgress, Typography } from '@mui/material';

const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    // This is handled by the AuthProvider now, but as a fallback.
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading user data...</Typography>
      </Box>
    );
  }

  if (!currentUser) {
    // Not logged in, redirect to login page, preserving the intended location
    return <Navigate to="/login" replace />;
  }

  // If logged in, render the children (the protected layout)
  return children;
};

export default PrivateRoute;
