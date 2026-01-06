// src/components/Layout.jsx
import React, { useState } from 'react';
import { Outlet, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContextDef';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItemButton, // Changed from ListItem
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Button,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import StorageIcon from '@mui/icons-material/Storage';
import ViewListIcon from '@mui/icons-material/ViewList';

const drawerWidth = 240;

function Layout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  const staffLinks = [
    { text: 'Dashboard', path: '/staff-dashboard', icon: <DashboardIcon /> },
    { text: 'Reports', path: '/staff/reports', icon: <AssessmentIcon /> },
    { text: 'Manage Equipment', path: '/staff/manage-equipment', icon: <StorageIcon /> },
    { text: 'Manage Users', path: '/staff/user-management', icon: <PeopleIcon /> },
    { text: 'Manage Reservations', path: '/staff/manage-reservations', icon: <BookOnlineIcon /> },
  ];

  const residentLinks = [
    { text: 'Dashboard', path: '/resident-dashboard', icon: <DashboardIcon /> },
    { text: 'Borrow Equipment', path: '/resident/borrow-equipment', icon: <ViewListIcon /> },
    { text: 'My Reservations', path: '/resident/my-reservations', icon: <BookOnlineIcon /> },
  ];

  const userLinks = [
    { text: 'My Profile', path: '/profile', icon: <PersonIcon /> },
  ];

  const drawerContent = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap>
          Borrowing System
        </Typography>
      </Toolbar>
      <Divider />
      {currentUser && (
        <>
          <List>
            {currentUser.role === 'staff' && staffLinks.map((item) => (
              <ListItemButton component={RouterLink} to={item.path} key={item.text}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            ))}
            {currentUser.role === 'resident' && residentLinks.map((item) => (
              <ListItemButton component={RouterLink} to={item.path} key={item.text}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            ))}
          </List>
          <Divider />
          <List>
            {userLinks.map((item) => (
              <ListItemButton component={RouterLink} to={item.path} key={item.text}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            ))}
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </List>
        </>
      )}
    </div>
  );
  
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Dashboard
          </Typography>
          {!currentUser && (
            <Button color="inherit" component={RouterLink} to="/login" startIcon={<LoginIcon />}>
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawerContent}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar /> {/* Spacer for the AppBar */}
        <Outlet />
      </Box>
    </Box>
  );
}

export default Layout;

