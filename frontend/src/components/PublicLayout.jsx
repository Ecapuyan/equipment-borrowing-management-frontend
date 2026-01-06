// src/components/PublicLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';

// A simple layout for public pages like Login and Register
// It just renders the child routes.
function PublicLayout() {
  return <Outlet />;
}

export default PublicLayout;
