// src/components/Layout.jsx
import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContextDef';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  useTheme
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

const drawerWidth = 260;

function Layout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    try {
      handleMenuClose();
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  const isActive = (path) => location.pathname === path;

  const staffLinks = [
    { text: 'Dashboard', path: '/staff-dashboard', icon: <DashboardIcon /> },
    { text: 'Reports', path: '/staff/reports', icon: <AssessmentIcon /> },
    { text: 'Equipment', path: '/staff/manage-equipment', icon: <StorageIcon /> },
    { text: 'Users', path: '/staff/user-management', icon: <PeopleIcon /> },
    { text: 'Reservations', path: '/staff/manage-reservations', icon: <BookOnlineIcon /> },
  ];

  const residentLinks = [
    { text: 'Dashboard', path: '/resident-dashboard', icon: <DashboardIcon /> },
    { text: 'Borrow Equipment', path: '/resident/borrow-equipment', icon: <ViewListIcon /> },
    { text: 'My Reservations', path: '/resident/my-reservations', icon: <BookOnlineIcon /> },
  ];

  // Drawer Content with Modern Gradient Style
  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'primary.dark', color: 'white' }}>
      {/* Sidebar Header */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar 
          sx={{ bgcolor: 'secondary.main', width: 40, height: 40, boxShadow: 3 }}
        >
          {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
        </Avatar>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="subtitle1" fontWeight="bold" noWrap>
            {currentUser?.email?.split('@')[0]}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.7, textTransform: 'capitalize' }}>
            {currentUser?.role || 'Guest'}
          </Typography>
        </Box>
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      
      {/* Navigation Links */}
      <List sx={{ px: 2, pt: 2, flexGrow: 1 }}>
        {currentUser && (currentUser.role === 'staff' ? staffLinks : residentLinks).map((item) => (
          <ListItemButton 
            component={RouterLink} 
            to={item.path} 
            key={item.text}
            selected={isActive(item.path)}
            sx={{
              borderRadius: 2,
              mb: 1,
              '&.Mui-selected': {
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' },
                '& .MuiListItemIcon-root': { color: 'secondary.light' },
              },
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' },
            }}
          >
            <ListItemIcon sx={{ color: isActive(item.path) ? 'secondary.light' : 'rgba(255,255,255,0.7)', minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: 14, fontWeight: isActive(item.path) ? 600 : 400 }} />
          </ListItemButton>
        ))}
      </List>

      <Box sx={{ p: 2 }}>
        <Typography variant="caption" sx={{ opacity: 0.5, display: 'block', textAlign: 'center' }}>
            Masambong System v1.0
        </Typography>
      </Box>
    </Box>
  );
  
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Modern Top AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          color: 'text.primary',
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
          
          <Box sx={{ flexGrow: 1 }}>
             <Typography variant="h6" color="primary.main" fontWeight={700}>
                Barangay Masambong
             </Typography>
             <Typography variant="caption" color="text.secondary">
                Equipment Management System
             </Typography>
          </Box>

          {/* User Menu */}
          {currentUser ? (
             <Box>
                <IconButton onClick={handleMenuOpen} size="small" sx={{ ml: 2 }}>
                   <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                      {currentUser?.email?.charAt(0).toUpperCase()}
                   </Avatar>
                </IconButton>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    PaperProps={{
                        elevation: 3,
                        sx: { mt: 1.5, minWidth: 150, borderRadius: 2 }
                    }}
                >
                    <MenuItem component={RouterLink} to="/profile" onClick={handleMenuClose}>
                        <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon> 
                        My Profile
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout}>
                        <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon> 
                        Logout
                    </MenuItem>
                </Menu>
             </Box>
          ) : (
             <IconButton component={RouterLink} to="/login" color="primary">
               <LoginIcon />
             </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{ 
            flexGrow: 1, 
            p: 3, 
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            minHeight: '100vh',
            bgcolor: 'background.default'
        }}
      >
        <Toolbar /> 
        <Outlet />
      </Box>
    </Box>
  );
}

export default Layout;

